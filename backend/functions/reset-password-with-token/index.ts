import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetToken, newPassword } = await req.json();

    if (!email || !resetToken || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email, reset token, and new password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify reset token (must be verified within 5 minutes of OTP verification)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: otpRecord, error: fetchError } = await supabase
      .from("password_reset_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("reset_token", resetToken)
      .not("verified_at", "is", null)
      .gt("verified_at", fiveMinutesAgo)
      .single();

    if (fetchError || !otpRecord) {
      console.log("[reset-password-with-token] Invalid or expired token for:", email);
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset token. Please restart the password reset process." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log("[reset-password-with-token] User not found:", email);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("[reset-password-with-token] Password update error:", updateError);
      throw new Error("Failed to update password");
    }

    // Delete the OTP record
    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("id", otpRecord.id);

    // Log password change activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "auth.password_reset",
      resource_type: "user",
      resource_id: user.id,
    });

    console.log("[reset-password-with-token] Password reset successful for:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successful" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[reset-password-with-token] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Password reset failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
