import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProgress } from "@/components/shared/onboarding-progress";
import { SportsForm } from "./sports-form";

export default async function OnboardingSportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("sport_interests, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <div>
      <OnboardingProgress current={2} />

      <div className="text-center mb-8 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-black text-asf-text">
          What sports do you like?
        </h1>
        <p className="text-asf-muted">
          Pick one or more. We will personalize your feed and team suggestions.
        </p>
      </div>

      <SportsForm defaultSelected={profile?.sport_interests ?? []} />
    </div>
  );
}
