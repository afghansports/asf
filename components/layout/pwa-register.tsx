"use client";

import { useEffect } from "react";

/**
 * PWA install prompts are disabled for now. Keep this component mounted so it
 * can clean up older service workers that may still be controlling browsers.
 */

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((e) => console.warn("[pwa] unregister failed", e));
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener("beforeinstallprompt", onInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  return null;
}
