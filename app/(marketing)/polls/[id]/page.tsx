import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { PollVoter } from "./poll-voter";

type Props = { params: { id: string } };

export const metadata = { title: "Poll" };

export default async function PollDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, closes_at, author_id")
    .eq("id", params.id)
    .eq("is_published", true)
    .maybeSingle();
  if (!poll) notFound();

  const { data: options } = await supabase
    .from("poll_options")
    .select("id, label, sort_order, vote_count")
    .eq("poll_id", poll.id)
    .order("sort_order");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myOptionId: string | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", poll.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myOptionId = vote?.option_id ?? null;
  }

  const { data: author } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", poll.author_id)
    .maybeSingle();

  const total = (options ?? []).reduce((s, o) => s + (o.vote_count ?? 0), 0);

  return (
    <>
      <PageHero eyebrow="Poll" title={poll.question} />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          <Link
            href="/polls"
            className="inline-flex items-center gap-1.5 text-sm text-asf-muted hover:text-asf-red mb-4"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            All polls
          </Link>

          {author?.username ? (
            <p className="text-sm text-asf-muted mb-4">
              by{" "}
              <Link href={`/profile/${author.username}`} className="text-asf-text hover:text-asf-red">
                {author.full_name ?? `@${author.username}`}
              </Link>{" "}
              . {total.toLocaleString()} vote{total === 1 ? "" : "s"} . closes{" "}
              {new Date(poll.closes_at).toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}

          <PollVoter
            pollId={poll.id}
            options={(options ?? []).map((o) => ({
              id: o.id,
              label: o.label,
              vote_count: o.vote_count ?? 0,
            }))}
            initialMyOptionId={myOptionId}
            isClosed={new Date(poll.closes_at).getTime() < Date.now()}
            isAuthed={!!user}
            totalVotes={total}
          />
        </div>
      </section>
    </>
  );
}
