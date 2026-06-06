"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Profile-edit server actions, one per tab. Each returns
 * `{ ok: true } | { ok: false, message: string }` so the client can show
 * loading / error / success without thrown errors crossing the wire.
 *
 * Auth: every action calls `auth.getUser()` and only updates
 * `profiles WHERE id = auth.uid()` (RLS already enforces this; we double-check
 * so the action returns a clean 401 message instead of a silent no-op).
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

const USERNAME_RX = /^[a-z0-9_]{3,30}$/i;

export async function saveBasicInfo(input: {
  fullName: string;
  username: string;
  bio: string;
  countryCode: string;
  stateProvince: string | null;
  city: string;
  avatarUrl: string | null;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const username = input.username.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const bio = input.bio.slice(0, 200);
    const city = input.city.trim();

    if (!USERNAME_RX.test(username)) {
      return { ok: false, message: "Username must be 3-30 characters: letters, digits, underscore." };
    }
    if (!fullName) return { ok: false, message: "Full name is required." };
    if (!input.countryCode) return { ok: false, message: "Country is required." };

    // Username uniqueness (skip if same as current)
    const { data: dup } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();
    if (dup) return { ok: false, message: "Username is taken." };

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        bio: bio || null,
        country_code: input.countryCode,
        state_province: input.stateProvince || null,
        city: city || null,
        avatar_url: input.avatarUrl,
      })
      .eq("id", user.id);

    if (error) {
      console.error("[profile/save-basic]", error);
      return { ok: false, message: "Could not save. Try again." };
    }
    revalidatePath("/profile/edit");
    revalidatePath(`/profile/${username}`);
    return { ok: true, message: "Saved." };
  } catch (e) {
    console.error("[profile/save-basic] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function savePlayerSettings(input: {
  isPlayer: boolean;
  sport: string | null;
  position: string | null;
  isFreeAgent: boolean;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const update: Record<string, unknown> = {
      is_player: input.isPlayer,
      sport: input.isPlayer ? input.sport : null,
      position: input.isPlayer ? input.position : null,
      is_free_agent: input.isPlayer ? input.isFreeAgent : false,
    };

    const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
    if (error) {
      console.error("[profile/save-player]", error);
      return { ok: false, message: "Could not save player settings." };
    }
    revalidatePath("/profile/edit");
    return { ok: true, message: "Saved." };
  } catch (e) {
    console.error("[profile/save-player] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function saveAccountEmail(newEmail: string): Promise<ActionResult> {
  try {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return { ok: false, message: error.message };
    }
    return {
      ok: true,
      message: "Confirmation email sent. Click the link in your inbox to finish the change.",
    };
  } catch (e) {
    console.error("[profile/save-email] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  try {
    if (input.newPassword.length < 8) {
      return { ok: false, message: "New password must be at least 8 characters." };
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, message: "Not signed in." };

    // Re-verify with current password
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });
    if (verifyErr) return { ok: false, message: "Current password is incorrect." };

    const { error } = await supabase.auth.updateUser({ password: input.newPassword });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Password updated." };
  } catch (e) {
    console.error("[profile/change-password] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function saveNotificationPref(emailNotifications: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };
    const { error } = await supabase
      .from("profiles")
      .update({ email_notifications: emailNotifications })
      .eq("id", user.id);
    if (error) return { ok: false, message: "Could not save." };
    revalidatePath("/profile/edit");
    return { ok: true, message: "Saved." };
  } catch (e) {
    console.error("[profile/notif] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function savePrivacy(input: {
  showEmail: boolean;
  showPhone: boolean;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };
    const { error } = await supabase
      .from("profiles")
      .update({ show_email: input.showEmail, show_phone: input.showPhone })
      .eq("id", user.id);
    if (error) return { ok: false, message: "Could not save." };
    revalidatePath("/profile/edit");
    return { ok: true, message: "Saved." };
  } catch (e) {
    console.error("[profile/privacy] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function syncAvatar(avatarUrl: string | null): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);
    if (error) return { ok: false, message: "Could not save photo." };
    revalidatePath("/profile/edit");
    return { ok: true };
  } catch (e) {
    console.error("[profile/sync-avatar] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}
