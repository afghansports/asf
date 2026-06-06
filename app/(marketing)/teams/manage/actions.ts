"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions for /teams/manage.
 * Every action checks `auth.uid() = teams.captain_id`. RLS already enforces
 * this; we re-check here so action results return clean error messages.
 */

export type Result<T = unknown> = { ok: true; data?: T } | { ok: false; message: string };

type CaptainCtx =
  | { kind: "err"; message: string }
  | { kind: "ok"; user: { id: string }; supabase: Awaited<ReturnType<typeof createClient>> };

async function requireCaptain(teamId: string): Promise<CaptainCtx> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "err", message: "Not signed in." };
  const { data: team } = await supabase
    .from("teams")
    .select("captain_id")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) return { kind: "err", message: "Team not found." };
  if (team.captain_id !== user.id) return { kind: "err", message: "Only the captain can do that." };
  return { kind: "ok", user: { id: user.id }, supabase };
}

export async function updateTeam(teamId: string, input: {
  name: string;
  sport: string;
  state: string;
  city: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  isLookingForPlayers: boolean;
  contactEmail: string;
  contactPhone: string;
}): Promise<Result> {
  const ctx = await requireCaptain(teamId);
  if (ctx.kind === "err") return { ok: false, message: ctx.message };
  const { error } = await ctx.supabase
    .from("teams")
    .update({
      name: input.name.trim(),
      sport: input.sport,
      state_province: input.state,
      city: input.city.trim(),
      description: input.description.trim().slice(0, 500) || null,
      logo_url: input.logoUrl,
      banner_url: input.bannerUrl,
      is_looking_for_players: input.isLookingForPlayers,
      contact_email: input.contactEmail.trim() || null,
      contact_phone: input.contactPhone.trim() || null,
    })
    .eq("id", teamId);
  if (error) return { ok: false, message: "Could not update the team." };
  revalidatePath("/teams/manage");
  revalidatePath("/teams");
  return { ok: true };
}

export async function findPlayerByUsername(username: string): Promise<Result<{ id: string; username: string; full_name: string | null; avatar_url: string | null } | null>> {
  const u = username.trim().toLowerCase();
  if (!u) return { ok: true, data: null };
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("username", u)
    .maybeSingle();
  return { ok: true, data };
}

export async function addPlayer(teamId: string, profileId: string, role: string, position: string | null): Promise<Result> {
  const ctx = await requireCaptain(teamId);
  if (ctx.kind === "err") return { ok: false, message: ctx.message };
  const { error } = await ctx.supabase
    .from("team_members")
    .insert({ team_id: teamId, player_id: profileId, role, position });
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, message: "That player is already on the team." };
    }
    console.error("[teams/manage] add player", error);
    return { ok: false, message: "Could not add player." };
  }
  revalidatePath("/teams/manage");
  return { ok: true };
}

export async function removePlayer(teamId: string, profileId: string): Promise<Result> {
  const ctx = await requireCaptain(teamId);
  if (ctx.kind === "err") return { ok: false, message: ctx.message };
  if (ctx.user.id === profileId) {
    return { ok: false, message: "Captains can not remove themselves. Transfer captaincy first (Phase 2)." };
  }
  const { error } = await ctx.supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("player_id", profileId);
  if (error) return { ok: false, message: "Could not remove player." };
  revalidatePath("/teams/manage");
  return { ok: true };
}

export async function updateMemberRole(teamId: string, profileId: string, role: string): Promise<Result> {
  const ctx = await requireCaptain(teamId);
  if (ctx.kind === "err") return { ok: false, message: ctx.message };
  if (role === "captain") {
    return { ok: false, message: "Captain transfer is a Phase 2 feature." };
  }
  const { error } = await ctx.supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("player_id", profileId);
  if (error) return { ok: false, message: "Could not update role." };
  revalidatePath("/teams/manage");
  return { ok: true };
}

export async function deleteTeam(teamId: string, confirmName: string): Promise<Result> {
  const ctx = await requireCaptain(teamId);
  if (ctx.kind === "err") return { ok: false, message: ctx.message };
  const { data: team } = await ctx.supabase.from("teams").select("name").eq("id", teamId).maybeSingle();
  if (!team) return { ok: false, message: "Team not found." };
  if (confirmName !== team.name) return { ok: false, message: "Confirmation does not match team name." };
  const { error } = await ctx.supabase.from("teams").delete().eq("id", teamId);
  if (error) {
    console.error("[teams/manage] delete", error);
    return { ok: false, message: "Could not delete the team." };
  }
  revalidatePath("/teams");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
