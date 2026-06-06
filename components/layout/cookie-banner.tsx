"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CookieBanner. Per ASF_LAUNCH_PRD.md > STEP 4 > CookieBanner.
 * Reads/writes localStorage key `asf_cookie_consent`. Hides once a choice is
 * made. Re-openable by dispatching a window event `asf:open-cookie-settings`
 * (the Footer "Cookie Settings" link uses this).
 */

const STORAGE_KEY = "asf_cookie_consent";
const OPEN_EVENT = "asf:open-cookie-settings";
const CONSENT_UPDATED_EVENT = "asf:cookie-consent-updated";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const choice = window.localStorage.getItem(STORAGE_KEY);
      if (!choice) setVisible(true);
    } catch {
      // Storage may be unavailable (private mode). Show banner anyway.
      setVisible(true);
    }
    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  function record(choice: "accepted" | "declined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* no-op */
    }
    window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 overflow-hidden border-t border-asf-border bg-white shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-8 sm:py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex min-w-0 items-start gap-3 pr-8 sm:pr-0">
          <Cookie className="w-5 h-5 text-asf-navy mt-0.5 shrink-0" aria-hidden />
          <p className="min-w-0 text-xs sm:text-sm text-asf-text leading-relaxed break-words">
            We use cookies.{" "}
            <a
              href="/privacy"
              className="inline-block underline underline-offset-4 text-asf-navy hover:text-asf-red"
            >
              Privacy Policy
            </a>
            .
          </p>
          <button
            aria-label="Close cookie banner"
            onClick={() => setVisible(false)}
            className="absolute right-0 top-0 inline-flex items-center justify-center w-7 h-7 text-asf-muted hover:text-asf-text rounded-md hover:bg-asf-off-2 sm:static sm:ml-1 sm:shrink-0"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-2 sm:mt-0 sm:flex sm:w-auto sm:items-center sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => record("declined")}
            className="w-full text-asf-text hover:bg-asf-off-2 sm:w-auto"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={() => record("accepted")}
            className="w-full bg-asf-navy text-white hover:bg-asf-navy-light sm:w-auto"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}
