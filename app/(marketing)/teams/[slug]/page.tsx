import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, Calendar, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { EventCard, type EventCardData } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { TeamProfileActions } from "@/components/shared/team-profile-actions";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Team ${params.slug}`, description: `ASF team ${params.slug}.` };
}

/**
 * /teams/[slug]. Per ASF_LAUNCH_PRD.md > STEP 8 > /teams/[slug].
 * Banner, overlapping logo, name, sport, location, stats, follow / join /
 * captain controls, tabs (About, Roster, Events).
 */
export default async function TeamDetailPage({ params }: Props) {
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select(
      "id, name, slug, sport, city, state_province, country_code, description, logo_url, banner_url, captain_id, founded_year, member_count, follower_count, is_looking_for_players, is_asf_affiliate, contact_email, contact_phone"
    )
    .eq("slug", params.slug)
    .maybeSingle();
  if (!team) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCaptain = !!user && user.id === team.captain_id;

  let initialFollowing = false;
  if (user) {
    const { data: f } = await supabase
      .from("team_followers")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("team_id", team.id)
      .maybeSingle();
    initialFollowing = !!f;
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("role, position, jersey_number, profiles(id, username, full_name, avatar_url)")
    .eq("team_id", team.id);

  type Member = {
    role: string;
    position: string | null;
    jersey_number: number | null;
    profiles: { id: string; username: string | null; full_name: string | null; avatar_url: string | null };
  };
  const roster = ((members ?? []) as unknown as Member[])
    .filter((m) => m.profiles)
    .sort((a, b) => roleRank(a.role) - roleRank(b.role));

  const { data: teamEvents } = await supabase
    .from("events")
    .select("id, title, slug, event_type, sport, start_datetime, city, state_province, banner_url, is_free, is_featured")
    .eq("organizer_team_id", team.id)
    .eq("is_published", true)
    .order("start_datetime", { ascending: true })
    .limit(12);
  const events = (teamEvents ?? []) as EventCardData[];

  const sport = getSport(team.sport);
  const SportIcon = sport?.icon;
  const stateName = team.state_province
    ? US_STATES.find((s) => s.code === team.state_province)?.name ?? team.state_province
    : null;

  return (
    <>
      {/* Banner — image + dark scrim. Team name overlaid in the bottom-left,
         always white text guaranteed regardless of the photo. */}
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          {team.banner_url ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${team.banner_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy" />
          )}
          {/* Strong gradient over the photo — black at the bottom for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-6 sm:pb-8 flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight text-white text-balance">
                  {team.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {team.is_asf_affiliate ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-gold text-asf-text font-condensed font-bold tracking-[0.18em] uppercase">
                      ASF affiliate
                    </span>
                  ) : null}
                  {team.is_looking_for_players ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green text-white font-condensed font-bold tracking-[0.18em] uppercase">
                      Looking for players
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info bar on white — logo, meta, actions. Clearer separation, never
            puts critical text on a photo. */}
        <div className="bg-white border-b border-asf-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="relative inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-2xl overflow-hidden ring-4 ring-white shadow-md shrink-0 -mt-12 sm:-mt-14">
              {team.logo_url ? (
                <Image src={team.logo_url} alt="" fill className="object-cover" sizes="80px" unoptimized />
              ) : (
                <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-asf-muted">
                {sport ? (
                  <span className="inline-flex items-center gap-1.5">
                    {SportIcon ? <SportIcon className="w-4 h-4 text-asf-navy" aria-hidden /> : null}
                    <span className="text-asf-text font-medium">{sport.name}</span>
                  </span>
                ) : null}
                {team.city || stateName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" aria-hidden />
                    <span>{[team.city, stateName].filter(Boolean).join(", ")}</span>
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" aria-hidden />
                  <span>{team.member_count ?? roster.length} players</span>
                </span>
                {team.founded_year ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" aria-hidden />
                    <span>Founded {team.founded_year}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isCaptain ? (
                <Link
                  href="/teams/manage"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-asf-navy text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-navy-light transition-colors"
                >
                  <Settings className="w-4 h-4" aria-hidden />
                  Manage team
                </Link>
              ) : (
                <TeamProfileActions
                  teamId={team.id}
                  initialFollowing={initialFollowing}
                  signedIn={!!user}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section nav — anchor-based, no JS, no broken Tabs primitive. */}
      <nav
        aria-label="Team sections"
        className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex items-center gap-8 overflow-x-auto">
          <a href="#about" className="py-3 inline-flex items-center text-sm font-condensed font-bold tracking-[0.18em] uppercase text-asf-text hover:text-asf-red border-b-2 border-transparent hover:border-asf-red transition-colors whitespace-nowrap">About</a>
          <a href="#roster" className="py-3 inline-flex items-center text-sm font-condensed font-bold tracking-[0.18em] uppercase text-asf-text hover:text-asf-red border-b-2 border-transparent hover:border-asf-red transition-colors whitespace-nowrap">Roster ({roster.length})</a>
          <a href="#events" className="py-3 inline-flex items-center text-sm font-condensed font-bold tracking-[0.18em] uppercase text-asf-text hover:text-asf-red border-b-2 border-transparent hover:border-asf-red transition-colors whitespace-nowrap">Events ({events.length})</a>
        </div>
      </nav>

      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-12">
          {/* ABOUT */}
          <section id="about" className="scroll-mt-32 grid gap-6 md:grid-cols-3">
            <article className="md:col-span-2 rounded-lg bg-white border border-asf-border p-6">
              <SectionLabel>About this team</SectionLabel>
              <p className="mt-3 text-asf-text/85 leading-relaxed whitespace-pre-line break-words">
                {team.description ?? "No description yet."}
              </p>
            </article>
            <aside className="space-y-4 min-w-0">
              {team.contact_email ? (
                <div className="p-4 rounded-lg bg-white border border-asf-border">
                  <SectionLabel>Contact</SectionLabel>
                  <p className="text-sm text-asf-text mt-2 break-all">
                    <a href={`mailto:${team.contact_email}`} className="hover:text-asf-red">
                      {team.contact_email}
                    </a>
                  </p>
                  {team.contact_phone ? (
                    <p className="text-sm text-asf-muted mt-1">{team.contact_phone}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="p-4 rounded-lg bg-white border border-asf-border">
                <SectionLabel>At a glance</SectionLabel>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {sport ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-asf-muted">Sport</dt>
                      <dd className="text-asf-text font-medium capitalize">{sport.name}</dd>
                    </div>
                  ) : null}
                  {team.founded_year ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-asf-muted">Founded</dt>
                      <dd className="text-asf-text font-medium">{team.founded_year}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <dt className="text-asf-muted">Players</dt>
                    <dd className="text-asf-text font-medium">{team.member_count ?? roster.length}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-asf-muted">Followers</dt>
                    <dd className="text-asf-text font-medium">{team.follower_count ?? 0}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </section>

          {/* ROSTER */}
          <section id="roster" className="scroll-mt-32">
            <SectionLabel>Roster</SectionLabel>
            {roster.length === 0 ? (
              <div className="mt-3"><EmptyState title="No players yet." description="The captain has not added any players to the roster." /></div>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-asf-border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-asf-off border-b border-asf-border">
                    <tr className="text-start">
                      <th className="px-4 py-3 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">Player</th>
                      <th className="px-4 py-3 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">Role</th>
                      <th className="px-4 py-3 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">Position</th>
                      <th className="px-4 py-3 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((m) => (
                      <tr key={m.profiles.id} className="border-t border-asf-border">
                        <td className="px-4 py-3">
                          <Link
                            href={`/profile/${m.profiles.username}`}
                            className="inline-flex items-center gap-2.5 hover:text-asf-red"
                          >
                            <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                              {m.profiles.avatar_url ? (
                                <Image src={m.profiles.avatar_url} alt="" fill className="object-cover" sizes="32px" unoptimized />
                              ) : (
                                <span aria-hidden>
                                  {(m.profiles.full_name ?? m.profiles.username ?? "?").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span>
                              <span className="block text-asf-text">{m.profiles.full_name ?? m.profiles.username}</span>
                              <span className="block text-xs text-asf-muted">@{m.profiles.username}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 capitalize text-asf-text">{m.role.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-asf-muted">{m.position ?? "-"}</td>
                        <td className="px-4 py-3 text-asf-muted">{m.jersey_number ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* EVENTS */}
          <section id="events" className="scroll-mt-32">
            <SectionLabel>Events</SectionLabel>
            {events.length === 0 ? (
              <div className="mt-3"><EmptyState title="No events yet." description="This team has not posted any events." /></div>
            ) : (
              <ul className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <li key={e.id}>
                    <EventCard event={e} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </>
  );
}

function roleRank(role: string) {
  const order: Record<string, number> = { captain: 0, vice_captain: 1, coach: 2, manager: 3, player: 4 };
  return order[role] ?? 5;
}
