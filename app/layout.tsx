import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Playfair_Display, Barlow_Condensed, DM_Sans, Vazirmatn } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/layout/analytics";
import { PwaRegister } from "@/components/layout/pwa-register";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AutoTranslate } from "@/components/i18n/auto-translate";
import { SUPPORTED_LOCALES } from "@/lib/i18n/messages";
import "./globals.css";

/* Per ASF_LAUNCH_PRD.md > Design System > Fonts */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

/* Dari (fa-AF) + Pashto (ps). The three Latin faces above carry no Arabic
   glyphs, so RTL locales were dropping to the OS Arabic font — which renders
   smaller and varies per device. Vazirmatn is a proper Dari/Pashto face with a
   large x-height (covers Persian + Pashto letters) and ships Latin too, so
   mixed runs like "ASF" stay consistent. globals.css swaps it in for :lang(). */
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Afghan Sports Federation",
    template: "%s | Afghan Sports Federation",
  },
  description:
    "Afghan Sports Federation. Building community through sports excellence since 1998.",
  openGraph: {
    title: "Afghan Sports Federation",
    description:
      "Building community through sports excellence since 1998.",
    type: "website",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read locale cookie so the initial HTML has the right `lang` + `dir`. The
  // <LocaleSwitcher /> writes this cookie on change.
  const cookieLocale = cookies().get("asf_locale")?.value;
  const localeMeta = SUPPORTED_LOCALES.find((l) => l.code === cookieLocale);
  const lang = localeMeta?.code ?? "en";
  const dir = localeMeta?.rtl ? "rtl" : "ltr";

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${playfair.variable} ${barlow.variable} ${dmSans.variable} ${vazirmatn.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-body bg-asf-off text-asf-text overflow-x-hidden">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
          <Analytics />
          <PwaRegister />
          <AutoTranslate />
        </ThemeProvider>
      </body>
    </html>
  );
}
