"use client";

import { useTransition, useState } from "react";
import { startGoogleOAuth } from "@/lib/auth/oauth";

/**
 * Drop-in Google sign-in button. Server-side action calls Supabase OAuth
 * with `provider: "google"` and returns the upstream URL; we redirect.
 *
 * Visible whenever the page is rendered. If Google OAuth isn't configured
 * in Supabase Auth, the click surfaces a friendly error.
 */
export function GoogleOAuthButton({
  next = "/dashboard",
  label = "Continue with Google",
  className,
}: {
  next?: string;
  label?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function go() {
    setErr(null);
    start(async () => {
      const r = await startGoogleOAuth(next);
      if (r.ok) {
        window.location.href = r.redirectTo;
      } else {
        setErr(r.message);
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className={
          className ??
          "w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-white border border-asf-border text-asf-text text-sm font-medium hover:bg-asf-off-2 disabled:opacity-50"
        }
      >
        {/* Inline G logo as SVG to avoid an extra request. */}
        <svg viewBox="0 0 18 18" className="w-4 h-4" aria-hidden>
          <path fill="#EA4335" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" />
          <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z" />
          <path fill="#FBBC05" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z" />
        </svg>
        <span>{pending ? "Redirecting" : label}</span>
      </button>
      {err ? <p className="text-xs text-asf-red">{err}</p> : null}
    </div>
  );
}
