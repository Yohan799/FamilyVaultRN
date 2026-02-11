import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;

interface RequestBody {
  userId: string;
  otpCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, otpCode }: RequestBody = await req.json();
    console.log("Verifying 2FA OTP for user:", userId);

    if (!userId || !otpCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or otpCode" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP format (must be 6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      console.warn(`Invalid OTP format for user ${userId}`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid OTP format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the most recent unexpired OTP for this user (regardless of code match)
    const { data: verification, error: fetchError } = await supabase
      .from("two_fa_verifications")
      .select("*")
      .eq("user_id", userId)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP verification:", fetchError);
      throw new Error("Failed to verify OTP");
    }

    if (!verification) {
      console.warn(`No valid OTP found for user ${userId}`);
      return new Response(
        JSON.stringify({ success: false, error: "No valid OTP found. Please request a new code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if max attempts exceeded (lockout)
    const currentAttempts = verification.attempt_count || 0;
    if (currentAttempts >= MAX_ATTEMPTS) {
      console.warn(`OTP locked out for user ${userId}: ${currentAttempts} attempts exceeded`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many failed attempts. Please request a new code." 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if the OTP code matches
    if (verification.otp_code !== otpCode) {
      // Increment attempt counter
      const newAttemptCount = currentAttempts + 1;
      console.warn(`Failed OTP attempt for user ${userId}: attempt ${newAttemptCount}/${MAX_ATTEMPTS}`);

      const { error: updateError } = await supabase
        .from("two_fa_verifications")
        .update({ attempt_count: newAttemptCount })
        .eq("id", verification.id);

      if (updateError) {
        console.error("Failed to update attempt count:", updateError);
      }

      // If this was the last attempt, return lockout message
      if (newAttemptCount >= MAX_ATTEMPTS) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Too many failed attempts. Please request a new code." 
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as verified (successful verification)
    const { error: updateError } = await supabase
      .from("two_fa_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Failed to update verification:", updateError);
      throw new Error("Failed to verify OTP");
    }

    console.log("2FA OTP verified successfully for user:", userId);

    return new Response(
      JSON.stringify({ success: true, message: "OTP verified successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
