import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { NewsCard, type NewsCardData } from "@/components/shared/news-card";
import { EmptyState } from "@/components/shared/empty-state";

/**
 * NewsTeaser (server). Per ASF_LAUNCH_PRD.md > STEP 5 > News Teaser.
 * Query: published news posts ORDER BY published_at DESC LIMIT 3.
 */
export async function NewsTeaser() {
  let posts: NewsCardData[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("news_posts")
      .select("id, title, slug, excerpt, image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3);
    posts = (data ?? []) as NewsCardData[];
  } catch {
    posts = [];
  }

  return (
    <section className="w-full bg-asf-off">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="space-y-3">
            <SectionLabel>From the federation</SectionLabel>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight">
              Latest news
            </h2>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
          >
            View all news
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="w-5 h-5" aria-hidden />}
            title="No news posted yet."
            description="ASF announcements, results, and community stories will appear here."
          />
        ) : (
          <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <NewsCard post={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
