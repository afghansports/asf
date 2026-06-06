import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, ExternalLink, HelpCircle } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { ContactForm } from "./contact-form";
import { getContentBatch } from "@/lib/cms/site-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Afghan Sports Federation. General inquiries, team registration, Afghan Cup, sponsorship, and volunteering.",
};

/**
 * /contact aside reads contact_address, contact_email, contact_phone,
 * contact_facebook/instagram/twitter/youtube from site_content.
 * Editable from /admin/cms/contact.
 */
export default async function ContactPage() {
  const c = await getContentBatch({
    contact_address: "Northern Virginia, Washington D.C. Metro Area, USA",
    contact_email: "agdcvakbl@gmail.com",
    contact_phone: "",
    contact_facebook: "https://www.facebook.com/AfghanSportsFederation",
    contact_instagram: "",
    contact_twitter: "",
    contact_youtube: "",
  });

  const socials = [
    { url: c.contact_facebook, label: "Facebook" },
    { url: c.contact_instagram, label: "Instagram" },
    { url: c.contact_twitter, label: "Twitter / X" },
    { url: c.contact_youtube, label: "YouTube" },
  ].filter((s) => s.url && s.url.trim());

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch."
        subtitle="Questions, partnerships, volunteer interest, or sponsorship. We read every message."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
          <aside className="lg:col-span-2 space-y-5">
            {c.contact_address ? (
              <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
                <SectionLabel>Headquarters</SectionLabel>
                <p className="inline-flex items-start gap-2 text-sm text-asf-text">
                  <MapPin className="w-4 h-4 mt-0.5 text-asf-muted" aria-hidden />
                  <span className="whitespace-pre-line">{c.contact_address}</span>
                </p>
              </div>
            ) : null}

            <div className="p-5 rounded-lg bg-white border border-asf-border space-y-2">
              <SectionLabel>Email</SectionLabel>
              <a
                href={`mailto:${c.contact_email}`}
                className="inline-flex items-center gap-2 text-sm text-asf-text hover:text-asf-red"
              >
                <Mail className="w-4 h-4 text-asf-muted" aria-hidden />
                {c.contact_email}
              </a>
              {c.contact_phone ? (
                <a
                  href={`tel:${c.contact_phone.replace(/\D/g, "")}`}
                  className="block inline-flex items-center gap-2 text-sm text-asf-text hover:text-asf-red"
                >
                  <Phone className="w-4 h-4 text-asf-muted" aria-hidden />
                  {c.contact_phone}
                </a>
              ) : null}
            </div>

            {socials.length > 0 ? (
              <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
                <SectionLabel>Social</SectionLabel>
                <ul className="space-y-2">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 text-sm text-asf-text hover:text-asf-red"
                      >
                        <ExternalLink className="w-4 h-4 text-asf-muted" aria-hidden />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="p-5 rounded-lg bg-asf-navy text-white space-y-2">
              <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-gold inline-flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" aria-hidden />
                Have a quick question?
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                Most common questions are answered on the FAQ page. Worth a look first.
              </p>
              <Link
                href="/faq"
                className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-asf-gold underline underline-offset-4"
              >
                Visit the FAQ
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
