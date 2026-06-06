import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Dynamic sitemap. Static routes + DB-backed dynamic routes (teams + events
 * + news). Per ASF_LAUNCH_PRD.md > STEP 12.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://afghansportsfederation.com";

const STATIC: MetadataRoute.Sitemap = [
  "/", "/about", "/about/mission", "/about/history", "/about/team",
  "/events", "/events/calendar", "/teams", "/tournaments", "/matches",
  "/chapters", "/free-agents", "/reels", "/gallery", "/news",
  "/sponsors", "/faq", "/contact", "/privacy", "/terms", "/community-guidelines",
  "/leaderboards", "/search", "/polls",
].map((path) => ({
  url: `${BASE}${path}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: path === "/" ? 1 : 0.7,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient();
    const [{ data: teams }, { data: events }, { data: news }] = await Promise.all([
      supabase.from("teams").select("slug, updated_at").limit(2000),
      supabase.from("events").select("id, slug, updated_at").eq("is_published", true).limit(2000),
      supabase.from("news_posts").select("slug, published_at").eq("is_published", true).limit(2000),
    ]);

    const teamUrls: MetadataRoute.Sitemap = (teams ?? []).map((t) => ({
      url: `${BASE}/teams/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    const eventUrls: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
      url: `${BASE}/events/${e.slug ?? e.id}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));
    const newsUrls: MetadataRoute.Sitemap = (news ?? []).map((n) => ({
      url: `${BASE}/news/${n.slug}`,
      lastModified: n.published_at ? new Date(n.published_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [...STATIC, ...teamUrls, ...eventUrls, ...newsUrls];
  } catch {
    return STATIC;
  }
}
