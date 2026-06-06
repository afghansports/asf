import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = {
  title: "Submit match result",
  description: "Captains: report your team's match result.",
};

export default async function MatchSubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/matches/submit");

  // The captain's own teams (they can submit for these).
  const { data: myTeams } = await supabase
    .from("teams")
    .select("id, name, sport")
    .eq("captain_id", user.id)
    .order("name");

  // All other teams (potential opponents).
  const { data: otherTeams } = await supabase
    .from("teams")
    .select("id, name, sport")
    .neq("captain_id", user.id)
    .order("name")
    .limit(500);

  return (
    <>
      <PageHero
        eyebrow="Match result"
        title="Submit a result."
        subtitle="Pick your team, your opponent, the score, and the date. The opposing captain has 48 hours to confirm or dispute."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          <SubmitForm
            myTeams={(myTeams ?? []).map((t) => ({ id: t.id, name: t.name, sport: t.sport }))}
            otherTeams={(otherTeams ?? []).map((t) => ({ id: t.id, name: t.name, sport: t.sport }))}
          />
        </div>
      </section>
    </>
  );
}
