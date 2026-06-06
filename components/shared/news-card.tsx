import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { cdnUrl } from "@/lib/cdn/cloudflare";

/**
 * NewsCard. Used on /news list and homepage news teaser.
 */

export type NewsCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function NewsCard({ post, className }: { post: NewsCardData; className?: string }) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-asf-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      <div className="relative h-44 bg-asf-off-2" aria-hidden>
        {post.image_url ? (
          <Image src={cdnUrl(post.image_url)} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 360px" unoptimized />
        ) : null}
      </div>
      <div className="flex flex-col flex-1 p-5 gap-2">
        {post.published_at ? (
          <p className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-red">
            {formatDate(post.published_at)}
          </p>
        ) : null}
        <h3 className="font-display font-bold text-base sm:text-lg leading-snug text-asf-text line-clamp-3 break-words">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="text-xs sm:text-sm text-asf-muted leading-relaxed line-clamp-3 break-words">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto pt-3">
          <Link
            href={`/news/${post.slug}`}
            className="inline-flex items-center font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red group-hover:underline underline-offset-4"
          >
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
}
