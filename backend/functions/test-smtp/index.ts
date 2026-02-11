import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from "../_shared/smtp.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email } = await req.json();
        const toEmail = email || "yohan@vriksha.ai";

        console.log(`Sending test email to ${toEmail}`);

        const result = await sendEmail({
            to: toEmail,
            subject: "Test Email from FamilyVaultRN",
            html: "<h1>SMTP Test</h1><p>This is a test email from your local Supabase Edge Function.</p>",
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});
