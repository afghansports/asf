"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FollowResult =
  | { ok: true; following: boolean }
  | { ok: false; message: string };

/** Toggle follow on a team. */
export async function toggleTeamFollow(teamId: string): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to follow teams." };

  const { data: existing } = await supabase
    .from("team_followers")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("team_followers")
      .delete()
      .eq("user_id", user.id)
      .eq("team_id", teamId);
    if (error) return { ok: false, message: error.message };
    revalidatePath(`/teams`);
    return { ok: true, following: false };
  }
  const { error } = await supabase
    .from("team_followers")
    .insert({ user_id: user.id, team_id: teamId });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/teams`);
  return { ok: true, following: true };
}

/** Toggle follow on a club. */
export async function toggleClubFollow(clubId: string): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to follow clubs." };

  const { data: existing } = await supabase
    .from("club_followers")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("club_followers")
      .delete()
      .eq("user_id", user.id)
      .eq("club_id", clubId);
    if (error) return { ok: false, message: error.message };
    return { ok: true, following: false };
  }
  const { error } = await supabase
    .from("club_followers")
    .insert({ user_id: user.id, club_id: clubId });
  if (error) return { ok: false, message: error.message };
  return { ok: true, following: true };
}

/** Toggle follow on a federation. */
export async function toggleFederationFollow(federationId: string): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to follow." };

  const { data: existing } = await supabase
    .from("federation_followers")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("federation_id", federationId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("federation_followers")
      .delete()
      .eq("user_id", user.id)
      .eq("federation_id", federationId);
    if (error) return { ok: false, message: error.message };
    return { ok: true, following: false };
  }
  const { error } = await supabase
    .from("federation_followers")
    .insert({ user_id: user.id, federation_id: federationId });
  if (error) return { ok: false, message: error.message };
  return { ok: true, following: true };
}

/**
 * Start a DM with a team. Resolves to the team's manager/captain — whichever
 * is the most senior available role. Returns the conversation id so the
 * client can `router.push(/messages/<id>)`.
 */
export async function startTeamMessage(
  teamId: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  // Find the senior contact — manager > captain > first coach > captain row on team
  const { data: members } = await supabase
    .from("team_members")
    .select("player_id, role")
    .eq("team_id", teamId);
  let targetId: string | null = null;
  for (const r of ["manager", "captain", "vice_captain", "coach"] as const) {
    const m = (members ?? []).find((x) => x.role === r);
    if (m) {
      targetId = m.player_id;
      break;
    }
  }
  if (!targetId) {
    const { data: team } = await supabase
      .from("teams")
      .select("captain_id")
      .eq("id", teamId)
      .maybeSingle();
    targetId = team?.captain_id ?? null;
  }
  if (!targetId) return { ok: false, message: "Team has no contact set." };
  if (targetId === user.id) return { ok: false, message: "You manage this team." };

  // Look for an existing 1:1 conversation between the two users.
  const { data: mine } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", user.id);
  const myConvIds = (mine ?? []).map((m) => m.conversation_id);
  if (myConvIds.length > 0) {
    const { data: theirs } = await supabase
      .from("dm_participants")
      .select("conversation_id, dm_conversations!inner(is_group)")
      .eq("user_id", targetId)
      .in("conversation_id", myConvIds);
    type Hit = { conversation_id: string; dm_conversations: { is_group: boolean } | null };
    const hit = ((theirs ?? []) as unknown as Hit[]).find((t) => t.dm_conversations && !t.dm_conversations.is_group);
    if (hit) return { ok: true, conversationId: hit.conversation_id };
  }

  // Create a new conversation + add both participants.
  const { data: conv, error: convErr } = await supabase
    .from("dm_conversations")
    .insert({ created_by: user.id, is_group: false })
    .select("id")
    .single();
  if (convErr || !conv) return { ok: false, message: convErr?.message ?? "Could not start chat." };

  const { error: partErr } = await supabase.from("dm_participants").insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: targetId },
  ]);
  if (partErr) return { ok: false, message: partErr.message };

  return { ok: true, conversationId: conv.id };
}
