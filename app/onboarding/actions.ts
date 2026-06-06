"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/data/countries";
import { US_STATES } from "@/lib/data/us-states";
import { SPORTS, type SportCode } from "@/lib/data/sports";

const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));
const US_STATE_CODES = new Set(US_STATES.map((s) => s.code));
const SPORT_CODES = new Set(SPORTS.map((s) => s.code));

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

/* -------------------------------------------------------------------------- */
/*  Step 1: Location                                                          */
/* -------------------------------------------------------------------------- */
export async function saveOnboardingLocation(formData: FormData) {
  const country = String(formData.get("country") ?? "");
  const state = String(formData.get("state") ?? "");

  if (!COUNTRY_CODES.has(country)) {
    return { ok: false, error: "Please select a valid country." };
  }
  if (country === "US" && !US_STATE_CODES.has(state)) {
    return { ok: false, error: "Please select your state." };
  }

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({
      country_code: country,
      state_province: country === "US" ? state : null,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding");
  redirect("/onboarding/sports");
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Sports                                                            */
/* -------------------------------------------------------------------------- */
export async function saveOnboardingSports(formData: FormData) {
  const raw = formData.getAll("sports").map(String);
  const sports = raw.filter((s): s is SportCode => SPORT_CODES.has(s as SportCode));

  if (sports.length === 0) {
    return { ok: false, error: "Pick at least one sport." };
  }

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ sport_interests: sports })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding/sports");
  redirect("/onboarding/community");
}

/* -------------------------------------------------------------------------- */
/*  Step 3: Community (follow ≥1 team OR skip if no teams exist)              */
/* -------------------------------------------------------------------------- */
export async function followTeam(teamId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("follows").insert({
    follower_id: userId,
    subject_type: "team",
    subject_id: teamId,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/onboarding/community");
  return { ok: true };
}

export async function unfollowTeam(teamId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("follows")
    .delete()
    .match({ follower_id: userId, subject_type: "team", subject_id: teamId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/onboarding/community");
  return { ok: true };
}

/**
 * Marks onboarding complete. Allowed when the user has ≥1 follow OR when
 * there are no teams to follow yet (first-launch bootstrap state).
 */
export async function completeOnboarding() {
  const { supabase, userId } = await requireUserId();

  const [{ count: followCount }, { count: teamCount }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId)
      .eq("subject_type", "team"),
    supabase.from("teams").select("*", { count: "exact", head: true }),
  ]);

  if ((followCount ?? 0) === 0 && (teamCount ?? 0) > 0) {
    return { ok: false, error: "Follow at least one team to continue." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  redirect("/dashboard");
}
