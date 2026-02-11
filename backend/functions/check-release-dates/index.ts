import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/smtp.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimeCapsule {
  id: string;
  user_id: string;
  title: string;
  message: string;
  recipient_email: string;
  phone: string | null;
  attachment_url: string | null;
  release_date: string;
  status: string | null;
}

interface Profile {
  full_name: string | null;
  email: string;
  push_notifications_enabled: boolean | null;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking for time capsules ready for release...");

    // Get all capsules that should be released today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: capsulesData, error: capsulesError } = await supabase
      .from("time_capsules")
      .select("*")
      .lte("release_date", today)
      .eq("status", "scheduled")
      .is("deleted_at", null);

    if (capsulesError) {
      console.error("Error fetching capsules:", capsulesError);
      throw capsulesError;
    }

    if (!capsulesData || capsulesData.length === 0) {
      console.log("No capsules ready for release");
      return new Response(
        JSON.stringify({ message: "No capsules to release", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${capsulesData.length} capsules to release`);

    const results = [];

    for (const capsule of capsulesData as TimeCapsule[]) {
      try {
        // Get sender's profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email, push_notifications_enabled")
          .eq("id", capsule.user_id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile for capsule ${capsule.id}:`, profileError);
          continue;
        }

        const profile = profileData as Profile;
        const senderName = profile.full_name || profile.email;

        // Send email to recipient
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">🎁 You Have Received a Time Capsule!</h1>
            <p style="color: #666; font-size: 16px;">
              <strong>${senderName}</strong> has sent you a time capsule that was scheduled to be opened on <strong>${new Date(capsule.release_date).toLocaleDateString()}</strong>.
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">${capsule.title}</h2>
              <p style="color: #555; white-space: pre-wrap;">${capsule.message}</p>
            </div>

            ${capsule.attachment_url ? `
              <p style="color: #666;">
                This time capsule includes an attachment. You can view it by logging into the Family Vault app.
              </p>
            ` : ''}

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              This message was sent from Family Vault - Your Secure Digital Legacy Platform
            </p>
          </div>
        `;

        const emailResult = await sendEmail({
          to: capsule.recipient_email,
          subject: `Time Capsule from ${senderName}: ${capsule.title}`,
          html: emailHtml,
        });

        if (!emailResult.success) {
          console.error(`Error sending email for capsule ${capsule.id}:`, emailResult.error);
          results.push({ id: capsule.id, status: "email_failed", error: emailResult.error });
          continue;
        }

        // Update capsule status
        const { error: updateError } = await supabase
          .from("time_capsules")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
          })
          .eq("id", capsule.id);

        if (updateError) {
          console.error(`Error updating capsule ${capsule.id}:`, updateError);
          results.push({ id: capsule.id, status: "update_failed", error: updateError });
          continue;
        }

        // Send push notification to sender if enabled
        if (profile.push_notifications_enabled) {
          await sendPushNotification(
            capsule.user_id,
            "📦 Time Capsule Released",
            `"${capsule.title}" is now available to view`,
            { type: "time_capsule_released", capsule_id: capsule.id }
          );
        }

        console.log(`Successfully released capsule ${capsule.id} to ${capsule.recipient_email}`);
        results.push({ id: capsule.id, status: "released", recipient: capsule.recipient_email });

      } catch (error) {
        console.error(`Error processing capsule ${capsule.id}:`, error);
        results.push({ id: capsule.id, status: "error", error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Time capsule check completed",
        total: capsulesData.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in check-release-dates function:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
