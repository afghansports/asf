import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { FillImage } from "@/components/shared/optimized-image";
import { ConfirmMatchButton } from "./confirm-button";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Match ${params.id.slice(0, 8)}` };
}

export default async function MatchDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("matches")
    .select(
      "id, sport, home_team_id, away_team_id, played_at, scheduled_for, venue, city, state_province, status, home_score, away_score, notes, reported_by, reported_at, confirmed_by, confirmed_at"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!m) notFound();

  const teamIds = [m.home_team_id, m.away_team_id].filter(Boolean) as string[];
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, slug, logo_url, captain_id")
    .in("id", teamIds);
  const home = teams?.find((t) => t.id === m.home_team_id);
  const away = teams?.find((t) => t.id === m.away_team_id);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canConfirm =
    !!user &&
    m.status === "reported" &&
    (home?.captain_id === user.id || away?.captain_id === user.id) &&
    m.reported_by !== user.id;

  const sport = m.sport ? getSport(m.sport) : undefined;
  const stateName = m.state_province
    ? US_STATES.find((s) => s.code === m.state_province)?.name ?? m.state_province
    : null;

  return (
    <>
      <PageHero
        eyebrow={sport?.name ?? "Match"}
        title={`${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"}`}
        subtitle={[m.city, stateName].filter(Boolean).join(", ")}
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          {/* Score block */}
          <div className="rounded-lg bg-white border border-asf-border p-8 grid grid-cols-3 items-center gap-6 text-center">
            <Side team={home} score={m.home_score} />
            <div>
              <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-muted">
                Final
              </p>
              <p className="mt-1 font-display font-black text-3xl text-asf-text">
                {(m.home_score ?? 0)} . {(m.away_score ?? 0)}
              </p>
            </div>
            <Side team={away} score={m.away_score} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Detail label="Status" value={<StatusBig status={m.status} />} />
            <Detail
              label="Date"
              value={
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-asf-muted" aria-hidden />
                  {(m.played_at ?? m.scheduled_for)
                    ? new Date(m.played_at ?? m.scheduled_for!).toLocaleString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </span>
              }
            />
            <Detail
              label="Venue"
              value={
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-asf-muted" aria-hidden />
                  {[m.venue, m.city, stateName].filter(Boolean).join(", ") || "TBD"}
                </span>
              }
            />
          </div>

          {m.notes ? (
            <article className="mt-8">
              <SectionLabel>Notes</SectionLabel>
              <p className="mt-3 text-asf-text/85 leading-relaxed whitespace-pre-line">
                {m.notes}
              </p>
            </article>
          ) : null}

          {canConfirm ? (
            <div className="mt-8 p-5 rounded-lg border border-asf-gold/40 bg-asf-gold-light">
              <p className="text-sm text-asf-text mb-3">
                You are listed as the captain of one of these teams. Confirm or dispute the result.
              </p>
              <ConfirmMatchButton matchId={m.id} />
            </div>
          ) : null}

          {m.status === "reported" && !canConfirm ? (
            <p className="mt-6 text-xs text-asf-muted">
              Awaiting confirmation. Auto-confirms 48 hours after submission.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Side({
  team,
}: {
  team: { name: string; slug: string; logo_url: string | null } | undefined;
  score: number | null;
}) {
  if (!team) return <p className="text-asf-muted">TBD</p>;
  return (
    <Link href={`/teams/${team.slug}`} className="flex flex-col items-center gap-2 hover:text-asf-red">
      <span className="relative inline-flex w-16 h-16 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold overflow-hidden">
        {team.logo_url ? (
          <FillImage src={team.logo_url} alt="" className="object-cover" sizes="64px" />
        ) : (
          <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
        )}
      </span>
      <p className="text-sm font-medium text-asf-text">{team.name}</p>
    </Link>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-white border border-asf-border">
      <p className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
        {label}
      </p>
      <div className="mt-1 text-asf-text">{value}</div>
    </div>
  );
}

function StatusBig({ status }: { status: string }) {
  const tone =
    status === "confirmed"
      ? "text-asf-green"
      : status === "reported"
        ? "text-asf-gold"
        : status === "disputed"
          ? "text-asf-red"
          : "text-asf-muted";
  return <span className={`text-sm font-medium capitalize ${tone}`}>{status}</span>;
}
