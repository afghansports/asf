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
 * survives reloads. `tone` styles it for a dark surface (footer) or a light
 * surface (navbar). Server components can read the cookie too if we ever wire
 * server-side rendering of translated strings.
 */
export function LocaleSwitcher({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
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
    // Reload so server components re-render in the new language AND any text the
    // client auto-translator already swapped is reset — critical when switching
    // back to English (otherwise the page stays Dari/Pashto + RTL until reload).
    if (typeof window !== "undefined") window.location.reload();
  }

  const labelCls =
    className ??
    (tone === "light"
      ? "inline-flex items-center gap-2 text-xs text-asf-text"
      : "inline-flex items-center gap-2 text-xs text-white/70");
  const selectCls =
    tone === "light"
      ? "bg-white border border-asf-border rounded px-2 py-1 text-xs text-asf-text focus:outline-none focus:ring-1 focus:ring-asf-red/40 cursor-pointer"
      : "bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer";

  return (
    <label className={labelCls}>
      <Globe className="w-3.5 h-3.5" aria-hidden />
      <span className="sr-only">Language</span>
      <select value={locale} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="text-asf-text">
            {l.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
