import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProgress } from "@/components/shared/onboarding-progress";
import { CommunityForm } from "./community-form";

export default async function OnboardingCommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("country_code, state_province, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/dashboard");

  // Try teams in user's state first; fall back to most recent worldwide.
  let teams: Array<{
    id: string;
    name: string;
    slug: string;
    sport: string;
    city: string | null;
    state_province: string | null;
    country_code: string;
    member_count: number;
    follower_count: number;
    is_looking_for_players: boolean;
    is_asf_affiliate: boolean;
    logo_url: string | null;
  }> = [];

  if (profile?.country_code === "US" && profile.state_province) {
    const { data } = await supabase
      .from("teams")
      .select(
        "id, name, slug, sport, city, state_province, country_code, member_count, follower_count, is_looking_for_players, is_asf_affiliate, logo_url"
      )
      .eq("country_code", "US")
      .eq("state_province", profile.state_province)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6);
    teams = data ?? [];
  }

  if (teams.length === 0) {
    const { data } = await supabase
      .from("teams")
      .select(
        "id, name, slug, sport, city, state_province, country_code, member_count, follower_count, is_looking_for_players, is_asf_affiliate, logo_url"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6);
    teams = data ?? [];
  }

  // Fetch which of these the user already follows (for state when they hit Back)
  let followedIds: Set<string> = new Set();
  if (teams.length > 0) {
    const { data: follows } = await supabase
      .from("follows")
      .select("subject_id")
      .eq("follower_id", user.id)
      .eq("subject_type", "team")
      .in(
        "subject_id",
        teams.map((t) => t.id)
      );
    followedIds = new Set((follows ?? []).map((f) => f.subject_id));
  }

  return (
    <div>
      <OnboardingProgress current={3} />

      <div className="text-center mb-8 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-black text-asf-text">
          Find your community
        </h1>
        <p className="text-asf-muted">
          {teams.length > 0
            ? "Follow the teams you want to keep up with. You can follow more later."
            : "No teams yet. You can be among the first to create one. We will skip ahead for now."}
        </p>
      </div>

      <CommunityForm
        teams={teams}
        initialFollowed={Array.from(followedIds)}
      />
    </div>
  );
}
