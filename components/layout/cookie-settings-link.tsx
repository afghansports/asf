"use client";

import { openCookieSettings } from "./cookie-banner";

/**
 * Tiny client component for the Footer "Cookie Settings" link. Re-opens the
 * CookieBanner by clearing the persisted choice and dispatching the event.
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={className}
    >
      Cookie Settings
    </button>
  );
}
