import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Become a sponsor of the Afghan Sports Federation. Support community programs and the Afghan Cup.",
};

const TIERS: { code: "platinum" | "gold" | "silver" | "partner"; label: string; tone: string }[] = [
  { code: "platinum", label: "Platinum sponsors", tone: "bg-white" },
  { code: "gold", label: "Gold sponsors", tone: "bg-asf-gold-light" },
  { code: "silver", label: "Silver sponsors", tone: "bg-asf-off-2" },
  { code: "partner", label: "Community partners", tone: "bg-asf-off" },
];

type Sponsor = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
};

export default async function SponsorsPage() {
  if (!(await isFeatureEnabled("module.sponsors"))) return <ModuleDisabled name="Sponsors" />;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("id, name, logo_url, website_url, tier")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const sponsors = (data ?? []) as Sponsor[];

  return (
    <>
      <PageHero
        eyebrow="Sponsors"
        title="Our sponsors and partners."
        subtitle="ASF runs on volunteer time and sponsor support. Thank you to the organizations that make our programs possible."
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12">
          {TIERS.map((t) => {
            const list = sponsors.filter((s) => s.tier === t.code);
            return (
              <div key={t.code} className="space-y-5">
                <SectionLabel>{t.label}</SectionLabel>
                {list.length === 0 ? (
                  <div className="rounded-lg p-8 border border-dashed border-asf-border bg-white text-asf-muted text-sm text-center">
                    No {t.label.toLowerCase()} yet.
                  </div>
                ) : (
                  <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {list.map((s) => (
                      <li key={s.id} className={`rounded-lg p-5 border border-asf-border ${t.tone} flex flex-col items-center gap-3 text-center`}>
                        {s.logo_url ? (
                          <span className="relative block h-16 w-full">
                            <Image src={s.logo_url} alt={s.name} fill className="object-contain" sizes="160px" unoptimized />
                          </span>
                        ) : (
                          <span className="inline-flex w-16 h-16 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <p className="text-sm text-asf-text font-medium">{s.name}</p>
                        {s.website_url ? (
                          <a
                            href={s.website_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs text-asf-muted hover:text-asf-red"
                          >
                            Visit site
                            <ExternalLink className="w-3 h-3" aria-hidden />
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center flex flex-col items-center gap-5">
          <span className="inline-flex w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 items-center justify-center">
            <Heart className="w-5 h-5" aria-hidden />
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight text-balance text-white">
            Become a sponsor.
          </h2>
          <p className="text-white/80 leading-relaxed max-w-xl">
            Reach the Afghan-American sports community across the United States. Tiered packages
            include logo placement, on-site visibility at Afghan Cup, and digital recognition.
          </p>
          <Link
            href="/contact"
            className="mt-2 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
          >
            Talk to ASF
          </Link>
        </div>
      </section>
    </>
  );
}
