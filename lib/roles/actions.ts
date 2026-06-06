"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RoleKind =
  | "user"
  | "athlete"
  | "coach"
  | "manager"
  | "parent"
  | "referee"
  | "volunteer"
  | "sponsor"
  | "press";

export type RoleResult = { ok: true } | { ok: false; message: string };

export const ROLE_LABELS: Record<RoleKind, { label: string; description: string }> = {
  user:      { label: "Member",     description: "Standard community account." },
  athlete:   { label: "Athlete",    description: "Player profile with stats and team history." },
  coach:     { label: "Coach",      description: "Coaching credentials, drill library, team affiliations." },
  manager:   { label: "Team manager", description: "Manage one or more teams." },
  parent:    { label: "Parent / guardian", description: "Linked to a minor account, manage consent." },
  referee:   { label: "Referee",    description: "Officiate sanctioned matches." },
  volunteer: { label: "Volunteer",  description: "Sign up for event roles, log hours." },
  sponsor:   { label: "Sponsor rep", description: "Represent a sponsoring organization." },
  press:     { label: "Press / media", description: "Press credentials for events." },
};

/** Add a role to the current user's profile. */
export async function addProfileRole(kind: RoleKind, metadata?: Record<string, unknown>): Promise<RoleResult> {
  if (kind === "user") return { ok: false, message: "Base member role cannot be added." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const { error } = await supabase.from("profile_roles").upsert(
    {
      profile_id: user.id,
      kind,
      status: "active",
      is_primary: false,
      metadata: metadata ?? {},
      granted_by: user.id,
    },
    { onConflict: "profile_id,kind" },
  );
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profile/edit");
  return { ok: true };
}

/** Revoke a role from the current user. Cannot revoke the base 'user' role. */
export async function revokeProfileRole(kind: RoleKind): Promise<RoleResult> {
  if (kind === "user") return { ok: false, message: "Base member role cannot be revoked." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const { error } = await supabase
    .from("profile_roles")
    .delete()
    .eq("profile_id", user.id)
    .eq("kind", kind);
  if (error) return { ok: false, message: error.message };
  // Reset active to user if they revoked their active role.
  await supabase
    .from("profiles")
    .update({ active_role_kind: "user" })
    .eq("id", user.id)
    .eq("active_role_kind", kind);
  revalidatePath("/profile/edit");
  return { ok: true };
}

/** Switch which role is currently active. Must be a role the user holds. */
export async function setActiveRole(kind: RoleKind): Promise<RoleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const { data: role } = await supabase
    .from("profile_roles")
    .select("kind")
    .eq("profile_id", user.id)
    .eq("kind", kind)
    .eq("status", "active")
    .maybeSingle();
  if (!role) return { ok: false, message: "You don't have that role." };

  const { error } = await supabase
    .from("profiles")
    .update({ active_role_kind: kind })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/profile/edit");
  return { ok: true };
}
