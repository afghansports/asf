import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { CreateEventForm } from "./create-form";

export const metadata: Metadata = {
  title: "Post an event",
  description: "Submit a tournament, match, or community event for ASF review.",
};

/**
 * /events/create. Per ASF_LAUNCH_PRD.md > STEP 9 > /events/create.
 * Server-loads the user's captain teams (so they can attribute the event to a
 * team they captain), then renders the client form.
 */
export default async function CreateEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/events/create");

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("captain_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHero
        eyebrow="Post event"
        title="Submit your event."
        subtitle="Fill in the details. ASF reviews every submission within 24 hours before publishing."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <CreateEventForm userId={user.id} captainTeams={(teams ?? []).map((t) => ({ id: t.id, name: t.name }))} />
        </div>
      </section>
    </>
  );
}
