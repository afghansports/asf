import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { ShareButtons } from "@/components/shared/share-buttons";
import { NewsCard, type NewsCardData } from "@/components/shared/news-card";
import { getLocale, translateMany, isTranslatable } from "@/lib/i18n/translate";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("title, excerpt")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return { title: "Article not found" };
  return { title: data.title, description: data.excerpt ?? "ASF news" };
}

export default async function NewsArticlePage({ params }: Props) {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("news_posts")
    .select("id, title, slug, content, excerpt, image_url, published_at, author_id")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!post) notFound();

  const { data: author } = post.author_id
    ? await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", post.author_id)
        .maybeSingle()
    : { data: null };

  const { data: relatedRows } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, image_url, published_at")
    .eq("is_published", true)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(3);
  const related = (relatedRows ?? []) as NewsCardData[];

  // Auto-translate the visible article + related cards for Dari/Pashto readers.
  const locale = await getLocale();
  let title = post.title;
  let content = post.content;
  let relatedView = related;
  if (isTranslatable(locale)) {
    [title, content] = await translateMany([post.title ?? "", post.content ?? ""], locale);
    if (related.length) {
      const n = related.length;
      const t = await translateMany(
        [...related.map((r) => r.title ?? ""), ...related.map((r) => r.excerpt ?? "")],
        locale,
      );
      relatedView = related.map((r, i) => ({ ...r, title: t[i] || r.title, excerpt: t[n + i] || r.excerpt }));
    }
  }

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/news/${post.slug}`;

  return (
    <>
      <PageHero eyebrow="News" title={title} />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-asf-muted mb-6">
            {dateStr ? <span>{dateStr}</span> : null}
            {author ? (
              <span>
                by{" "}
                <Link href={`/profile/${author.username}`} className="text-asf-text hover:text-asf-red">
                  {author.full_name ?? author.username}
                </Link>
              </span>
            ) : null}
          </div>

          {post.image_url ? (
            <div className="relative w-full aspect-[16/9] rounded-lg mb-8 overflow-hidden bg-asf-off-2">
              <Image src={post.image_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" unoptimized />
            </div>
          ) : null}

          <article dir="auto" className="prose-lg max-w-none text-asf-text/90 leading-relaxed whitespace-pre-line">
            {content}
          </article>

          <div className="mt-10 pt-6 border-t border-asf-border flex flex-wrap items-center justify-between gap-3">
            <Link href="/news" className="inline-flex items-center gap-1.5 text-sm text-asf-muted hover:text-asf-red">
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back to News
            </Link>
            <ShareButtons url={fullUrl} title={title} />
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="w-full bg-white border-t border-asf-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
            <h2 className="font-display font-bold text-2xl text-asf-text mb-6">Related news</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedView.map((p) => (
                <li key={p.id}>
                  <NewsCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
