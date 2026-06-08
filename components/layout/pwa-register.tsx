"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

/**
 * Registers /sw.js once on mount. Also surfaces the "Add to home screen"
 * banner using the deferred BeforeInstallPromptEvent on Chrome / Edge.
 */
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [cookieReady, setCookieReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((e) => console.warn("[pwa] unregister failed", e));
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);

    try {
      const dismissed = window.localStorage.getItem("asf_pwa_dismissed");
      if (dismissed) setHidden(true);
      const cookieChoice = window.localStorage.getItem("asf_cookie_consent");
      if (cookieChoice) setCookieReady(true);
    } catch {}

    const onCookieChoice = () => setCookieReady(true);
    window.addEventListener("asf:cookie-consent-updated", onCookieChoice);

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("asf:cookie-consent-updated", onCookieChoice);
    };
  }, []);

  if (!deferred || hidden || !cookieReady) return null;

  function dismiss() {
    setHidden(true);
    try {
      window.localStorage.setItem("asf_pwa_dismissed", "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      try {
        window.localStorage.setItem("asf_pwa_dismissed", "1");
      } catch {}
    }
    setDeferred(null);
    setHidden(true);
  }

  return (
    <div className="fixed left-4 right-auto bottom-4 z-30 w-[calc(100vw-2rem)] sm:left-auto sm:right-4 sm:w-full sm:max-w-sm pointer-events-none">
      <div className="pointer-events-auto min-w-0 rounded-lg bg-asf-navy text-white shadow-2xl border border-white/10 p-4 flex items-start gap-3">
        <span className="inline-flex w-9 h-9 rounded-full bg-asf-red items-center justify-center shrink-0">
          <Download className="w-4 h-4" aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-gold">
            Install ASF
          </p>
          <p className="max-w-[13rem] sm:max-w-none text-sm mt-1 leading-relaxed break-words">
            Add ASF to your home screen for faster access and offline support.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={install}
              className="h-8 px-3 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-red-dark"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-8 px-3 rounded-md text-white/85 text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-white/10"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
