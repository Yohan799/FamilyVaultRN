import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as b64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifySignupOTPRequest {
    email: string;
    otp: string;
    password: string;
}

// Hash the OTP for comparison
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
        const { email, otp, password }: VerifySignupOTPRequest = await req.json();

        console.log(`[verify-signup-otp] Verifying OTP for: ${email}`);

        if (!email || !otp || !password) {
            return new Response(
                JSON.stringify({ error: "email, otp, and password are required" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get the verification token
        const { data: tokenData, error: fetchError } = await supabase
            .from('signup_verification_tokens')
            .select('*')
            .eq('email', email)
            .is('used_at', null)
            .single();

        if (fetchError || !tokenData) {
            console.error('[verify-signup-otp] Token not found:', fetchError);
            return new Response(
                JSON.stringify({ error: "No pending verification found for this email" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        // Check if expired
        if (new Date(tokenData.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        // Parse stored data: token contains "otpHash|name"
        const [storedOtpHash, name] = tokenData.token.split('|');

        // Hash the provided OTP and compare
        const providedOtpHash = await hashOTP(otp);

        if (providedOtpHash !== storedOtpHash) {
            return new Response(
                JSON.stringify({ error: "Invalid verification code" }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
        }

        console.log(`[verify-signup-otp] OTP verified, creating user account`);

        // OTP verified! Now create the actual user account
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Mark email as confirmed since we verified via OTP
            user_metadata: {
                full_name: name || '',
            },
        });

        if (authError) {
            console.error('[verify-signup-otp] Error creating user:', authError);
            throw authError;
        }

        // Mark token as used
        await supabase
            .from('signup_verification_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('id', tokenData.id);

        // Create profile if needed (trigger might handle this, but let's be safe)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: name || '',
                email_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('[verify-signup-otp] Error creating profile:', profileError);
            // Don't throw - user was created, profile might be created by trigger
        }

        console.log(`[verify-signup-otp] User account created successfully`);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Account created successfully",
                userId: authData.user.id
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    } catch (error: any) {
        console.error("[verify-signup-otp] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
};

serve(handler);
