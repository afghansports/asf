/**
 * i18n scaffolding. Keeps copy strings keyed for future translation. Phase 1
 * ships English only; Dari (`fa-AF`) and Pashto (`ps`) bundles can be added
 * to the LOCALES record without code changes elsewhere.
 *
 * To use: import { t, useLocale } from "@/lib/i18n/messages"; <p>{t("home.cta")}</p>
 *
 * Until proper next-intl is wired, this is a flat key/value map per locale
 * with English fallback.
 */

type Locale = "en" | "fa-AF" | "ps";

const en = {
  "nav.home": "Home",
  "nav.events": "Events",
  "nav.teams": "Teams",
  "nav.tournaments": "Tournaments",
  "nav.reels": "Reels",
  "nav.polls": "Polls",
  "nav.gallery": "Gallery",
  "nav.news": "News",
  "nav.login": "Login",
  "nav.signup": "Join",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.delete": "Delete",
  "common.search": "Search",
  "common.signOut": "Sign out",
  "auth.minAge": "You must be at least 13 years old to use ASF.",
  "auth.parentalConsent": "Users under 16 need a parent or guardian email for consent.",
  "feed.empty": "No reels yet.",
  "feed.upload": "Upload reel",
} as const;

// Stub bundles — empty objects fall through to English keys.
const faAF: Partial<typeof en> = {};
const ps: Partial<typeof en> = {};

const LOCALES: Record<Locale, Partial<typeof en>> = {
  en,
  "fa-AF": faAF,
  ps,
};

let activeLocale: Locale = "en";

export function setLocale(l: Locale) {
  activeLocale = l;
}

export function getLocale(): Locale {
  return activeLocale;
}

export function isRtl(l: Locale = activeLocale): boolean {
  return l === "fa-AF" || l === "ps";
}

export function t(key: keyof typeof en): string {
  const bundle = LOCALES[activeLocale];
  const fromBundle = (bundle as Partial<typeof en>)[key];
  return (fromBundle as string | undefined) ?? (en as Record<string, string>)[key] ?? key;
}

export const SUPPORTED_LOCALES: { code: Locale; label: string; nativeLabel: string; rtl: boolean }[] = [
  { code: "en", label: "English", nativeLabel: "English", rtl: false },
  { code: "fa-AF", label: "Dari", nativeLabel: "دری", rtl: true },
  { code: "ps", label: "Pashto", nativeLabel: "پښتو", rtl: true },
];
