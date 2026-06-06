import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features/flags";
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { FixedImage } from "@/components/shared/optimized-image";

/**
 * Homepage strip surfacing the next 6 fixtures from the external sports cache.
 * Returns null when the module is disabled or when there's nothing cached yet,
 * so the homepage degrades silently.
 */
export async function ScoresStrip() {
  if (!(await isFeatureEnabled("module.external_sports"))) return null;

  const supabase = await createClient();
  const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  // Mix: a few live/recent + a few upcoming
  const { data: rows } = await supabase
    .from("external_fixtures")
    .select("id, sport_code, league, kickoff, status, home_name, home_logo_url, home_score, away_name, away_logo_url, away_score")
    .gte("kickoff", past)
    .lte("kickoff", future)
    .order("kickoff", { ascending: true })
    .limit(6);

  if (!rows || rows.length === 0) return null;

  return (
    <section className="w-full bg-asf-navy text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-5">
          <p className="font-condensed font-bold text-[0.7rem] tracking-[0.22em] uppercase text-asf-gold inline-flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" />
            Pro fixtures
          </p>
          <Link
            href="/scores"
            className="inline-flex items-center gap-1.5 text-[0.65rem] font-condensed font-bold tracking-[0.22em] uppercase text-white/80 hover:text-white"
          >
            All scores <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="p-4 rounded-md bg-white/5 border border-white/10 backdrop-blur"
            >
              <div className="flex items-center justify-between text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase text-white/60 mb-2">
                <span className="truncate">{r.league}</span>
                <span
                  className={
                    r.status === "live"
                      ? "px-1.5 py-0.5 rounded bg-asf-red text-white"
                      : r.status === "final"
                      ? "px-1.5 py-0.5 rounded bg-asf-green text-white"
                      : "px-1.5 py-0.5 rounded bg-white/10"
                  }
                >
                  {r.status}
                </span>
              </div>
              <Row name={r.home_name} logo={r.home_logo_url} score={r.home_score} />
              <Row name={r.away_name} logo={r.away_logo_url} score={r.away_score} />
              {r.kickoff ? (
                <p className="mt-2 text-[0.65rem] text-white/60">
                  {new Date(r.kickoff).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Row({ name, logo, score }: { name: string; logo: string | null; score: number | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="inline-flex items-center gap-2 min-w-0">
        {logo ? (
          <FixedImage src={cdnUrl(logo)} alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />
        ) : (
          <span className="inline-flex w-5 h-5 rounded bg-white/10 shrink-0" aria-hidden />
        )}
        <span className="text-sm text-white/95 truncate">{name}</span>
      </span>
      <span className="font-display font-bold text-sm tabular-nums">{score ?? "—"}</span>
    </div>
  );
}
