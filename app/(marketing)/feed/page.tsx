import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { getLocale } from "@/lib/i18n/translate";
import { fetchFeedPage } from "@/lib/feed/query";
import { FeedItem } from "@/components/feature/feed-item";
import { FeedLoadMore } from "./load-more";

export const metadata: Metadata = {
  title: "Activity wall",
  description: "Everything happening across ASF right now.",
};

const FILTERS: { kind: string | null; label: string }[] = [
  { kind: null,               label: "Everything" },
  { kind: "reel",             label: "Reels" },
  { kind: "event",            label: "Events" },
  { kind: "news",             label: "News" },
  { kind: "discussion",       label: "Discussions" },
  { kind: "match_result",     label: "Results" },
  { kind: "tournament",       label: "Tournaments" },
  { kind: "team_created",     label: "Teams" },
  { kind: "external_fixture", label: "Scores" },
  { kind: "external_news",    label: "Sports news" },
];

type Search = { kind?: string };

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<Search> | Search;
}) {
  if (!(await isFeatureEnabled("module.wall"))) return <ModuleDisabled name="Activity wall" />;

  const sp = (searchParams ? await searchParams : {}) as Search;
  const activeKind = sp.kind ?? "";

  // Latest 20, translated for the reader's locale (cached). Older posts are
  // fetched + translated on demand as the reader scrolls (see FeedLoadMore).
  const locale = await getLocale();
  const { posts, nextCursor } = await fetchFeedPage({
    cursor: null,
    kind: activeKind || undefined,
    locale,
  });

  return (
    <>
      <PageHero
        eyebrow="Wall"
        title="Activity"
        subtitle="Every reel, event, news post, match result, and discussion in one place. Newest first."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
          {/* Filter chips */}
          <nav className="flex flex-wrap gap-2 mb-6" aria-label="Filter by activity type">
            {FILTERS.map((f) => (
              <Link
                key={f.kind ?? "all"}
                href={f.kind ? `/feed?kind=${f.kind}` : `/feed`}
                className={
                  activeKind === (f.kind ?? "")
                    ? "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-asf-navy text-white"
                    : "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
                }
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {posts.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-5 h-5" />}
              title="Wall is quiet."
              description="As members post reels, create events, write articles, or join discussions, they will appear here."
            />
          ) : (
            <>
              <ol className="space-y-4">
                {posts.map((p) => (
                  <FeedItem key={p.id} post={p} />
                ))}
              </ol>
              <FeedLoadMore initialCursor={nextCursor} kind={activeKind} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
