import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProgress } from "@/components/shared/onboarding-progress";
import { LocationForm } from "./location-form";

export default async function OnboardingLocationPage() {
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

  return (
    <div>
      <OnboardingProgress current={1} />

      <div className="text-center mb-8 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-black text-asf-text">
          Where are you?
        </h1>
        <p className="text-asf-muted">
          We will show events and teams in your area first. You can change this anytime.
        </p>
      </div>

      <LocationForm
        defaultCountry={profile?.country_code ?? "US"}
        defaultState={profile?.state_province ?? ""}
      />
    </div>
  );
}
