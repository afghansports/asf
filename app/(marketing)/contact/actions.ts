"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

/**
 * Submit a contact-form entry. Per ASF_LAUNCH_PRD.md > STEP 10 > /contact.
 * INSERTs to `contact_submissions` (RLS allows anon insert), then sends a
 * confirmation email via Resend (no-ops to console if RESEND_API_KEY blank).
 */

export type ContactResult = { ok: true } | { ok: false; message: string };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECTS = new Set([
  "general", "team_registration", "afghan_cup", "volunteer", "sponsorship", "media", "other",
]);

export async function submitContact(input: {
  name: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<ContactResult> {
  try {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const message = input.message.trim();
    if (!name) return { ok: false, message: "Name is required." };
    if (!EMAIL_RX.test(email)) return { ok: false, message: "Enter a valid email address." };
    if (!SUBJECTS.has(input.subject)) return { ok: false, message: "Pick a subject." };
    if (message.length < 20) return { ok: false, message: "Message must be at least 20 characters." };

    const phoneClean = input.phone.replace(/\D/g, "");
    const phoneFull = phoneClean
      ? `+${input.phoneCountryCode || "1"}${phoneClean}`
      : null;

    const supabase = createServiceClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      phone: phoneFull,
      subject: input.subject,
      message,
    });
    if (error) {
      console.error("[contact] insert", error);
      return { ok: false, message: "Could not submit your message." };
    }

    const adminTo = process.env.EMAIL_ADMIN ?? "agdcvakbl@gmail.com";
    await sendEmail({
      to: adminTo,
      subject: `[ASF Contact] ${input.subject}: ${name}`,
      html: `
        <p><b>From:</b> ${escapeHtml(name)} (${escapeHtml(email)})</p>
        <p><b>Subject:</b> ${escapeHtml(input.subject)}</p>
        ${phoneFull ? `<p><b>Phone:</b> ${escapeHtml(phoneFull)}</p>` : ""}
        <p><b>Message:</b></p>
        <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>
      `.trim(),
      text: `From: ${name} (${email})\nSubject: ${input.subject}\n${phoneFull ? `Phone: ${phoneFull}\n` : ""}\n${message}`,
      replyTo: email,
    });

    return { ok: true };
  } catch (e) {
    console.error("[contact] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
