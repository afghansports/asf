"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES } from "@/lib/i18n/messages";

const COOKIE = "asf_locale";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  // 1 year, root path, SameSite=Lax — purely client-side, not auth.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * <LocaleSwitcher /> — small dropdown that flips the active language and the
 * <html> dir/lang attributes. The choice is persisted in a cookie so it
 * survives reloads. Server components can read the cookie too if we ever wire
 * server-side rendering of translated strings.
 *
 * Phase 1: only `en` is fully translated; `fa-AF` and `ps` fall back to `en`
 * keys and flip the page direction to RTL so layout work can begin.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const [locale, setLocale] = useState<string>("en");

  useEffect(() => {
    const saved = readCookie(COOKIE);
    if (saved) {
      setLocale(saved);
      applyLocale(saved);
    }
  }, []);

  function applyLocale(code: string) {
    const meta = SUPPORTED_LOCALES.find((l) => l.code === code);
    if (typeof document !== "undefined") {
      document.documentElement.lang = code;
      document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
    }
  }

  function onChange(code: string) {
    setLocale(code);
    writeCookie(COOKIE, code);
    applyLocale(code);
  }

  return (
    <label className={className ?? "inline-flex items-center gap-2 text-xs text-white/70"}>
      <Globe className="w-3.5 h-3.5" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="text-asf-text">
            {l.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
