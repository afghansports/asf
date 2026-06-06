import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = { title: "Polls" };

export default async function PollsListPage() {
  if (!(await isFeatureEnabled("module.polls"))) return <ModuleDisabled name="Polls" />;
  const supabase = await createClient();
  const { data: polls } = await supabase
    .from("polls")
    .select("id, question, closes_at, created_at, author_id")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(60);
  const list = polls ?? [];

  const authorIds = Array.from(new Set(list.map((p) => p.author_id)));
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  const ids = list.map((p) => p.id);
  const { data: options } = ids.length
    ? await supabase
        .from("poll_options")
        .select("poll_id, vote_count")
        .in("poll_id", ids)
    : { data: [] };
  const totalsByPoll = new Map<string, number>();
  for (const o of options ?? []) {
    totalsByPoll.set(o.poll_id, (totalsByPoll.get(o.poll_id) ?? 0) + (o.vote_count ?? 0));
  }

  return (
    <>
      <PageHero
        eyebrow="Polls"
        title="Community polls."
        subtitle="Quick votes from across the federation. Pick a winner, settle a debate, or just see what people think."
      >
        <Link
          href="/polls/new"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-asf-red text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-red-dark"
        >
          <PlusCircle className="w-4 h-4" aria-hidden />
          New poll
        </Link>
      </PageHero>

      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          {list.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-5 h-5" aria-hidden />}
              title="No polls yet."
              description="Be the first to start one. Polls close after the date you set."
              action={{ label: "Create a poll", href: "/polls/new" }}
            />
          ) : (
            <ul className="space-y-3">
              {list.map((p) => {
                const author = authorMap.get(p.author_id);
                const total = totalsByPoll.get(p.id) ?? 0;
                const closes = new Date(p.closes_at);
                const closed = closes.getTime() < Date.now();
                return (
                  <li key={p.id}>
                    <Link
                      href={`/polls/${p.id}`}
                      className="block p-5 rounded-lg bg-white border border-asf-border hover:border-asf-red/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display font-bold text-base text-asf-text leading-snug">
                            {p.question}
                          </p>
                          {author?.username ? (
                            <p className="text-xs text-asf-muted mt-1">
                              @{author.username} . {total.toLocaleString()} vote{total === 1 ? "" : "s"}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={
                            closed
                              ? "inline-flex items-center px-2 py-0.5 rounded bg-asf-off-2 text-asf-muted text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase"
                              : "inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase"
                          }
                        >
                          {closed ? "Closed" : "Open"}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
