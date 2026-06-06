import type { Metadata } from "next";
import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sports" };

export default async function AdminSportsPage() {
  const supabase = await createClient();
  const [{ data: sports }, { data: positions }, { data: stats }, { data: formats }] = await Promise.all([
    supabase.from("sports").select("code, name, category, is_team_sport, default_format, emoji, sort_order, is_active").order("sort_order"),
    supabase.from("sport_positions").select("sport_code, code, name, abbrev, sort_order"),
    supabase.from("sport_stats").select("sport_code, stat_key, label, unit, higher_is_better, sort_order"),
    supabase.from("sport_match_formats").select("code, sport_code, label, period_count, period_label, period_minutes, scoring_rule, best_of"),
  ]);

  type Pos = { sport_code: string; code: string; name: string; abbrev: string | null; sort_order: number };
  type Stat = { sport_code: string; stat_key: string; label: string; unit: string | null; higher_is_better: boolean; sort_order: number };
  type Format = { code: string; sport_code: string; label: string; period_count: number; period_label: string; period_minutes: number | null; scoring_rule: string | null; best_of: number | null };

  const positionsBySport = new Map<string, Pos[]>();
  for (const p of (positions ?? []) as Pos[]) {
    const arr = positionsBySport.get(p.sport_code) ?? [];
    arr.push(p);
    positionsBySport.set(p.sport_code, arr);
  }
  const statsBySport = new Map<string, Stat[]>();
  for (const s of (stats ?? []) as Stat[]) {
    const arr = statsBySport.get(s.sport_code) ?? [];
    arr.push(s);
    statsBySport.set(s.sport_code, arr);
  }
  const formatsBySport = new Map<string, Format[]>();
  for (const f of (formats ?? []) as Format[]) {
    const arr = formatsBySport.get(f.sport_code) ?? [];
    arr.push(f);
    formatsBySport.set(f.sport_code, arr);
  }

  return (
    <section className="space-y-8">
      <header className="flex items-start gap-3">
        <span className="inline-flex w-10 h-10 rounded bg-asf-navy text-white items-center justify-center">
          <Globe className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text leading-none">Sports</h1>
          <p className="mt-1 text-sm text-asf-muted">
            Sport definitions drive position pickers, stat sheets, and match formats. Read-only for now —
            edit via SQL or migrations to add a new sport.
          </p>
        </div>
      </header>

      <ul className="space-y-6">
        {(sports ?? []).map((sp) => (
          <li key={sp.code} className="rounded-lg border border-asf-border bg-white">
            <div className="px-5 py-3 border-b border-asf-border flex items-center gap-3">
              <span className="text-xl" aria-hidden>{sp.emoji ?? "•"}</span>
              <div className="flex-1">
                <p className="font-display font-bold text-base text-asf-text">{sp.name}</p>
                <p className="text-xs text-asf-muted capitalize">
                  {sp.category} · {sp.is_team_sport ? "team sport" : "individual"} ·{" "}
                  <code className="font-mono">{sp.code}</code>
                </p>
              </div>
              <span className={
                sp.is_active
                  ? "inline-flex px-2 py-0.5 rounded bg-asf-green text-white text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase"
                  : "inline-flex px-2 py-0.5 rounded bg-asf-muted/30 text-asf-muted text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase"
              }>
                {sp.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div>
                <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-1.5">Positions</p>
                <ul className="text-sm text-asf-text space-y-0.5">
                  {(positionsBySport.get(sp.code) ?? []).map((p) => (
                    <li key={p.code}>
                      <span className="font-mono text-xs text-asf-muted mr-2">{p.abbrev ?? p.code}</span>
                      {p.name}
                    </li>
                  ))}
                  {(positionsBySport.get(sp.code) ?? []).length === 0 ? (
                    <li className="text-asf-muted text-xs italic">No positions catalog.</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-1.5">Stats</p>
                <ul className="text-sm text-asf-text space-y-0.5">
                  {(statsBySport.get(sp.code) ?? []).slice(0, 12).map((s) => (
                    <li key={s.stat_key} className="flex justify-between gap-2">
                      <span>{s.label}</span>
                      {s.unit ? <span className="text-xs text-asf-muted">{s.unit}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-1.5">Match formats</p>
                <ul className="text-sm text-asf-text space-y-0.5">
                  {(formatsBySport.get(sp.code) ?? []).map((f) => (
                    <li key={f.code}>
                      <span className="font-mono text-xs text-asf-muted mr-2">{f.code}</span>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
