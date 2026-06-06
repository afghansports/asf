import type { Metadata } from "next";
import Link from "next/link";
import { Building, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "Clubs",
  description: "Multi-team clubs in the ASF community.",
};

export default async function ClubsListPage() {
  const enabled = await isFeatureEnabled("module.clubs");
  if (!enabled) return <ModuleDisabled name="Clubs" />;

  const supabase = await createClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, slug, name, short_name, description, logo_url, country_code, state_province, city, team_count, member_count, founded_year")
    .eq("is_active", true)
    .order("name")
    .limit(60);

  return (
    <>
      <PageHero
        eyebrow="Hierarchy"
        title="Clubs"
        subtitle="Member organizations operating one or more teams across the diaspora."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
          {!clubs || clubs.length === 0 ? (
            <EmptyState
              icon={<Building className="w-5 h-5" />}
              title="No clubs yet."
              description="Clubs sit between chapters and teams. Charter your first one from the admin console."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clubs/${c.slug}`}
                    className="group flex flex-col h-full p-5 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex w-10 h-10 rounded bg-asf-red text-white items-center justify-center font-condensed font-bold text-sm">
                        {(c.short_name ?? c.name).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-base text-asf-text truncate">{c.name}</p>
                        <p className="text-xs text-asf-muted inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[c.city, c.state_province].filter(Boolean).join(", ") || c.country_code}
                        </p>
                      </div>
                    </div>
                    {c.description ? (
                      <p className="mt-3 text-sm text-asf-muted line-clamp-3">{c.description}</p>
                    ) : null}
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-asf-muted">
                      <span>{c.team_count ?? 0} teams</span>
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {c.member_count ?? 0}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
