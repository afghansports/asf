import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { ManageForm, type ManageInitial } from "./manage-form";

export const metadata: Metadata = {
  title: "Manage team",
  description: "Captain controls for editing team details, roster, and settings.",
};

/**
 * /teams/manage. Per ASF_LAUNCH_PRD.md > STEP 8 > /teams/manage.
 *
 * Loads the user's captain teams. If they captain none → empty state with link
 * to create. If they captain exactly one → manage that team. If multiple,
 * show a picker (rare in MVP — Phase 2 lifts the per-user-team limit).
 *
 * Decision: when ?team=<id> is provided, manage that team. Otherwise pick the
 * first captained team.
 */

type SearchParams = { team?: string };

export default async function ManageTeamPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/teams/manage");

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, name, slug, sport, state_province, city, description, logo_url, banner_url, is_looking_for_players, contact_email, contact_phone, captain_id"
    )
    .eq("captain_id", user.id)
    .order("created_at", { ascending: true });

  const captainTeams = teams ?? [];

  if (captainTeams.length === 0) {
    return (
      <>
        <PageHero
          eyebrow="Manage team"
          title="You don't captain any team yet."
          subtitle="Create a team to access captain controls and roster management."
        />
        <section className="w-full bg-asf-off">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
            <EmptyState
              icon={<Users className="w-5 h-5" aria-hidden />}
              title="No team to manage."
              description="Once you create a team, you become its captain and unlock these controls."
              action={{ label: "Create a team", href: "/teams/create" }}
            />
          </div>
        </section>
      </>
    );
  }

  const team =
    captainTeams.find((t) => t.id === sp.team) ?? captainTeams[0];

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("player_id, role, position, jersey_number, profiles(username, full_name, avatar_url)")
    .eq("team_id", team.id);

  type MemberRow = {
    player_id: string;
    role: string;
    position: string | null;
    jersey_number: number | null;
    profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
  };
  const members = ((memberRows ?? []) as unknown as MemberRow[])
    .map((m) => ({
      player_id: m.player_id,
      role: m.role,
      position: m.position,
      jersey_number: m.jersey_number,
      username: m.profiles?.username ?? null,
      full_name: m.profiles?.full_name ?? null,
      avatar_url: m.profiles?.avatar_url ?? null,
    }))
    .sort((a, b) => roleRank(a.role, a.player_id, team.captain_id) - roleRank(b.role, b.player_id, team.captain_id));

  const initial: ManageInitial = {
    team: {
      id: team.id,
      name: team.name,
      slug: team.slug,
      sport: team.sport,
      state_province: team.state_province,
      city: team.city,
      description: team.description,
      logo_url: team.logo_url,
      banner_url: team.banner_url,
      is_looking_for_players: !!team.is_looking_for_players,
      contact_email: team.contact_email,
      contact_phone: team.contact_phone,
      captain_id: team.captain_id,
    },
    members,
    currentUserId: user.id,
  };

  return (
    <>
      <PageHero
        eyebrow="Captain controls"
        title={`Manage ${team.name}`}
        subtitle="Edit team details, manage your roster, and update settings. Public page updates immediately."
      >
        {captainTeams.length > 1 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {captainTeams.map((t) => (
              <Link
                key={t.id}
                href={`/teams/manage?team=${t.id}`}
                className={
                  t.id === team.id
                    ? "inline-flex items-center h-9 px-3 rounded-md bg-white text-asf-navy font-condensed font-bold text-xs tracking-[0.16em] uppercase"
                    : "inline-flex items-center h-9 px-3 rounded-md bg-white/10 text-white font-condensed font-bold text-xs tracking-[0.16em] uppercase hover:bg-white/20"
                }
              >
                {t.name}
              </Link>
            ))}
            <Link
              href="/teams/create"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-md bg-asf-red text-white font-condensed font-bold text-xs tracking-[0.16em] uppercase hover:bg-asf-red-dark"
            >
              <PlusCircle className="w-3.5 h-3.5" aria-hidden />
              New team
            </Link>
          </div>
        ) : null}
      </PageHero>

      <section className="w-full bg-asf-off">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
          <ManageForm initial={initial} />
        </div>
      </section>
    </>
  );
}

function roleRank(role: string, playerId: string, captainId: string): number {
  if (playerId === captainId) return 0;
  const order: Record<string, number> = { vice_captain: 1, coach: 2, manager: 3, player: 4 };
  return order[role] ?? 5;
}
