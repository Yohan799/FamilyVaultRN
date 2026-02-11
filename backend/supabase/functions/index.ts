import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendEmail } from "../_shared/smtp.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InactivityTrigger {
  id: string;
  user_id: string;
  is_active: boolean;
  inactive_days_threshold: number;
  last_activity_at: string;
  custom_message: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  emergency_access_granted: boolean;
}

interface Profile {
  email: string;
  full_name: string | null;
  push_notifications_enabled: boolean | null;
}

interface Nominee {
  id: string;
  email: string;
  full_name: string;
}

// Helper function to send push notification
async function sendPushNotification(
  userId: string, 
  title: string, 
  body: string,
  data?: Record<string, string>
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ user_id: userId, title, body, data }),
    });
    
    if (!response.ok) {
      console.error("Push notification failed:", await response.text());
    } else {
      console.log(`Push notification sent to user ${userId}`);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Starting inactivity check...");

    // Fetch all active inactivity triggers
    const { data: triggers, error: triggersError } = await supabase
      .from("inactivity_triggers")
      .select("*")
      .eq("is_active", true) as { data: InactivityTrigger[] | null; error: any };

    if (triggersError) {
      console.error("Error fetching triggers:", triggersError);
      throw triggersError;
    }

    if (!triggers || triggers.length === 0) {
      console.log("No active triggers found");
      return new Response(JSON.stringify({ message: "No active triggers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${triggers.length} active triggers`);

    const now = new Date();
    const processedUsers: string[] = [];

    for (const trigger of triggers) {
      const lastActivity = new Date(trigger.last_activity_at);
      const daysSinceActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log(`User ${trigger.user_id}: ${daysSinceActivity} days inactive, threshold: ${trigger.inactive_days_threshold}`);

      const daysUntilTrigger = trigger.inactive_days_threshold - daysSinceActivity;

      // Early warning push notifications at 7, 3, and 1 days before threshold
      if (daysUntilTrigger === 7 || daysUntilTrigger === 3 || daysUntilTrigger === 1) {
        await sendInactivityWarningPush(trigger, daysSinceActivity, daysUntilTrigger);
        processedUsers.push(trigger.user_id);
      }

      // Stage 1: Days 1-3 - Alert user via email
      if (daysSinceActivity >= 1 && daysSinceActivity <= 3 && trigger.email_enabled) {
        await sendUserWarning(trigger, daysSinceActivity);
        processedUsers.push(trigger.user_id);
      }

      // Stage 2: Days 4-6 - Alert nominees
      if (daysSinceActivity >= 4 && daysSinceActivity <= 6) {
        await sendNomineeWarnings(trigger, daysSinceActivity);
        processedUsers.push(trigger.user_id);
      }

      // Stage 3: Day 7+ - Grant emergency access
      if (daysSinceActivity >= trigger.inactive_days_threshold && !trigger.emergency_access_granted) {
        await grantEmergencyAccess(trigger, daysSinceActivity);
        processedUsers.push(trigger.user_id);
      }
    }

    console.log(`✅ Processed ${processedUsers.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: processedUsers.length,
        userIds: processedUsers,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-inactivity:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Send push notification warning at specific intervals before threshold
async function sendInactivityWarningPush(
  trigger: InactivityTrigger, 
  inactiveDays: number, 
  daysUntilTrigger: number
) {
  console.log(`📲 Sending inactivity warning push for ${trigger.user_id} (${daysUntilTrigger} days until trigger)`);

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("push_notifications_enabled")
    .eq("id", trigger.user_id)
    .single() as { data: { push_notifications_enabled: boolean | null } | null };

  if (!profile?.push_notifications_enabled) {
    console.log("Push notifications not enabled for user");
    return;
  }

  await sendPushNotification(
    trigger.user_id,
    "⚠️ Inactivity Alert",
    `You haven't logged in for ${inactiveDays} days. Your inactivity trigger will activate in ${daysUntilTrigger} day${daysUntilTrigger === 1 ? '' : 's'}.`,
    { type: "inactivity_warning" }
  );

  console.log(`✅ Inactivity warning push sent to user ${trigger.user_id}`);
}

async function sendUserWarning(trigger: InactivityTrigger, inactiveDays: number) {
  console.log(`📧 Sending user warning for ${trigger.user_id}`);

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, push_notifications_enabled")
    .eq("id", trigger.user_id)
    .single() as { data: Profile | null };

  if (!profile) {
    console.error("Profile not found for user:", trigger.user_id);
    return;
  }

  const customMessage = trigger.custom_message || "We haven't seen you in a while. Please log in to keep your account active.";

  try {
    // Send email
    const emailResult = await sendEmail({
      to: profile.email,
      subject: `Inactivity Alert: ${inactiveDays} days`,
      html: `
        <h1>Hello ${profile.full_name || "there"},</h1>
        <p>You have been inactive for <strong>${inactiveDays} days</strong>.</p>
        <p>${customMessage}</p>
        <p>If you remain inactive for ${trigger.inactive_days_threshold} days, your emergency contacts will be notified.</p>
        <p>Best regards,<br>Family Vault Team</p>
      `,
    });

    if (!emailResult.success) {
      console.error("Failed to send user warning email:", emailResult.error);
    }

    // Send push notification if enabled
    if (profile.push_notifications_enabled) {
      await sendPushNotification(
        trigger.user_id,
        "⚠️ Inactivity Alert",
        `You've been inactive for ${inactiveDays} days. Log in to keep your account active.`,
        { type: "inactivity_warning" }
      );
    }

    // Log alert
    await supabase.from("inactivity_alerts").insert({
      user_id: trigger.user_id,
      alert_stage: "user_warning",
      inactive_days: inactiveDays,
      recipient_type: "user",
      recipient_email: profile.email,
      custom_message: trigger.custom_message,
    });

    console.log(`✅ User warning sent to ${profile.email}`);
  } catch (error) {
    console.error("Error sending user warning:", error);
  }
}

async function sendNomineeWarnings(trigger: InactivityTrigger, inactiveDays: number) {
  console.log(`📧 Sending nominee warnings for ${trigger.user_id}`);

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, push_notifications_enabled")
    .eq("id", trigger.user_id)
    .single() as { data: Profile | null };

  if (!profile) return;

  // Get verified nominees
  const { data: nominees } = await supabase
    .from("nominees")
    .select("id, email, full_name")
    .eq("user_id", trigger.user_id)
    .eq("status", "verified")
    .is("deleted_at", null) as { data: Nominee[] | null };

  if (!nominees || nominees.length === 0) {
    console.log("No verified nominees found");
    return;
  }

  for (const nominee of nominees) {
    try {
      const emailResult = await sendEmail({
        to: nominee.email,
        subject: `Inactivity Alert: ${profile.full_name || profile.email}`,
        html: `
          <h1>Hello ${nominee.full_name},</h1>
          <p><strong>${profile.full_name || profile.email}</strong> has been inactive on Family Vault for <strong>${inactiveDays} days</strong>.</p>
          <p>If they remain inactive for ${trigger.inactive_days_threshold} days total, you will be granted emergency access to their shared documents.</p>
          <p>This is an automated alert from Family Vault's emergency access system.</p>
          <p>Best regards,<br>Family Vault Team</p>
        `,
      });

      if (!emailResult.success) {
        console.error(`Failed to send warning to nominee ${nominee.email}:`, emailResult.error);
      }

      // Log alert
      await supabase.from("inactivity_alerts").insert({
        user_id: trigger.user_id,
        alert_stage: "nominee_warning",
        inactive_days: inactiveDays,
        recipient_type: "nominee",
        recipient_email: nominee.email,
        custom_message: trigger.custom_message,
      });

      console.log(`✅ Nominee warning sent to ${nominee.email}`);
    } catch (error) {
      console.error(`Error sending warning to nominee ${nominee.email}:`, error);
    }
  }

  // Send push notification to user about nominee warnings
  if (profile.push_notifications_enabled) {
    await sendPushNotification(
      trigger.user_id,
      "👥 Nominees Notified",
      `Your nominees have been notified about your ${inactiveDays} days of inactivity.`,
      { type: "nominee_warning" }
    );
  }
}

async function grantEmergencyAccess(trigger: InactivityTrigger, inactiveDays: number) {
  console.log(`🚨 Granting emergency access for ${trigger.user_id}`);

  // Update trigger to grant emergency access
  const { error: updateError } = await supabase
    .from("inactivity_triggers")
    .update({
      emergency_access_granted: true,
      emergency_granted_at: new Date().toISOString(),
    })
    .eq("id", trigger.id);

  if (updateError) {
    console.error("Error granting emergency access:", updateError);
    return;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, push_notifications_enabled")
    .eq("id", trigger.user_id)
    .single() as { data: Profile | null };

  if (!profile) return;

  // Get verified nominees
  const { data: nominees } = await supabase
    .from("nominees")
    .select("id, email, full_name")
    .eq("user_id", trigger.user_id)
    .eq("status", "verified")
    .is("deleted_at", null) as { data: Nominee[] | null };

  if (!nominees || nominees.length === 0) {
    console.log("No verified nominees to notify");
    return;
  }

  for (const nominee of nominees) {
    try {
      const emailResult = await sendEmail({
        to: nominee.email,
        subject: `Emergency Access Granted: ${profile.full_name || profile.email}`,
        html: `
          <h1>Emergency Access Granted</h1>
          <p>Dear ${nominee.full_name},</p>
          <p><strong>${profile.full_name || profile.email}</strong> has been inactive for <strong>${inactiveDays} days</strong>.</p>
          <p>You have now been granted emergency access to their shared documents.</p>
          <p>To access the documents, visit the Family Vault emergency access portal and verify your identity with your email.</p>
          <p><strong>This access is granted due to prolonged inactivity and is part of the user's emergency preparedness plan.</strong></p>
          <p>Best regards,<br>Family Vault Team</p>
        `,
      });

      if (!emailResult.success) {
        console.error(`Failed to notify nominee ${nominee.email}:`, emailResult.error);
      }

      // Log alert
      await supabase.from("inactivity_alerts").insert({
        user_id: trigger.user_id,
        alert_stage: "emergency_granted",
        inactive_days: inactiveDays,
        recipient_type: "nominee",
        recipient_email: nominee.email,
      });

      console.log(`✅ Emergency access notification sent to ${nominee.email}`);
    } catch (error) {
      console.error(`Error notifying nominee ${nominee.email}:`, error);
    }
  }

  // Send push notification to user about emergency access
  if (profile.push_notifications_enabled) {
    await sendPushNotification(
      trigger.user_id,
      "🚨 Emergency Access Granted",
      "Emergency access has been granted to your nominees due to prolonged inactivity.",
      { type: "emergency_access" }
    );
  }

  console.log("✅ Emergency access granted and nominees notified");
}
