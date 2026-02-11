import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;

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

// Send push notification to user's devices
async function sendOtpPushNotification(
  supabase: any,
  userId: string,
  otpCode: string,
  otpType: "2fa" | "password_reset"
): Promise<void> {
  try {
    // Get user's device tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", userId);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log("No device tokens found for push notification");
      return;
    }

    const accessToken = await getAccessToken();

    const title = otpType === "2fa" ? "Your 2FA Code" : "Password Reset Code";
    const body = `Your verification code is: ${otpCode}. Valid for 10 minutes.`;
    const data = { type: "otp", otp_type: otpType, code: otpCode };

    let successCount = 0;
    for (const { token } of tokens) {
      const result = await sendFcmNotification(accessToken, token, title, body, data);
      if (result.success) {
        successCount++;
      } else if (result.errorCode === "UNREGISTERED" || result.errorCode === "INVALID_ARGUMENT") {
        // Clean up invalid token
        await supabase.from("device_tokens").delete().eq("token", token);
        console.log("Cleaned up invalid device token");
      }
    }

    console.log(`Push notification sent to ${successCount}/${tokens.length} devices`);
  } catch (error) {
    // Don't fail the OTP request if push fails - email is the primary delivery
    console.error("Push notification failed (non-fatal):", error);
  }
}

// ========== Main Handler ==========

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token length:", token.length, "Token prefix:", token.substring(0, 20) + "...");

    // Create a client with the user's token to validate it
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("JWT validation failed:", authError?.message || "No user returned");
      return new Response(
        JSON.stringify({ error: "Invalid or expired token. Please log out and log in again." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id, "email:", user.email);

    // Use authenticated user's email and ID - ignore any client-provided values
    const userId = user.id;
    const email = user.email;

    if (!email) {
      console.error("User has no email address");
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check how many OTPs were sent in the last window
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

    const { count, error: countError } = await supabase
      .from("two_fa_verifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart.toISOString());

    if (countError) {
      console.error("Rate limit check failed:", countError);
      throw new Error("Failed to check rate limit");
    }

    if (count && count >= MAX_OTP_REQUESTS_PER_WINDOW) {
      console.warn(`Rate limit exceeded for user ${userId}: ${count} requests in last ${RATE_LIMIT_WINDOW_MINUTES} minutes`);
      return new Response(
        JSON.stringify({
          error: `Too many OTP requests. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes before trying again.`
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending 2FA OTP to: ${email} for user: ${userId} (${count || 0}/${MAX_OTP_REQUESTS_PER_WINDOW} requests in window)`);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: dbError } = await supabase
      .from("two_fa_verifications")
      .insert({
        user_id: userId,
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to store OTP: ${dbError.message}`);
    }

    // Send OTP via email using SMTP
    const emailResult = await sendEmail({
      to: email,
      subject: "Your Two-Factor Authentication Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6D28D9; text-align: center;">Two-Factor Authentication</h1>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Your verification code is:</p>
          <div style="background: #F3E8FF; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #6D28D9; font-size: 36px; margin: 0; letter-spacing: 8px;">${otpCode}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Family Vault - Secure Your Family's Legacy</p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error("Email send failed:", emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log("Email sent successfully via SMTP");

    // Also send OTP via push notification (non-blocking, email is primary)
    await sendOtpPushNotification(supabase, userId, otpCode, "2fa");

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
