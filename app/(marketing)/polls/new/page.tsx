import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { NewPollForm } from "./new-poll-form";

export const metadata: Metadata = { title: "New poll" };

export default async function NewPollPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/polls/new");

  return (
    <>
      <PageHero
        eyebrow="New poll"
        title="Create a poll."
        subtitle="2 to 4 options, closes after a window you set. One vote per user. Anyone can view; signed-in users can vote."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          <NewPollForm />
        </div>
      </section>
    </>
  );
}
