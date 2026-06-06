import type { Metadata } from "next";
import Link from "next/link";
import { Hash, Eye, Heart, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { HashtagFollowButton } from "@/components/shared/hashtag-follow-button";
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { FillImage } from "@/components/shared/optimized-image";

type Props = { params: { tag: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `#${params.tag}` };
}

/**
 * /hashtags/[tag] — all reels tagged with this hashtag, sorted newest first.
 * The hashtag is parsed at insert time by the parse_reel_hashtags trigger
 * (see migration 013).
 */
export default async function HashtagPage({ params }: Props) {
  const tag = params.tag.toLowerCase();
  const supabase = await createClient();

  const { data: meta } = await supabase
    .from("hashtags")
    .select("tag, reel_count, last_used_at")
    .eq("tag", tag)
    .maybeSingle();

  // Is the current user following this hashtag?
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialFollowing = false;
  if (user) {
    const { data: f } = await supabase
      .from("hashtag_follows")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("tag", tag)
      .maybeSingle();
    initialFollowing = !!f;
  }

  const { data: rels } = await supabase
    .from("reel_hashtags")
    .select("reel_id, reels!inner(id, video_url, thumbnail_url, caption, sport, country_code, view_count, like_count, comment_count, created_at, author_id, is_published, deleted_at)")
    .eq("tag", tag)
    .order("reel_id", { ascending: false })
    .limit(60);

  type Reel = {
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    created_at: string;
    author_id: string;
    is_published: boolean;
    deleted_at: string | null;
  };
  const reels = ((rels ?? []) as unknown as Array<{ reels: Reel }>)
    .map((r) => r.reels)
    .filter((r) => r && r.is_published && !r.deleted_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <PageHero
        eyebrow="Hashtag"
        title={`#${tag}`}
        subtitle={
          meta
            ? `${meta.reel_count} reel${meta.reel_count === 1 ? "" : "s"} . last used ${new Date(meta.last_used_at).toLocaleDateString("en-US")}`
            : "No reels yet for this hashtag."
        }
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
          {user ? (
            <div className="mb-6 flex justify-end">
              <HashtagFollowButton tag={tag} initialFollowing={initialFollowing} />
            </div>
          ) : null}
          {reels.length === 0 ? (
            <EmptyState
              icon={<Hash className="w-5 h-5" aria-hidden />}
              title="No reels for this hashtag yet."
              description="Be the first to post one."
              action={{ label: "Upload reel", href: "/reels/upload" }}
            />
          ) : (
            <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {reels.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/reels/${r.id}`}
                    className="group block aspect-[9/16] rounded-md overflow-hidden bg-black relative"
                  >
                    {r.thumbnail_url ? (
                      <FillImage src={cdnUrl(r.thumbnail_url)} alt="" className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video
                        src={cdnUrl(r.video_url)}
                        muted
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[0.7rem] font-medium drop-shadow">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" aria-hidden />
                        {r.view_count.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3 h-3" aria-hidden />
                        {r.like_count.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" aria-hidden />
                        {r.comment_count.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
