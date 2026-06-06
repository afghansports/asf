import type { Metadata } from "next";
import Link from "next/link";
import { Users, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { TeamCard, type TeamCardData } from "@/components/shared/team-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamsFilterBar } from "./teams-filter-bar";

/**
 * /teams. Per ASF_LAUNCH_PRD.md > STEP 8 > /teams.
 * Server component reads filters from searchParams and queries Supabase.
 */

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Find and follow Afghan Sports Federation teams across the United States. Soccer, basketball, volleyball, bowling, and table tennis.",
};

type SearchParams = {
  sport?: string;
  state?: string;
  status?: string;
  sort?: string;
};

export default async function TeamsListPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;

  const supabase = await createClient();
  let query = supabase
    .from("teams")
    .select(
      "id, name, slug, sport, city, state_province, member_count, logo_url, is_looking_for_players, is_asf_affiliate, created_at"
    );

  if (sp.sport) query = query.eq("sport", sp.sport);
  if (sp.state) query = query.eq("state_province", sp.state);
  if (sp.status === "looking") query = query.eq("is_looking_for_players", true);
  if (sp.sort === "alpha") query = query.order("name", { ascending: true });
  else query = query.order("created_at", { ascending: false });

  const { data: teams } = await query.limit(60);
  const list = (teams ?? []) as TeamCardData[];

  return (
    <>
      <PageHero
        eyebrow="Teams"
        title="Find your team."
        subtitle="Browse ASF teams by sport and state. Captains decide who joins; many are actively recruiting."
      >
        <Link
          href="/teams/create"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-asf-red text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
        >
          <PlusCircle className="w-4 h-4" aria-hidden />
          Create a team
        </Link>
      </PageHero>

      <TeamsFilterBar />

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          {list.length === 0 ? (
            <EmptyState
              icon={<Users className="w-5 h-5" aria-hidden />}
              title="No teams match those filters."
              description="Try clearing a filter, or create a new team."
              action={{ label: "Create a team", href: "/teams/create" }}
            />
          ) : (
            <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <li key={t.id}>
                  <TeamCard team={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
