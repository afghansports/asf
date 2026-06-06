import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users, Building2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { US_STATES } from "@/lib/data/us-states";
import { FillImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Chapters",
  description: "Regional ASF chapters across the United States and abroad.",
};

export default async function ChaptersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select(
      "id, slug, name, description, logo_url, country_code, state_province, city, member_count, team_count, is_active, founded_year"
    )
    .eq("is_active", true)
    .order("name");
  const chapters = data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Chapters"
        title="ASF chapters."
        subtitle="Regional sub-organizations that run local programs, leagues, and Cup qualifiers."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          {chapters.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-5 h-5" aria-hidden />}
              title="No chapters yet."
              description="ASF chapters are stood up by chapter managers as the federation grows. Check back soon."
            />
          ) : (
            <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((c) => {
                const stateName = c.state_province
                  ? US_STATES.find((s) => s.code === c.state_province)?.name ?? c.state_province
                  : null;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/chapters/${c.slug}`}
                      className="group flex flex-col h-full p-5 rounded-lg border border-asf-border bg-white hover:border-asf-red/50 hover:shadow transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="relative inline-flex w-12 h-12 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold overflow-hidden shrink-0">
                          {c.logo_url ? (
                            <FillImage src={c.logo_url} alt="" className="object-cover" sizes="48px" />
                          ) : (
                            <span aria-hidden>{c.name.charAt(0).toUpperCase()}</span>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-lg text-asf-text leading-snug">
                            {c.name}
                          </h3>
                          <p className="text-xs text-asf-muted inline-flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3" aria-hidden />
                            {[c.city, stateName].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                      {c.description ? (
                        <p className="mt-3 text-sm text-asf-muted line-clamp-3">{c.description}</p>
                      ) : null}
                      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-asf-muted">
                        <span className="inline-flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" aria-hidden />
                            {c.member_count ?? 0}
                          </span>
                          <span>{c.team_count ?? 0} teams</span>
                          {c.founded_year ? <span>est. {c.founded_year}</span> : null}
                        </span>
                        <span className="font-condensed font-bold text-[0.65rem] tracking-[0.18em] uppercase text-asf-red inline-flex items-center gap-1">
                          Open
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
