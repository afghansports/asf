import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { NewsCard, type NewsCardData } from "@/components/shared/news-card";
import { EmptyState } from "@/components/shared/empty-state";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "News",
  description: "ASF news, announcements, and community stories.",
};

const PAGE_SIZE = 9;

export default async function NewsListPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }> | { page?: string };
}) {
  if (!(await isFeatureEnabled("module.news"))) return <ModuleDisabled name="News" />;
  const sp = (searchParams ? await searchParams : {}) as { page?: string };
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, image_url, published_at", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(from, to);
  const posts = (data ?? []) as NewsCardData[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHero
        eyebrow="News"
        title="News and announcements."
        subtitle="Tournament results, federation updates, and community stories from across the United States."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          {posts.length === 0 ? (
            <EmptyState
              icon={<Newspaper className="w-5 h-5" aria-hidden />}
              title="No news posted yet."
              description="ASF announcements and community stories will appear here."
            />
          ) : (
            <>
              <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <NewsCard post={p} />
                  </li>
                ))}
              </ul>
              {totalPages > 1 ? (
                <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    const active = p === page;
                    return (
                      <a
                        key={p}
                        href={p === 1 ? "/news" : `/news?page=${p}`}
                        className={
                          active
                            ? "h-9 w-9 inline-flex items-center justify-center rounded-md bg-asf-navy text-white text-sm font-condensed font-bold"
                            : "h-9 w-9 inline-flex items-center justify-center rounded-md bg-white border border-asf-border text-asf-text text-sm hover:bg-asf-off-2"
                        }
                      >
                        {p}
                      </a>
                    );
                  })}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </section>
    </>
  );
}
