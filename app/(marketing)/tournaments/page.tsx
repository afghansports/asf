import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Calendar, MapPin, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "ASF tournaments — Afghan Cup and regional competitions.",
};

const STATUS_TONE: Record<string, string> = {
  announced: "bg-asf-off-2 text-asf-text",
  registration: "bg-asf-gold-light text-asf-text",
  in_progress: "bg-asf-red text-white",
  completed: "bg-asf-green-light text-asf-green",
  cancelled: "bg-asf-red-light text-asf-red",
};

export default async function TournamentsListPage() {
  if (!(await isFeatureEnabled("module.tournaments"))) return <ModuleDisabled name="Tournaments" />;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("id, slug, name, sport, format, banner_url, start_date, end_date, city, state_province, status, is_featured")
    .eq("is_published", true)
    .order("start_date", { ascending: false, nullsFirst: false });
  const list = data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Tournaments"
        title="ASF tournaments."
        subtitle="Afghan Cup, regional cups, and chapter qualifiers. Click any tournament to see the bracket and registered teams."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          {list.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-5 h-5" aria-hidden />}
              title="No tournaments yet."
              description="ASF admins create tournaments here. The first Afghan Cup 2026 entry will appear soon."
            />
          ) : (
            <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => {
                const sport = t.sport ? getSport(t.sport) : undefined;
                const stateName = t.state_province
                  ? US_STATES.find((s) => s.code === t.state_province)?.name ?? t.state_province
                  : null;
                const dateStr = t.start_date
                  ? new Date(t.start_date).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "Date TBD";
                return (
                  <li key={t.id}>
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="group flex flex-col h-full overflow-hidden rounded-lg border border-asf-border bg-white hover:border-asf-red/50 hover:shadow transition-all"
                    >
                      <div
                        className="relative h-40 w-full bg-asf-navy overflow-hidden"
                        style={
                          t.banner_url
                            ? { backgroundImage: `url("${t.banner_url}")`, backgroundSize: "cover", backgroundPosition: "center" }
                            : undefined
                        }
                      >
                        {/* Scrim so status badge + featured pill stay readable on bright photos */}
                        {t.banner_url ? (
                          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10" />
                        ) : null}
                        {!t.banner_url ? (
                          <div className="absolute inset-0 flex items-center justify-center text-white/30">
                            <Trophy className="w-12 h-12" aria-hidden />
                          </div>
                        ) : null}
                        <span
                          className={`absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-md text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase ${STATUS_TONE[t.status] ?? STATUS_TONE.announced}`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                        {t.is_featured ? (
                          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-md bg-asf-gold text-asf-text text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <div className="flex-1 p-5 flex flex-col gap-3">
                        <h3 className="font-display font-bold text-lg text-asf-text leading-snug">
                          {t.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-asf-muted">
                          {sport ? <span>{sport.name}</span> : null}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden />
                            {dateStr}
                          </span>
                          {t.city || stateName ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" aria-hidden />
                              {[t.city, stateName].filter(Boolean).join(", ")}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-auto pt-2 inline-flex items-center justify-between">
                          <span className="font-condensed font-bold text-[0.6rem] tracking-[0.18em] uppercase text-asf-muted">
                            {t.format.replace("_", " ")}
                          </span>
                          <span className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red inline-flex items-center gap-1">
                            View
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden />
                          </span>
                        </div>
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
