"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MatchResult = { ok: true; id?: string } | { ok: false; message: string };

async function captainOf(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string, userId: string) {
  const { data } = await supabase
    .from("teams")
    .select("captain_id")
    .eq("id", teamId)
    .maybeSingle();
  return data?.captain_id === userId;
}

export async function submitMatchResult(input: {
  homeTeamId: string;
  awayTeamId: string;
  sport: string;
  homeScore: number;
  awayScore: number;
  playedAt: string;          // YYYY-MM-DD
  venue: string;
  city: string;
  stateProvince: string;
  notes: string;
}): Promise<MatchResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    if (input.homeTeamId === input.awayTeamId) {
      return { ok: false, message: "Home and away teams must differ." };
    }
    if (input.homeScore < 0 || input.awayScore < 0) {
      return { ok: false, message: "Scores must be 0 or greater." };
    }
    const isCaptain =
      (await captainOf(supabase, input.homeTeamId, user.id)) ||
      (await captainOf(supabase, input.awayTeamId, user.id));
    if (!isCaptain) {
      return { ok: false, message: "Only one of the two team captains can submit a result." };
    }

    const { data, error } = await supabase
      .from("matches")
      .insert({
        sport: input.sport,
        home_team_id: input.homeTeamId,
        away_team_id: input.awayTeamId,
        home_score: input.homeScore,
        away_score: input.awayScore,
        played_at: new Date(input.playedAt + "T00:00:00").toISOString(),
        venue: input.venue.trim() || null,
        city: input.city.trim() || null,
        state_province: input.stateProvince || null,
        notes: input.notes.trim() || null,
        status: "reported",
        reported_by: user.id,
        reported_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[matches/submit]", error);
      return { ok: false, message: "Could not submit. Try again." };
    }
    revalidatePath("/matches");
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[matches/submit] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function confirmMatch(matchId: string): Promise<MatchResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const { data: m } = await supabase
      .from("matches")
      .select("status, home_team_id, away_team_id, reported_by")
      .eq("id", matchId)
      .maybeSingle();
    if (!m) return { ok: false, message: "Match not found." };
    if (m.status !== "reported") return { ok: false, message: "This match is not awaiting confirmation." };
    if (m.reported_by === user.id) {
      return { ok: false, message: "The opposing captain must confirm." };
    }
    const isCaptainOf =
      (await captainOf(supabase, m.home_team_id, user.id)) ||
      (await captainOf(supabase, m.away_team_id, user.id));
    if (!isCaptainOf) return { ok: false, message: "Only a captain may confirm." };

    const { error } = await supabase
      .from("matches")
      .update({
        status: "confirmed",
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", matchId);
    if (error) return { ok: false, message: error.message };
    revalidatePath(`/matches/${matchId}`);
    revalidatePath("/matches");
    return { ok: true };
  } catch (e) {
    console.error("[matches/confirm] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function disputeMatch(matchId: string): Promise<MatchResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };
    const { error } = await supabase
      .from("matches")
      .update({ status: "disputed" })
      .eq("id", matchId);
    if (error) return { ok: false, message: error.message };
    revalidatePath(`/matches/${matchId}`);
    return { ok: true };
  } catch (e) {
    console.error("[matches/dispute]", e);
    return { ok: false, message: "Something went wrong." };
  }
}
