import "server-only";
import { createClient } from "@/lib/supabase/server";
import { translateMany, isTranslatable } from "@/lib/i18n/translate";
import type { FeedPost } from "@/components/feature/feed-item";

/**
 * One page of the activity wall, newest first, with actor profiles hydrated and
 * title/body translated for the active locale (cached). Shared by the feed page
 * (initial latest-20) and the loadMoreFeed server action (scroll → next 20), so
 * translation happens lazily, only for posts a reader actually loads.
 */
export const FEED_PAGE = 20;

export async function fetchFeedPage(opts: {
  cursor: string | null;
  kind?: string;
  locale: string;
}): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("wall_posts")
    .select("id, actor_id, kind, title, body, image_url, link, created_at")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE);
  if (opts.cursor) query = query.lt("created_at", opts.cursor);
  if (opts.kind) query = query.eq("kind", opts.kind);

  const { data: rows } = await query;
  const list = rows ?? [];
  if (list.length === 0) return { posts: [], nextCursor: null };

  // Hydrate actor profiles in one round trip.
  const actorIds = Array.from(
    new Set(list.map((p) => p.actor_id).filter((id): id is string => !!id)),
  );
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", actorIds)
    : { data: [] };
  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  // Lazy, cached translation of the visible page.
  let titles = list.map((p) => p.title ?? "");
  let bodies = list.map((p) => p.body ?? "");
  if (isTranslatable(opts.locale)) {
    const n = list.length;
    const tx = await translateMany([...titles, ...bodies], opts.locale);
    titles = tx.slice(0, n);
    bodies = tx.slice(n);
  }

  const posts: FeedPost[] = list.map((p, i) => {
    const a = p.actor_id ? actorMap.get(p.actor_id) : null;
    return {
      id: p.id,
      kind: p.kind,
      title: titles[i] || p.title,
      body: bodies[i] || p.body,
      image_url: p.image_url,
      link: p.link,
      created_at: p.created_at,
      actor: a
        ? { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url }
        : null,
    };
  });

  const nextCursor = list.length === FEED_PAGE ? list[list.length - 1].created_at : null;
  return { posts, nextCursor };
}
