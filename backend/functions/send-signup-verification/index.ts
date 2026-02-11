import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendEmail } from "../_shared/smtp.ts";
import { encode as b64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupOTPRequest {
  email: string;
  name: string;
  password: string;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash the OTP for storage
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return b64Encode(hashBuffer);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, password }: SignupOTPRequest = await req.json();

    console.log(`[send-signup-verification] Processing OTP for: ${email}`);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "An account with this email already exists" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Token expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Hash password for temporary storage
    const passwordHash = await hashOTP(password);

    // Delete any existing tokens for this email
    await supabase
      .from('signup_verification_tokens')
      .delete()
      .eq('email', email);

    // Store the OTP and pending user data
    // Using token field for OTP hash, user_id for password hash temporarily
    const { error: insertError } = await supabase
      .from('signup_verification_tokens')
      .insert({
        user_id: passwordHash, // Temporarily store hashed password here
        email,
        token: otpHash,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[send-signup-verification] Error storing OTP:', insertError);
      throw insertError;
    }

    // Store name in a separate metadata approach - use token field with JSON
    // Actually let's update to include name in a simpler way
    // We'll store as: token = otpHash|name
    await supabase
      .from('signup_verification_tokens')
      .update({ token: `${otpHash}|${name || ''}` })
      .eq('email', email);

    console.log(`[send-signup-verification] Sending OTP email to: ${email}`);

    // Send OTP email using SMTP
    const emailResult = await sendEmail({
      to: email,
      subject: "Your Family Vault Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 30px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 70px; height: 70px; background-color: #F3E8FF; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-size: 32px;">🛡️</span>
                        </div>
                      </div>
                      <h1 style="color: #1F2121; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 10px;">
                        Verify Your Email
                      </h1>
                      <p style="color: #626C71; font-size: 16px; text-align: center; margin: 0 0 30px; line-height: 1.5;">
                        Hi ${name || 'there'},<br/>Use this code to complete your Family Vault registration.
                      </p>
                      <div style="background-color: #F3E8FF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6D28D9;">${otp}</span>
                      </div>
                      <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
                        This code expires in 10 minutes.<br/>
                        If you didn't request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #F9FAFB; border-radius: 0 0 16px 16px;">
                      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                        © ${new Date().getFullYear()} Family Vault. Secure your family's legacy.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (!emailResult.success) {
      console.error("[send-signup-verification] SMTP error:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log("[send-signup-verification] OTP email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-signup-verification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
