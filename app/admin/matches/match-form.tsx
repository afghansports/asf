"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { StatePicker } from "@/components/shared/state-picker";
import { createAdminMatch } from "../_chapters-actions";

type T = { id: string; name: string; sport: string };

const selectClass = "h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm";

export function MatchForm({ teams }: { teams: T[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"scheduled" | "confirmed">("scheduled");
  const [homeTeamId, setHomeTeamId] = useState(teams[0]?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [when, setWhen] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const sport = homeTeam?.sport ?? "";
  const opponents = useMemo(
    () => teams.filter((t) => t.id !== homeTeamId && (!sport || t.sport === sport)),
    [teams, homeTeamId, sport]
  );
  const confirmed = status === "confirmed";

  if (teams.length < 2) {
    return (
      <div className="rounded-lg border border-asf-border bg-white p-6 space-y-2">
        <p className="font-display font-bold text-lg text-asf-text">Need at least two teams.</p>
        <p className="text-sm text-asf-muted">
          Create teams first, then you can schedule or record a match between them.
        </p>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await createAdminMatch({
        sport,
        homeTeamId,
        awayTeamId,
        status,
        scheduledFor: !confirmed && when ? new Date(when).toISOString() : null,
        playedAt: confirmed && when ? new Date(when).toISOString() : null,
        venue,
        city,
        state,
        homeScore: confirmed ? (homeScore === "" ? null : Number(homeScore)) : null,
        awayScore: confirmed ? (awayScore === "" ? null : Number(awayScore)) : null,
        notes,
      });
      if (r.ok) {
        toast.success("Match created");
        router.push("/admin/matches");
      } else {
        setErr(r.message);
        toast.error(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="match_status">What is this?</Label>
          <select id="match_status" value={status} onChange={(e) => setStatus(e.target.value as "scheduled" | "confirmed")} className={selectClass} disabled={pending}>
            <option value="scheduled">Scheduled fixture (no scores yet)</option>
            <option value="confirmed">Finished result (with scores)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="match_when">{confirmed ? "Date played" : "Scheduled for"}</Label>
          <Input id="match_when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} disabled={pending} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="match_home">Home team</Label>
          <select
            id="match_home"
            required
            value={homeTeamId}
            onChange={(e) => {
              setHomeTeamId(e.target.value);
              setAwayTeamId("");
            }}
            className={selectClass}
            disabled={pending}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.sport}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="match_away">Away team</Label>
          <select id="match_away" required value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className={selectClass} disabled={pending}>
            <option value="">Select opponent</option>
            {opponents.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-asf-muted">Opponents are limited to {sport || "the same sport"} teams.</p>
        </div>
      </div>

      {confirmed ? (
        <div className="grid gap-5 sm:grid-cols-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="match_home_score">Home score</Label>
            <Input id="match_home_score" required type="number" min={0} inputMode="numeric" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} disabled={pending} />
          </div>
          <div className="text-center font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted pb-3 sm:pb-0">
            versus
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match_away_score">Away score</Label>
            <Input id="match_away_score" required type="number" min={0} inputMode="numeric" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} disabled={pending} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="match_venue">Venue</Label>
          <Input id="match_venue" value={venue} onChange={(e) => setVenue(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="match_city">City</Label>
          <Input id="match_city" value={city} onChange={(e) => setCity(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} disabled={pending} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="match_notes">Notes (optional)</Label>
        <Textarea id="match_notes" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={pending} placeholder="Top scorers, weather, anything notable." />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : confirmed ? "Record result" : "Schedule match"}
        </Button>
      </div>
    </form>
  );
}
