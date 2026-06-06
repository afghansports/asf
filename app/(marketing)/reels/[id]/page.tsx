import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Eye, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FillImage } from "@/components/shared/optimized-image";
import { CommentThread } from "./comment-thread";
import { LikeButton } from "./like-button";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Reel ${params.id.slice(0, 8)}` };
}

export default async function ReelDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("reels")
    .select(
      "id, video_url, thumbnail_url, caption, sport, country_code, view_count, like_count, comment_count, created_at, author_id, video_kind, youtube_id"
    )
    .eq("id", params.id)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", r.author_id)
    .maybeSingle();

  const { data: comments } = await supabase
    .from("reel_comments")
    .select("id, body, created_at, author_id")
    .eq("reel_id", r.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const commentAuthorIds = Array.from(new Set((comments ?? []).map((c) => c.author_id)));
  const { data: commentAuthors } = commentAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", commentAuthorIds)
    : { data: [] };
  const authorMap = new Map((commentAuthors ?? []).map((a) => [a.id, a]));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: liked } = user
    ? await supabase
        .from("reel_likes")
        .select("reel_id")
        .eq("reel_id", r.id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <section className="w-full bg-asf-off">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <Link
            href="/reels"
            className="inline-flex items-center gap-1.5 text-sm text-asf-muted hover:text-asf-red mb-4"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to feed
          </Link>
          <div className="rounded-lg overflow-hidden bg-black aspect-[9/16] sm:aspect-video max-h-[80vh]">
            {r.video_kind === "youtube" && r.youtube_id ? (
              <iframe
                title={r.caption ?? "YouTube reel"}
                src={`https://www.youtube.com/embed/${r.youtube_id}?modestbranding=1&rel=0&playsinline=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full bg-black"
              />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={r.video_url}
                poster={r.thumbnail_url ?? undefined}
                className="w-full h-full object-contain"
                controls
                playsInline
              />
            )}
          </div>
          {r.caption ? (
            <p className="mt-4 text-asf-text leading-relaxed whitespace-pre-line">{r.caption}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-asf-muted">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" aria-hidden /> {r.view_count.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" aria-hidden /> {r.like_count.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" aria-hidden /> {r.comment_count.toLocaleString()}
            </span>
          </div>
          {author?.username ? (
            <Link
              href={`/profile/${author.username}`}
              className="mt-4 inline-flex items-center gap-2 hover:text-asf-red"
            >
              <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                {author.avatar_url ? (
                  <FillImage src={author.avatar_url} alt="" className="object-cover" sizes="36px" />
                ) : (
                  <span aria-hidden>{(author.full_name ?? author.username).charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span>
                <span className="block text-sm text-asf-text">{author.full_name ?? author.username}</span>
                <span className="block text-xs text-asf-muted">@{author.username}</span>
              </span>
            </Link>
          ) : null}
          <div className="mt-4">
            <LikeButton reelId={r.id} initialLiked={!!liked} initialCount={r.like_count} />
          </div>
        </div>

        <aside>
          <CommentThread
            reelId={r.id}
            initialComments={(comments ?? []).map((c) => {
              const a = authorMap.get(c.author_id);
              return {
                id: c.id,
                body: c.body,
                created_at: c.created_at,
                author: a
                  ? { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url }
                  : null,
              };
            })}
            currentUser={user ? { id: user.id } : null}
          />
        </aside>
      </div>
    </section>
  );
}
