"use server";

import { createClient } from "@/lib/supabase/server";

export type OAuthResult = { ok: true; redirectTo: string } | { ok: false; message: string };

/**
 * Start a Google OAuth sign-in. Returns the URL to redirect the browser to.
 * Requires Google OAuth to be configured in Supabase Auth → Providers → Google.
 * Without that config the call returns an error message we surface in the UI.
 */
export async function startGoogleOAuth(redirectAfter: string = "/dashboard"): Promise<OAuthResult> {
  try {
    const supabase = await createClient();
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(redirectAfter)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) return { ok: false, message: error.message };
    if (!data?.url) return { ok: false, message: "No redirect URL returned." };
    return { ok: true, redirectTo: data.url };
  } catch (e) {
    console.error("[oauth/google]", e);
    return { ok: false, message: "Google sign-in is not available right now." };
  }
}
