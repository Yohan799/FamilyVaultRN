/**
 * Shared SMTP Email Helper for Supabase Edge Functions
 * Uses Gmail SMTP with TLS
 */

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send an email via SMTP using Gmail credentials
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
    const smtpServer = Deno.env.get("SMTP_SERVER") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpUsername || !smtpPassword) {
        console.error("[SMTP] Missing SMTP credentials");
        return { success: false, error: "SMTP credentials not configured" };
    }

    const fromAddress = options.from || `Family Vault <${smtpUsername}>`;
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

    console.log(`[SMTP] Sending email to: ${toAddresses.join(", ")}`);
    console.log(`[SMTP] Subject: ${options.subject}`);

    try {
        const client = new SMTPClient({
            connection: {
                hostname: smtpServer,
                port: smtpPort,
                tls: false, // Don't use direct TLS for port 587
                auth: {
                    username: smtpUsername,
                    password: smtpPassword,
                },
            },
        });

        // Connect and upgrade to TLS via STARTTLS
        await client.connectTLS();

        await client.send({
            from: fromAddress,
            to: toAddresses,
            subject: options.subject,
            content: "auto",
            html: options.html,
            replyTo: options.replyTo,
        });

        await client.close();

        console.log(`[SMTP] Email sent successfully to: ${toAddresses.join(", ")}`);
        return { success: true };
    } catch (error: any) {
        console.error("[SMTP] Failed to send email:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get the default sender address from environment
 */
export function getDefaultSender(): string {
    const smtpUsername = Deno.env.get("SMTP_USERNAME") || "noreply@example.com";
    return `Family Vault <${smtpUsername}>`;
}
