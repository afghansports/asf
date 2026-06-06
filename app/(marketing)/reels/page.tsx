import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { ReelsFilterBar } from "./filter-bar";
import { ReelsFeed, type ReelItem } from "./feed";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "Reels",
  description:
    "Short-form videos from the ASF community. Filter by country and sport. Sorted newest first.",
};

type SearchParams = { country?: string; sport?: string };

export default async function ReelsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  if (!(await isFeatureEnabled("module.reels"))) return <ModuleDisabled name="Reels" />;
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("reels")
    .select(
      "id, video_url, thumbnail_url, caption, sport, country_code, state_province, district_code, view_count, like_count, comment_count, created_at, author_id, video_kind, youtube_id"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (sp.country) query = query.eq("country_code", sp.country);
  if (sp.sport) query = query.eq("sport", sp.sport);

  const { data: rows } = await query;
  const reels = (rows ?? []) as Array<{
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    sport: string | null;
    country_code: string | null;
    state_province: string | null;
    district_code: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    created_at: string;
    author_id: string;
    video_kind: string | null;
    youtube_id: string | null;
  }>;

  // Pull authors + liked-by-current-user in parallel.
  const authorIds = Array.from(new Set(reels.map((r) => r.author_id)));
  const reelIds = reels.map((r) => r.id);
  const [authorsRes, likesRes] = await Promise.all([
    authorIds.length
      ? supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", authorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null }> }),
    user && reelIds.length
      ? supabase
          .from("reel_likes")
          .select("reel_id")
          .eq("user_id", user.id)
          .in("reel_id", reelIds)
      : Promise.resolve({ data: [] as Array<{ reel_id: string }> }),
  ]);

  const authorMap = new Map((authorsRes.data ?? []).map((a) => [a.id, a]));
  const likedSet = new Set((likesRes.data ?? []).map((l) => l.reel_id));

  const items: ReelItem[] = reels.map((r) => ({
    id: r.id,
    video_url: r.video_url,
    thumbnail_url: r.thumbnail_url,
    video_kind: (r.video_kind as "file" | "youtube" | "mux" | null) ?? "file",
    youtube_id: r.youtube_id,
    caption: r.caption,
    sport: r.sport,
    country_code: r.country_code,
    state_province: r.state_province,
    district_code: r.district_code,
    view_count: r.view_count ?? 0,
    like_count: r.like_count ?? 0,
    comment_count: r.comment_count ?? 0,
    created_at: r.created_at,
    author: authorMap.get(r.author_id)
      ? {
          username: authorMap.get(r.author_id)!.username,
          full_name: authorMap.get(r.author_id)!.full_name,
          avatar_url: authorMap.get(r.author_id)!.avatar_url,
        }
      : null,
    liked: likedSet.has(r.id),
  }));

  return (
    <>
      <PageHero
        eyebrow="Reels"
        title="Community reels."
        subtitle="Short videos from players, teams, and fans across the diaspora. Filter by country or sport. Newest first."
      />
      <ReelsFilterBar />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <ReelsFeed items={items} />
        </div>
      </section>
    </>
  );
}
