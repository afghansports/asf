/**
 * i18n scaffolding. Keeps copy strings keyed for translation. English is the
 * source bundle; Dari (`fa-AF`) and Pashto (`ps`) provide translations and fall
 * back to English for any key they omit.
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

type MessageKey = keyof typeof en;
type Bundle = Partial<Record<MessageKey, string>>;

// Dari (Afghan Persian, fa-AF) — RTL.
const faAF: Bundle = {
  "nav.home": "خانه",
  "nav.events": "رویدادها",
  "nav.teams": "تیم‌ها",
  "nav.tournaments": "مسابقات",
  "nav.reels": "ریل‌ها",
  "nav.polls": "نظرسنجی‌ها",
  "nav.gallery": "گالری",
  "nav.news": "اخبار",
  "nav.login": "ورود",
  "nav.signup": "عضویت",
  "common.save": "ذخیره",
  "common.cancel": "لغو",
  "common.confirm": "تأیید",
  "common.delete": "حذف",
  "common.search": "جستجو",
  "common.signOut": "خروج",
  "auth.minAge": "برای استفاده از ASF باید حداقل ۱۳ سال سن داشته باشید.",
  "auth.parentalConsent": "کاربران زیر ۱۶ سال برای کسب رضایت به ایمیل والدین یا سرپرست نیاز دارند.",
  "feed.empty": "هنوز هیچ ریلی وجود ندارد.",
  "feed.upload": "بارگذاری ریل",
};

// Pashto (ps) — RTL.
const ps: Bundle = {
  "nav.home": "کور",
  "nav.events": "پېښې",
  "nav.teams": "ټیمونه",
  "nav.tournaments": "سیالۍ",
  "nav.reels": "ریلونه",
  "nav.polls": "نظرپوښتنې",
  "nav.gallery": "ګالري",
  "nav.news": "خبرونه",
  "nav.login": "ننوتل",
  "nav.signup": "غړیتوب",
  "common.save": "خوندي کول",
  "common.cancel": "لغوه کول",
  "common.confirm": "تایید",
  "common.delete": "ړنګول",
  "common.search": "لټون",
  "common.signOut": "وتل",
  "auth.minAge": "د ASF کارولو لپاره باید لږ تر لږه ۱۳ کلن اوسئ.",
  "auth.parentalConsent": "د ۱۶ کلونو نه کم عمره کاروونکي د رضایت لپاره د مور و پلار یا سرپرست بریښنالیک ته اړتیا لري.",
  "feed.empty": "تر اوسه هیڅ ریل نشته.",
  "feed.upload": "ریل پورته کول",
};

const LOCALES: Record<Locale, Bundle> = {
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

export function t(key: MessageKey): string {
  const bundle = LOCALES[activeLocale];
  return bundle[key] ?? en[key] ?? key;
}

export const SUPPORTED_LOCALES: { code: Locale; label: string; nativeLabel: string; rtl: boolean }[] = [
  { code: "en", label: "English", nativeLabel: "English", rtl: false },
  { code: "fa-AF", label: "Dari", nativeLabel: "دری", rtl: true },
  { code: "ps", label: "Pashto", nativeLabel: "پښتو", rtl: true },
];
