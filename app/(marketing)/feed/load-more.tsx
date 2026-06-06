"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeedItem, type FeedPost } from "@/components/feature/feed-item";
import { loadMoreFeed } from "./actions";

/**
 * Infinite-scroll loader. Starts after the server-rendered latest-20. As the
 * sentinel nears the viewport it fetches + translates the next 20 on demand
 * (translation is cached, so the next reader gets them free).
 */
export function FeedLoadMore({ initialCursor, kind }: { initialCursor: string | null; kind: string }) {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialCursor === null);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || done || !cursor) return;
    setLoading(true);
    try {
      const r = await loadMoreFeed({ cursor, kind: kind || undefined });
      setItems((prev) => [...prev, ...r.posts]);
      setCursor(r.nextCursor);
      if (!r.nextCursor || r.posts.length === 0) setDone(true);
    } catch {
      // transient — leave the sentinel so a later scroll retries
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [loading, done, cursor, kind]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, done]);

  return (
    <>
      {items.length > 0 ? (
        <ol className="space-y-4 mt-4">
          {items.map((p) => (
            <FeedItem key={p.id} post={p} />
          ))}
        </ol>
      ) : null}
      {!done ? (
        <div ref={sentinel} className="py-6 text-center text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
          {loading ? "Loading…" : ""}
        </div>
      ) : items.length > 0 ? (
        <p className="py-6 text-center text-xs text-asf-muted">You&rsquo;re all caught up.</p>
      ) : null}
    </>
  );
}
