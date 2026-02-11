import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ========== FCM Push Notification Helpers ==========

// Get OAuth2 access token for FCM v1 API
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const headerEncoded = encode(header);
  const payloadEncoded = encode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange failed:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send FCM notification
async function sendFcmNotification(
  accessToken: string,
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; errorCode?: string }> {
  const projectId = "my-family-vault-ddc11";

  const message = {
    message: {
      token: deviceToken,
      notification: { title, body },
      android: {
        priority: "high" as const,
        notification: { sound: "default", channel_id: "otp_channel" },
      },
      data: data || {},
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("FCM send failed:", errorText);
    try {
      const errorJson = JSON.parse(errorText);
      return { success: false, errorCode: errorJson?.error?.details?.[0]?.errorCode || "UNKNOWN" };
    } catch {
      return { success: false, errorCode: "UNKNOWN" };
    }
  }

  return { success: true };
}

// Send push notification to user's devices by user_id
async function sendOtpPushNotificationByUserId(
  supabase: any,
  userId: string,
  otpCode: string
): Promise<void> {
  try {
    const { data: tokens, error: tokenError } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", userId);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log("No device tokens found for push notification");
      return;
    }

    const accessToken = await getAccessToken();

    const title = "Password Reset Code";
    const body = `Your verification code is: ${otpCode}. Valid for 10 minutes.`;
    const data = { type: "otp", otp_type: "password_reset", code: otpCode };

    let successCount = 0;
    for (const { token } of tokens) {
      const result = await sendFcmNotification(accessToken, token, title, body, data);
      if (result.success) {
        successCount++;
      } else if (result.errorCode === "UNREGISTERED" || result.errorCode === "INVALID_ARGUMENT") {
        await supabase.from("device_tokens").delete().eq("token", token);
        console.log("Cleaned up invalid device token");
      }
    }

    console.log(`Push notification sent to ${successCount}/${tokens.length} devices`);
  } catch (error) {
    console.error("Push notification failed (non-fatal):", error);
  }
}

// ========== Main Handler ==========

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists and get their user_id
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const matchedUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      // Return success even if user doesn't exist (security best practice)
      console.log(`[send-password-reset-otp] User not found: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, OTP has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = matchedUser.id;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP for storage (simple hash for demo - use bcrypt in production)
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + email);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Delete any existing OTPs for this email
    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("email", email.toLowerCase());

    // Store OTP with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from("password_reset_otps")
      .insert({
        email: email.toLowerCase(),
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("[send-password-reset-otp] Insert error:", insertError);
      throw new Error("Failed to store OTP");
    }

    // Send OTP via email using SMTP
    const emailResult = await sendEmail({
      to: email,
      subject: "Password Reset OTP - Family Vault",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6D28D9; text-align: center;">Family Vault</h1>
          <h2 style="text-align: center;">Password Reset Request</h2>
          <p style="text-align: center; font-size: 16px; color: #666;">
            Use this OTP to reset your password. It expires in 10 minutes.
          </p>
          <div style="background: #f3e8ff; padding: 30px; text-align: center; border-radius: 16px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6D28D9;">
              ${otp}
            </span>
          </div>
          <p style="text-align: center; font-size: 14px; color: #999;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error("[send-password-reset-otp] Email send failed:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log("[send-password-reset-otp] Email sent via SMTP");

    // Also send OTP via push notification (non-blocking, email is primary)
    await sendOtpPushNotificationByUserId(supabase, userId, otp);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to email" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-password-reset-otp] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
