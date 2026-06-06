import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { EmptyState } from "@/components/shared/empty-state";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { FillImage } from "@/components/shared/optimized-image";
import { Bracket, type BracketMatch } from "./bracket";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.slug };
}

export default async function TournamentDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("tournaments")
    .select(
      "id, slug, name, sport, format, description, banner_url, start_date, end_date, registration_opens, registration_closes, city, state_province, status"
    )
    .eq("slug", params.slug)
    .maybeSingle();
  if (!t) notFound();

  const [{ data: regs }, { data: tms }] = await Promise.all([
    supabase
      .from("tournament_teams")
      .select("seed, status, team_id, teams(id, name, slug, logo_url)")
      .eq("tournament_id", t.id),
    supabase
      .from("tournament_matches")
      .select("id, round, position, home_team_id, away_team_id, home_score, away_score, winner_team_id, status, scheduled_for")
      .eq("tournament_id", t.id)
      .order("round")
      .order("position"),
  ]);

  type Reg = { seed: number | null; status: string; team_id: string; teams: { id: string; name: string; slug: string; logo_url: string | null } | null };
  const registered = ((regs ?? []) as unknown as Reg[]).filter((r) => r.teams);
  const matches = (tms ?? []) as BracketMatch[];

  // Resolve team names for matches
  const teamIds = Array.from(new Set(matches.flatMap((m) => [m.home_team_id, m.away_team_id, m.winner_team_id]).filter(Boolean) as string[]));
  const { data: teamRows } = teamIds.length
    ? await supabase.from("teams").select("id, name, slug, logo_url").in("id", teamIds)
    : { data: [] as Array<{ id: string; name: string; slug: string; logo_url: string | null }> };
  const teamMap = new Map((teamRows ?? []).map((x) => [x.id, x]));

  const sport = t.sport ? getSport(t.sport) : undefined;
  const stateName = t.state_province
    ? US_STATES.find((s) => s.code === t.state_province)?.name ?? t.state_province
    : null;
  const dateStr = t.start_date
    ? new Date(t.start_date).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <PageHero
        eyebrow={sport?.name ?? "Tournament"}
        title={t.name}
        subtitle={[t.city, stateName].filter(Boolean).join(", ")}
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {t.description ? (
              <article>
                <SectionLabel>About</SectionLabel>
                <p className="mt-3 text-asf-text/85 leading-relaxed whitespace-pre-line">
                  {t.description}
                </p>
              </article>
            ) : null}

            <article>
              <SectionLabel>Bracket</SectionLabel>
              <div className="mt-4">
                {matches.length === 0 ? (
                  <EmptyState title="Bracket not generated yet." description="ASF admins seed the bracket once registration closes." />
                ) : (
                  <Bracket matches={matches} teamMap={teamMap} />
                )}
              </div>
            </article>

            <article>
              <SectionLabel>Registered teams ({registered.length})</SectionLabel>
              <div className="mt-4">
                {registered.length === 0 ? (
                  <p className="text-sm text-asf-muted">No teams registered yet.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {registered
                      .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
                      .map((r) => (
                        <li key={r.team_id}>
                          <Link
                            href={`/teams/${r.teams!.slug}`}
                            className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/50"
                          >
                            <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                              {r.teams!.logo_url ? (
                                <FillImage src={r.teams!.logo_url} alt="" className="object-cover" sizes="32px" />
                              ) : (
                                <span aria-hidden>{r.teams!.name.charAt(0).toUpperCase()}</span>
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-asf-text truncate">{r.teams!.name}</p>
                              <p className="text-[0.65rem] text-asf-muted capitalize">{r.status}</p>
                            </div>
                            {r.seed ? (
                              <span className="font-condensed font-bold text-[0.7rem] tracking-[0.18em] uppercase text-asf-muted">
                                Seed {r.seed}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-4">
            <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
              <SectionLabel>Status</SectionLabel>
              <p className="text-sm capitalize text-asf-text">{t.status.replace("_", " ")}</p>
              {dateStr ? (
                <p className="text-sm text-asf-muted inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden />
                  {dateStr}
                </p>
              ) : null}
              {t.city || stateName ? (
                <p className="text-sm text-asf-muted inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" aria-hidden />
                  {[t.city, stateName].filter(Boolean).join(", ")}
                </p>
              ) : null}
              <p className="text-xs text-asf-muted">
                <Users className="inline-block w-3.5 h-3.5 mr-1" aria-hidden />
                {registered.length} teams registered
              </p>
              <p className="text-xs text-asf-muted capitalize">
                <Trophy className="inline-block w-3.5 h-3.5 mr-1" aria-hidden />
                Format: {t.format.replace("_", " ")}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
