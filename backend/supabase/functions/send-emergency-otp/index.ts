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

interface SendOTPRequest {
  nomineeEmail: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nomineeEmail }: SendOTPRequest = await req.json();

    if (!nomineeEmail) {
      return new Response(
        JSON.stringify({ error: "Nominee email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Sending OTP to ${nomineeEmail}`);

    // Check if nominee exists and is verified
    const { data: nominee, error: nomineeError } = await supabase
      .from("nominees")
      .select("id, user_id, email, full_name, status")
      .eq("email", nomineeEmail)
      .eq("status", "verified")
      .is("deleted_at", null)
      .single();

    if (nomineeError || !nominee) {
      console.error("Nominee not found or not verified:", nomineeError);
      return new Response(
        JSON.stringify({ error: "Nominee not found or not verified" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if emergency access is granted for this user
    const { data: trigger, error: triggerError } = await supabase
      .from("inactivity_triggers")
      .select("emergency_access_granted")
      .eq("user_id", nominee.user_id)
      .eq("is_active", true)
      .single();

    if (triggerError || !trigger || !trigger.emergency_access_granted) {
      console.error("Emergency access not granted:", triggerError);
      return new Response(
        JSON.stringify({ error: "Emergency access not granted for this account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiration

    // Store OTP in database
    const { error: otpError } = await supabase.from("otp_verifications").insert({
      nominee_email: nomineeEmail,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
      user_id: nominee.user_id,
    });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      throw otpError;
    }

    // Send OTP via email using SMTP
    const emailResult = await sendEmail({
      to: nomineeEmail,
      subject: "Your Emergency Access OTP Code",
      html: `
        <h1>Emergency Access Verification</h1>
        <p>Dear ${nominee.full_name},</p>
        <p>Your OTP code for emergency access is:</p>
        <h2 style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6D28D9;">${otpCode}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p>Best regards,<br>Family Vault Team</p>
      `,
    });

    if (!emailResult.success) {
      console.error("SMTP email failed:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log(`✅ OTP sent to ${nomineeEmail} via SMTP`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-emergency-otp:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});