"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { StatePicker } from "@/components/shared/state-picker";
import { submitMatchResult } from "../actions";

type T = { id: string; name: string; sport: string };

export function SubmitForm({ myTeams, otherTeams }: { myTeams: T[]; otherTeams: T[] }) {
  const router = useRouter();
  const [homeTeamId, setHomeTeamId] = useState(myTeams[0]?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 10));
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTx] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const homeTeam = myTeams.find((t) => t.id === homeTeamId);
  const sport = homeTeam?.sport ?? "";
  const sameSportOpponents = useMemo(
    () => otherTeams.filter((t) => !sport || t.sport === sport),
    [otherTeams, sport]
  );

  if (myTeams.length === 0) {
    return (
      <div className="rounded-lg p-6 bg-white border border-asf-border space-y-3">
        <p className="font-display font-bold text-lg text-asf-text">You do not captain any team.</p>
        <p className="text-sm text-asf-muted">
          Only team captains can submit match results. Create a team or ask a captain to add you.
        </p>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTx(async () => {
      const r = await submitMatchResult({
        homeTeamId,
        awayTeamId,
        sport,
        homeScore: Number(homeScore) || 0,
        awayScore: Number(awayScore) || 0,
        playedAt,
        venue,
        city,
        stateProvince: state,
        notes,
      });
      if (r.ok && r.id) {
        router.push(`/matches/${r.id}`);
      } else if (!r.ok) {
        setErr(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="home">Your team (home)</Label>
          <select
            id="home"
            required
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
          >
            {myTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="away">Opponent (away)</Label>
          <select
            id="away"
            required
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
          >
            <option value="">Select opponent</option>
            {sameSportOpponents.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="home_score">Home score</Label>
          <Input
            id="home_score"
            required
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="text-center font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted pb-3 sm:pb-0">
          versus
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="away_score">Away score</Label>
          <Input
            id="away_score"
            required
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="played_at">Date played</Label>
          <Input
            id="played_at"
            required
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venue">Venue (optional)</Label>
          <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Top scorers, weather, anything notable."
        />
      </div>

      <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6">
        {pending ? "Submitting" : "Submit result"}
      </Button>
      <p className="text-xs text-asf-muted">
        The opposing captain has 48 hours to confirm or dispute. After 48 hours, results auto-confirm.
      </p>
    </form>
  );
}
