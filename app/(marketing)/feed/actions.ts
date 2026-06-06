"use server";

import { getLocale } from "@/lib/i18n/translate";
import { fetchFeedPage } from "@/lib/feed/query";
import type { FeedPost } from "@/components/feature/feed-item";

/** Load the next page of the wall (older than `cursor`), translated for the
 *  reader's locale. Called by the infinite-scroll loader as the user scrolls. */
export async function loadMoreFeed(input: {
  cursor: string;
  kind?: string;
}): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const locale = await getLocale();
  return fetchFeedPage({ cursor: input.cursor, kind: input.kind, locale });
}
