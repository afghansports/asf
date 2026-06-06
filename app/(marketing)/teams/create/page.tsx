import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { CreateTeamForm } from "./create-form";

export const metadata: Metadata = {
  title: "Create team",
  description: "Start a new ASF team and invite your community.",
};

/**
 * /teams/create. Per ASF_LAUNCH_PRD.md > STEP 8 > /teams/create.
 * Server gate to ensure the user is authenticated, then renders the client form.
 */
export default async function CreateTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/teams/create");

  return (
    <>
      <PageHero
        eyebrow="New team"
        title="Create your team."
        subtitle="Pick a name, sport, and home city. You will be the captain. Invite players from the manage page once your team is live."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <CreateTeamForm userId={user.id} />
        </div>
      </section>
    </>
  );
}
