"use server";

import { createClient } from "@/lib/supabase/server";

export type MfaResult<T = unknown> = { ok: true; data?: T } | { ok: false; message: string };

/**
 * 2FA / MFA helpers backed by Supabase Auth's TOTP factor.
 * Flow:
 *   1. enrollMfa()   → returns { factorId, secret, qrCode } so the UI shows the QR.
 *   2. verifyEnrollment(factorId, code) → user types 6-digit code from authenticator app.
 *   3. listFactors() → enumerate enrolled factors for display + unenroll.
 *   4. unenrollMfa(factorId) → remove a factor.
 */

export async function enrollMfa(): Promise<MfaResult<{ factorId: string; secret: string; qrCode: string }>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "ASF authenticator",
    });
    if (error || !data) return { ok: false, message: error?.message ?? "Could not start MFA enrollment." };
    return {
      ok: true,
      data: {
        factorId: data.id,
        secret: data.totp.secret,
        qrCode: data.totp.qr_code,
      },
    };
  } catch (e) {
    console.error("[mfa/enroll]", e);
    return { ok: false, message: "MFA enrollment failed." };
  }
}

export async function verifyEnrollment(input: {
  factorId: string;
  code: string;
}): Promise<MfaResult> {
  try {
    const supabase = await createClient();
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: input.factorId,
    });
    if (cErr || !challenge) return { ok: false, message: cErr?.message ?? "Could not start challenge." };
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: input.factorId,
      challengeId: challenge.id,
      code: input.code,
    });
    if (vErr) return { ok: false, message: vErr.message };
    return { ok: true };
  } catch (e) {
    console.error("[mfa/verify]", e);
    return { ok: false, message: "Verification failed." };
  }
}

export async function listMfaFactors(): Promise<
  MfaResult<Array<{ id: string; friendlyName: string; status: string; createdAt: string }>>
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { ok: false, message: error.message };
    const all = (data?.all ?? data?.totp ?? []).map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? "Authenticator",
      status: f.status,
      createdAt: f.created_at,
    }));
    return { ok: true, data: all };
  } catch (e) {
    console.error("[mfa/list]", e);
    return { ok: false, message: "Could not list factors." };
  }
}

export async function unenrollMfa(factorId: string): Promise<MfaResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    console.error("[mfa/unenroll]", e);
    return { ok: false, message: "Could not remove factor." };
  }
}
