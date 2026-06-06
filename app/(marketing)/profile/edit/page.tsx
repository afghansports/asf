import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { ProfileEditForm, type ProfileEditInitial } from "./edit-form";
import { SafetyAndGdprSections, type BlockedRow } from "./safety-sections";
import type { PrivacySettings } from "@/lib/safety/actions";
import { MfaSetup } from "@/components/shared/mfa-setup";
import { SectionLabel } from "@/components/shared/section-label";
import { ProfileRoleManager } from "@/components/shared/profile-role-manager";
import type { RoleKind } from "@/lib/roles/actions";

export const metadata: Metadata = {
  title: "Edit profile",
  description: "Update your ASF profile, player settings, and privacy preferences.",
};

/**
 * /profile/edit. Server-loads the profile + email + privacy settings + block
 * list, then renders the 4-tab form plus the SafetyAndGdprSections panel
 * (deeper privacy, blocked users, data export, account deletion, resources).
 */
export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, avatar_url, country_code, state_province, city, is_player, sport, position, is_free_agent, email_notifications, show_email, show_phone, onboarding_completed, privacy_settings, deletion_requested_at, active_role_kind",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from("profile_roles")
    .select("kind, status, is_primary")
    .eq("profile_id", user.id);
  type RoleRow = { kind: RoleKind; status: string; is_primary: boolean };
  const profileRoles = (roleRows ?? []) as RoleRow[];
  const activeRole = (profile?.active_role_kind ?? "user") as RoleKind;

  if (!profile) redirect("/onboarding");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const { data: blockRows } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  const blockedIds = (blockRows ?? []).map((r) => r.blocked_id);
  const { data: blockedProfiles } = blockedIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", blockedIds)
    : { data: [] as Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null }> };
  const blockedUsers: BlockedRow[] = (blockedProfiles ?? []).map((p) => ({
    blocked_id: p.id,
    username: p.username,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
  }));

  const defaultPrivacy: PrivacySettings = {
    who_can_dm: "everyone",
    who_can_see_follows: "everyone",
    who_can_see_teams: "everyone",
    who_can_see_matches: "everyone",
    who_can_comment: "everyone",
    who_can_tag: "everyone",
    read_receipts: true,
  };
  const privacy: PrivacySettings = {
    ...defaultPrivacy,
    ...((profile.privacy_settings as Partial<PrivacySettings> | null) ?? {}),
  };

  const initial: ProfileEditInitial = {
    userId: user.id,
    email: user.email ?? "",
    username: profile.username ?? "",
    fullName: profile.full_name ?? "",
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    countryCode: profile.country_code ?? "US",
    stateProvince: profile.state_province,
    city: profile.city,
    isPlayer: !!profile.is_player,
    sport: profile.sport,
    position: profile.position,
    isFreeAgent: !!profile.is_free_agent,
    emailNotifications: profile.email_notifications ?? true,
    showEmail: !!profile.show_email,
    showPhone: !!profile.show_phone,
  };

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Edit your profile"
        subtitle="Basic info, player settings, account, privacy, blocking, and data controls."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <ProfileEditForm initial={initial} />

          <div className="mt-10 p-6 rounded-lg bg-white border border-asf-border">
            <SectionLabel>Personas</SectionLabel>
            <p className="mt-2 mb-4 text-sm text-asf-muted">
              You can hold multiple roles at once — athlete, coach, manager, parent, referee, and more. Switch which one is active to change how you appear when you post or message.
            </p>
            <ProfileRoleManager initialRoles={profileRoles} initialActive={activeRole} />
          </div>

          <div className="mt-10 p-6 rounded-lg bg-white border border-asf-border">
            <SectionLabel>Two-factor authentication</SectionLabel>
            <p className="mt-2 mb-4 text-sm text-asf-muted">
              Add an extra layer of security with a TOTP authenticator app (Google
              Authenticator, 1Password, Authy, etc.).
            </p>
            <MfaSetup />
          </div>

          <SafetyAndGdprSections
            initial={{
              blockedUsers,
              privacy,
              deletionRequestedAt: profile.deletion_requested_at ?? null,
            }}
          />
        </div>
      </section>
    </>
  );
}
