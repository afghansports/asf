import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { NewGroupForm } from "./new-group-form";

export const metadata: Metadata = { title: "New conversation" };

export default async function NewConversationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages/new");

  // Suggest people the user follows (likely DM recipients).
  const { data: follows } = await supabase
    .from("follows")
    .select("subject_id")
    .eq("follower_id", user.id)
    .eq("subject_type", "user")
    .limit(50);
  const ids = (follows ?? []).map((f) => f.subject_id);
  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", ids)
        .eq("is_active", true)
    : { data: [] };

  return (
    <>
      <PageHero
        eyebrow="New conversation"
        title="Start a chat."
        subtitle="Pick one person for a 1:1 or up to 30 for a group. People you don't follow may go to their Requests folder."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          <NewGroupForm
            suggestions={(profiles ?? []).map((p) => ({
              id: p.id,
              username: p.username,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
            }))}
          />
        </div>
      </section>
    </>
  );
}
