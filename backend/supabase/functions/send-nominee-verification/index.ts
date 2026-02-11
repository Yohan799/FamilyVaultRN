import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/smtp.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  nomineeId: string;
  nomineeEmail: string;
  nomineeName: string;
  userId: string;
}

// Helper function to send push notification
async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ user_id: userId, title, body }),
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { nomineeId, nomineeEmail, nomineeName, userId }: VerificationRequest = await req.json();

    console.log("Sending verification email to:", nomineeEmail, "for nominee:", nomineeName);

    // Generate a unique verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Store verification token in database
    const { error: tokenError } = await supabase
      .from("verification_tokens")
      .insert({
        nominee_id: nomineeId,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error storing verification token:", tokenError);
      throw new Error("Failed to create verification token");
    }

    // Create verification link
    const verificationLink = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")}.lovable.app/verify-nominee?token=${token}`;

    // Send verification email using SMTP
    const emailResult = await sendEmail({
      to: nomineeEmail,
      subject: "Verify Your Nominee Status - Family Vault",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6D28D9; text-align: center;">Family Vault</h1>
          <h2 style="color: #1F2121;">You've Been Added as a Trusted Nominee</h2>
          <p style="color: #626C71; font-size: 16px; line-height: 1.6;">
            Hello ${nomineeName},
          </p>
          <p style="color: #626C71; font-size: 16px; line-height: 1.6;">
            You have been added as a trusted nominee in Family Vault. This means you may be granted access to important documents in case of emergency.
          </p>
          <p style="color: #626C71; font-size: 16px; line-height: 1.6;">
            Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #6D28D9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #626C71; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #6D28D9; font-size: 14px; word-break: break-all;">
            ${verificationLink}
          </p>
          <p style="color: #626C71; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
          <p style="color: #898989; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error("SMTP email failed:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log("Verification email sent successfully via SMTP");

    // Get user's push notification preference and send push if enabled
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("push_notifications_enabled")
        .eq("id", userId)
        .single();

      if (profile?.push_notifications_enabled) {
        await sendPushNotification(
          userId,
          "Verification Sent ✉️",
          `Verification email sent to ${nomineeName}. They have 24 hours to verify.`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification email sent successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-nominee-verification function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
