import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Users,
  Award,
  Trophy,
  Star,
  Heart,
  Clock,
  Pencil,
  UserSearch,
  Video,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { COUNTRIES } from "@/lib/data/countries";
import { US_STATES } from "@/lib/data/us-states";
import { getSport, getPositionsForSport } from "@/lib/data/sports";

/**
 * /profile/[username]. Per ASF_LAUNCH_PRD.md > STEP 7.
 * Public read-only profile. Server component.
 */

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `@${params.username}`,
    description: `ASF community profile for @${params.username}`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, country_code, state_province, city, is_player, sport, position, is_free_agent, follower_count, show_email, show_phone, phone, phone_country_code, created_at"
    )
    .eq("username", params.username)
    .maybeSingle();

  if (!profile) notFound();

  const country = profile.country_code
    ? COUNTRIES.find((c) => c.code === profile.country_code)
    : undefined;
  const stateName = profile.state_province
    ? US_STATES.find((s) => s.code === profile.state_province)?.name
    : undefined;
  const sport = profile.sport ? getSport(profile.sport) : undefined;
  const SportIcon = sport?.icon;
  const position =
    profile.sport && profile.position
      ? getPositionsForSport(profile.sport).find((p) => p.code === profile.position)
      : undefined;

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  // Email / phone visibility honors privacy toggles
  let publicEmail: string | null = null;
  if (profile.show_email) {
    const { data: au } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profile.id)
      .maybeSingle();
    if (au) {
      // We can't read auth.users from anon. Skip email reveal in public profile;
      // the toggle is honored when the user is logged in via the dashboard.
      publicEmail = null;
    }
  }

  // Teams this user is on
  const { data: memberRows } = await supabase
    .from("team_members")
    .select(
      "role, position, teams(id, name, slug, sport, city, state_province, member_count, logo_url, is_asf_affiliate)"
    )
    .eq("player_id", profile.id);

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
  };
  const teams: { team: TeamRow; role: string; position: string | null }[] =
    (memberRows ?? [])
      .map((r) => {
        const row = r as unknown as { teams: TeamRow; role: string; position: string | null };
        return { team: row.teams, role: row.role, position: row.position };
      })
      .filter((r) => r.team);

  // Achievements earned by this user
  const { data: achRows } = await supabase
    .from("user_achievements")
    .select("earned_at, achievements(key, name, description, icon, category, sort_order)")
    .eq("user_id", profile.id);

  type AchRow = {
    earned_at: string;
    achievements: {
      key: string;
      name: string;
      description: string;
      icon: string | null;
      category: string | null;
      sort_order: number | null;
    } | null;
  };
  const achievements = ((achRows ?? []) as unknown as AchRow[])
    .filter((a) => a.achievements)
    .sort((a, b) => (a.achievements!.sort_order ?? 0) - (b.achievements!.sort_order ?? 0));

  const ACHIEVEMENT_ICONS: Record<string, typeof Award> = {
    Award,
    Trophy,
    Star,
    Heart,
    Clock,
    Pencil,
    Users,
    UserSearch,
    Video,
  };

  // Player stats — current season for player's primary sport
  const currentSeason = new Date().getFullYear();
  const { data: statRows } = profile.is_player && profile.sport
    ? await supabase
        .from("player_stats")
        .select("stat_key, stat_value")
        .eq("player_id", profile.id)
        .eq("sport", profile.sport)
        .eq("season", currentSeason)
    : { data: null };

  const stats: { stat_key: string; stat_value: number }[] = (statRows ?? []).map((r) => ({
    stat_key: r.stat_key,
    stat_value: Number(r.stat_value),
  }));

  const STAT_LABELS: Record<string, string> = {
    matches_played: "Matches",
    goals: "Goals",
    assists: "Assists",
    yellow_cards: "Yellow cards",
    red_cards: "Red cards",
    minutes_played: "Minutes",
    wins: "Wins",
    losses: "Losses",
    draws: "Draws",
  };

  const initial = (profile.full_name ?? profile.username ?? "?").charAt(0).toUpperCase();

  return (
    <>
      {/* Header */}
      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <span className="relative inline-flex w-20 h-20 rounded-full bg-white/10 ring-2 ring-white/20 items-center justify-center overflow-hidden text-white font-condensed font-bold text-3xl">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-black text-3xl sm:text-4xl leading-none text-balance text-white">
                {profile.full_name ?? profile.username}
              </h1>
              {profile.is_player ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green text-white text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                  Player
                </span>
              ) : null}
              {profile.is_player && profile.is_free_agent ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-gold text-asf-text text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                  Free agent
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-white/70 text-sm">@{profile.username}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
              {profile.city || stateName ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" aria-hidden />
                  <span>
                    {[profile.city, stateName].filter(Boolean).join(", ")}
                    {country && country.code !== "US" ? `, ${country.name}` : ""}
                  </span>
                  {country?.flag ? <span aria-hidden>{country.flag}</span> : null}
                </span>
              ) : null}
              {memberSince ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden />
                  <span>Member since {memberSince}</span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" aria-hidden />
                <span>{profile.follower_count ?? 0} followers</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {profile.bio ? (
              <article>
                <SectionLabel>About</SectionLabel>
                <p className="mt-4 text-asf-text/85 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </article>
            ) : null}

            {achievements.length > 0 ? (
              <article>
                <SectionLabel>Achievements</SectionLabel>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {achievements.map((a) => {
                    const meta = a.achievements!;
                    const Icon = meta.icon ? ACHIEVEMENT_ICONS[meta.icon] ?? Award : Award;
                    return (
                      <li
                        key={meta.key}
                        className="flex items-start gap-3 p-4 rounded-lg bg-white border border-asf-border"
                      >
                        <span className="inline-flex w-10 h-10 rounded-full bg-asf-gold/15 text-asf-gold items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm text-asf-text">{meta.name}</p>
                          <p className="text-xs text-asf-muted">{meta.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ) : null}

            {profile.is_player && stats.length > 0 ? (
              <article>
                <SectionLabel>Player stats — {currentSeason}</SectionLabel>
                <ul className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {stats.map((s) => (
                    <li
                      key={s.stat_key}
                      className="p-4 rounded-lg bg-white border border-asf-border"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-asf-muted">
                        <BarChart3 className="w-3.5 h-3.5" aria-hidden />
                        <span>{STAT_LABELS[s.stat_key] ?? s.stat_key}</span>
                      </div>
                      <p className="mt-1 font-display font-black text-2xl text-asf-text">
                        {Number.isInteger(s.stat_value) ? s.stat_value : s.stat_value.toFixed(1)}
                      </p>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            <article>
              <SectionLabel>Teams</SectionLabel>
              <div className="mt-4">
                {teams.length === 0 ? (
                  <p className="text-sm text-asf-muted">No teams yet.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {teams.map(({ team, role, position: pos }) => {
                      const tSport = getSport(team.sport);
                      const Icon = tSport?.icon;
                      return (
                        <li key={team.id}>
                          <Link
                            href={`/teams/${team.slug}`}
                            className="group flex items-center gap-3 p-4 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                          >
                            <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-sm overflow-hidden">
                              {team.logo_url ? (
                                <Image src={team.logo_url} alt="" fill className="object-cover" sizes="40px" unoptimized />
                              ) : (
                                <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="font-display font-bold text-sm text-asf-text truncate">
                                {team.name}
                              </p>
                              <p className="text-xs text-asf-muted inline-flex items-center gap-1.5">
                                {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden /> : null}
                                {tSport?.name ?? team.sport}
                                <span> . </span>
                                <span className="capitalize">{role.replace("_", " ")}</span>
                                {pos ? <span> . {pos}</span> : null}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            {profile.is_player ? (
              <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
                <SectionLabel>Player</SectionLabel>
                <div className="flex items-center gap-2 text-sm text-asf-text">
                  {SportIcon ? <SportIcon className="w-4 h-4 text-asf-navy" aria-hidden /> : null}
                  <span>{sport?.name ?? "Sport"}</span>
                </div>
                {position ? (
                  <p className="text-sm text-asf-muted">
                    Position: <span className="text-asf-text">{position.name}</span>
                  </p>
                ) : null}
                {profile.is_free_agent ? (
                  <p className="text-xs text-asf-gold font-condensed font-bold tracking-[0.18em] uppercase">
                    Looking for a team
                  </p>
                ) : null}
              </div>
            ) : null}

            {publicEmail ? (
              <div className="p-5 rounded-lg bg-white border border-asf-border space-y-2">
                <SectionLabel>Contact</SectionLabel>
                <p className="text-sm text-asf-text">{publicEmail}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
