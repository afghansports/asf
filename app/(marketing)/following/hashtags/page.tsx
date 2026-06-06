import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Followed hashtags" };

export default async function FollowedHashtagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/following/hashtags");

  const { data: rows } = await supabase
    .from("hashtag_follows")
    .select("tag, created_at, hashtags(tag, reel_count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  type Row = {
    tag: string;
    created_at: string;
    hashtags: { tag: string; reel_count: number | null } | null;
  };
  const list = (rows ?? []) as unknown as Row[];

  return (
    <>
      <PageHero
        eyebrow="Following"
        title="Hashtags you follow."
        subtitle="New reels with these tags trigger a notification."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          {list.length === 0 ? (
            <EmptyState
              icon={<Hash className="w-5 h-5" aria-hidden />}
              title="Not following any hashtags yet."
              description="Open any hashtag page and tap Follow to see new reels in your feed and get notified."
            />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {list.map((r) => (
                <li key={r.tag}>
                  <Link
                    href={`/hashtags/${r.tag}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-asf-border text-sm text-asf-text hover:border-asf-red/40"
                  >
                    <Hash className="w-3 h-3 text-asf-red" aria-hidden />
                    {r.tag}
                    <span className="text-xs text-asf-muted">{r.hashtags?.reel_count ?? 0}</span>
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
