/**
 * Honeypot anti-spam helper. Real users never fill the hidden field; bots
 * scrape and fill every input. Combined with min-time-since-render, this
 * catches the bulk of spam without external services like reCAPTCHA.
 *
 * Server check: if the honeypot field is non-empty OR the form was submitted
 * less than `MIN_FILL_MS` after render, treat as spam and silently succeed
 * (don't tell the bot we caught them).
 */

export const HONEYPOT_FIELD = "ase_field"; // looks like a real field name
export const MIN_FILL_MS = 1500;

export function detectSpam(
  honeypotValue: string | null,
  renderedAt: string | null
): boolean {
  if (honeypotValue && honeypotValue.length > 0) return true;
  if (renderedAt) {
    const rendered = Number(renderedAt);
    if (!Number.isFinite(rendered)) return true;
    const elapsed = Date.now() - rendered;
    if (elapsed < MIN_FILL_MS) return true;
  }
  return false;
}
