import { Resend } from "resend";

/**
 * Resend wrapper. Per ASF_LAUNCH_PRD.md > Reminder #11:
 *   "When the Resend API key is missing, log email content to console and continue.
 *    Never crash the app because email is not configured."
 */

const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.EMAIL_FROM ?? "noreply@afghansportsfederation.com";

const client = apiKey ? new Resend(apiKey) : null;

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  /** HTML body */
  html: string;
  /** Plain text fallback (recommended) */
  text?: string;
  /** Optional reply-to (defaults to EMAIL_ADMIN) */
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  /** Set when delivery was skipped due to missing API key */
  skipped?: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a transactional email via Resend, or no-op (with console log) if no key.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  if (!client) {
    console.log("[email:skipped]", {
      to,
      subject,
      reason: "RESEND_API_KEY not set",
      preview: text ?? html.replace(/<[^>]+>/g, "").slice(0, 200),
    });
    return { ok: true, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo: replyTo ?? process.env.EMAIL_ADMIN,
    });

    if (error) {
      console.error("[email:error]", error);
      return { ok: false, error: error.message ?? String(error) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email:exception]", message);
    return { ok: false, error: message };
  }
}
