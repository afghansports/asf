import Link from "next/link";
import { Mail, ExternalLink } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "./newsletter-form";
import { CookieSettingsLink } from "./cookie-settings-link";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { getContentBatch } from "@/lib/cms/site-content";
import { getFlags } from "@/lib/features/flags";
import {
  FOOTER_QUICK_LINKS,
  NAV_FLAG_KEYS,
  visibleLinks,
} from "@/lib/features/nav-config";

/**
 * Site Footer. Per ASF_LAUNCH_PRD.md > STEP 4 > Footer.
 *
 * Layout (desktop): four columns —
 *   1. Brand (logo + tagline + email)
 *   2. Quick Links
 *   3. Sports
 *   4. Connect + Newsletter
 * Bottom row: copyright, Privacy, Terms, Cookie Settings.
 *
 * Quick Links and the Sports column are filtered by module flags so a module
 * switched off in /admin/modules drops out of the footer too. The link → flag
 * map is shared with the navbar + mobile drawer (lib/features/nav-config.ts).
 */

const SPORTS_LINKS = [
  { href: "/teams?sport=soccer", label: "Soccer" },
  { href: "/teams?sport=basketball", label: "Basketball" },
  { href: "/teams?sport=volleyball", label: "Volleyball" },
  { href: "/teams?sport=bowling", label: "Bowling" },
  { href: "/teams?sport=table_tennis", label: "Table Tennis" },
];

export async function Footer() {
  const c = await getContentBatch({
    footer_description:
      "Building community through sports excellence since 1998. Five sports, one federation, every Afghan community.",
    footer_copyright: `${new Date().getFullYear()} Afghan Sports Federation. All rights reserved.`,
    contact_email: "agdcvakbl@gmail.com",
    contact_facebook: "https://www.facebook.com/AfghanSportsFederation",
  });

  const flags = await getFlags(NAV_FLAG_KEYS);
  const quickLinks = visibleLinks(FOOTER_QUICK_LINKS, flags);
  // The Sports column links into /teams?sport=… — only meaningful when the
  // Teams module is on.
  const showSports = flags["module.teams"] !== false;

  return (
    <footer className="bg-asf-navy text-white mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 grid gap-10 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-4 space-y-4">
          <Logo size={44} withText textVariant="white" />
          <p className="text-sm text-white/70 leading-relaxed max-w-sm">
            {c.footer_description}
          </p>
          <a
            href={`mailto:${c.contact_email}`}
            className="inline-flex items-center gap-2 text-sm text-white/85 hover:text-asf-gold"
          >
            <Mail className="w-4 h-4" aria-hidden />
            <span>{c.contact_email}</span>
          </a>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2">
          <FooterHeading>Quick Links</FooterHeading>
          <ul className="mt-4 space-y-2">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-white/75 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sports */}
        {showSports ? (
          <div className="md:col-span-2">
            <FooterHeading>Sports</FooterHeading>
            <ul className="mt-4 space-y-2">
              {SPORTS_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/75 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Connect + Newsletter */}
        <div className="md:col-span-4 space-y-6">
          <div>
            <FooterHeading>Connect</FooterHeading>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={c.contact_facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${c.contact_email}`}
                  className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white"
                >
                  <Mail className="w-4 h-4" aria-hidden />
                  <span>Email</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <FooterHeading>Newsletter</FooterHeading>
            <p className="mt-3 mb-3 text-sm text-white/70">
              Updates on Afghan Cup, events, and community news.
            </p>
            <NewsletterForm variant="footer" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/55">
            (c) {c.footer_copyright}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <li>
              <Link href="/privacy" className="text-white/65 hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-white/65 hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <CookieSettingsLink className="text-white/65 hover:text-white" />
            </li>
            <li>
              <LocaleSwitcher />
            </li>
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-condensed font-bold text-xs tracking-[0.24em] uppercase text-asf-gold">
      {children}
    </h3>
  );
}
