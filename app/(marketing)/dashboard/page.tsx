import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CalendarPlus,
  Settings,
  Users,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { EventCard, type EventCardData } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { US_STATES } from "@/lib/data/us-states";
import { getSport } from "@/lib/data/sports";

/**
 * /dashboard. Per ASF_LAUNCH_PRD.md > STEP 7.
 *
 * Welcome row + 4 quick-action cards + "Your Teams" + "Events near you".
 * Server component. Middleware already enforces auth; this also redirects to
 * /onboarding if profile.onboarding_completed is false.
 */

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your ASF dashboard. Manage your team, post events, and stay connected.",
};

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  sport: string;
  city: string | null;
  state_province: string | null;
  member_count: number | null;
  logo_url: string | null;
  is_asf_affiliate: boolean | null;
  captain_id: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, full_name, onboarding_completed, state_province, country_code"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const firstName =
    profile?.full_name?.split(" ")[0] ?? profile?.username ?? "Member";

  // Teams the user is a member of
  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name, slug, sport, city, state_province, member_count, logo_url, is_asf_affiliate, captain_id)")
    .eq("player_id", user.id);

  const teams: { team: TeamRow; role: string }[] = (memberRows ?? [])
    .map((row) => ({
      team: (row as unknown as { teams: TeamRow }).teams,
      role: (row as { role: string }).role,
    }))
    .filter((r) => r.team);

  const hasTeam = teams.length > 0;
  const captainTeam = teams.find((t) => t.team.captain_id === user.id)?.team ?? null;

  // Upcoming events in user's state, fall back to anywhere
  let events: EventCardData[] = [];
  const baseSelect =
    "id, title, slug, event_type, sport, start_datetime, city, state_province, banner_url, is_free, is_featured";
  const nowIso = new Date().toISOString();
  if (profile?.state_province) {
    const { data } = await supabase
      .from("events")
      .select(baseSelect)
      .eq("is_published", true)
      .eq("state_province", profile.state_province)
      .gt("start_datetime", nowIso)
      .order("start_datetime", { ascending: true })
      .limit(3);
    events = (data ?? []) as EventCardData[];
  }
  if (events.length === 0) {
    const { data } = await supabase
      .from("events")
      .select(baseSelect)
      .eq("is_published", true)
      .gt("start_datetime", nowIso)
      .order("start_datetime", { ascending: true })
      .limit(3);
    events = (data ?? []) as EventCardData[];
  }

  const stateName = profile?.state_province
    ? US_STATES.find((s) => s.code === profile.state_province)?.name ?? profile.state_province
    : null;

  return (
    <>
      {/* Welcome */}
      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 flex flex-col gap-3">
          <SectionLabel className="text-asf-gold border-asf-gold">Dashboard</SectionLabel>
          <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight text-balance">
            Welcome back, {firstName}.
          </h1>
          <p className="text-white/75 max-w-xl">
            {hasTeam
              ? "Your teams, your events, your community. All here."
              : "Get started by joining or creating a team. Then post your first event."}
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <div className="mb-6">
            <SectionLabel>Quick actions</SectionLabel>
          </div>
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              href="/profile/edit"
              icon={<Settings className="w-5 h-5" aria-hidden />}
              title="Edit profile"
              description="Update your bio, photo, and player settings."
            />
            <ActionCard
              href={hasTeam ? "/teams/manage" : "/teams/create"}
              icon={<Users className="w-5 h-5" aria-hidden />}
              title={hasTeam ? "Manage team" : "Create a team"}
              description={
                hasTeam
                  ? "Edit roster, captain controls, team page."
                  : "Start a team and invite your community."
              }
            />
            <ActionCard
              href="/events/create"
              icon={<CalendarPlus className="w-5 h-5" aria-hidden />}
              title="Post an event"
              description="Submit a tournament, match, or community event."
            />
            <ActionCard
              href="/events"
              icon={<Calendar className="w-5 h-5" aria-hidden />}
              title="Browse events"
              description="Find events near you across all sports."
            />
          </ul>
        </div>
      </section>

      {/* Your teams */}
      <section className="w-full bg-white border-y border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <SectionLabel>Your teams</SectionLabel>
              <h2 className="font-display font-bold text-2xl text-asf-text">
                {hasTeam ? `You belong to ${teams.length} team${teams.length === 1 ? "" : "s"}.` : "No team yet."}
              </h2>
            </div>
            {captainTeam ? (
              <Link
                href="/teams/manage"
                className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
              >
                Manage team
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            ) : null}
          </div>

          {hasTeam ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map(({ team, role }) => {
                const sport = getSport(team.sport);
                const Icon = sport?.icon;
                return (
                  <li key={team.id}>
                    <Link
                      href={`/teams/${team.slug}`}
                      className="group flex flex-col gap-3 p-5 rounded-lg border border-asf-border bg-white hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-sm overflow-hidden">
                          {team.logo_url ? (
                            <Image src={team.logo_url} alt="" fill className="object-cover" sizes="40px" unoptimized />
                          ) : (
                            <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-base text-asf-text truncate">
                            {team.name}
                          </h3>
                          <p className="text-xs text-asf-muted inline-flex items-center gap-1.5">
                            {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden /> : null}
                            {sport?.name ?? team.sport}
                            <span> . </span>
                            <span>{[team.city, team.state_province].filter(Boolean).join(", ")}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-asf-muted pt-1 border-t border-asf-border/60">
                        <span className="capitalize">{role.replace("_", " ")}</span>
                        <span>{team.member_count ?? 0} members</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<Users className="w-5 h-5" aria-hidden />}
              title="You don't have a team yet."
              description="Create your team or browse existing teams to find one looking for players."
              action={{ label: "Create a team", href: "/teams/create" }}
            />
          )}
          {!captainTeam && hasTeam ? (
            <div className="mt-6">
              <Link
                href="/teams/create"
                className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
              >
                <PlusCircle className="w-4 h-4" aria-hidden />
                Start another team
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Events near you */}
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <SectionLabel>Coming up</SectionLabel>
              <h2 className="font-display font-bold text-2xl text-asf-text">
                {stateName ? `Upcoming events in ${stateName}` : "Upcoming events"}
              </h2>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
            >
              View all events
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-5 h-5" aria-hidden />}
              title="No upcoming events nearby."
              description="Be the first to organize one."
              action={{ label: "Post an event", href: "/events/create" }}
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex flex-col gap-3 p-5 h-full rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
      >
        <span className="inline-flex w-10 h-10 rounded-full bg-asf-red/10 items-center justify-center text-asf-red">
          {icon}
        </span>
        <h3 className="font-display font-bold text-base text-asf-text">{title}</h3>
        <p className="text-sm text-asf-muted leading-relaxed flex-1">{description}</p>
        <span className="inline-flex items-center gap-1 font-condensed font-bold text-[0.7rem] tracking-[0.18em] uppercase text-asf-red mt-auto">
          Open
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </li>
  );
}
