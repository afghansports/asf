import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkAllReadButton } from "./mark-all-read";
import { NotificationItem } from "./notification-item";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your ASF activity, mentions, and updates.",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, actor_id, target_type, target_id, body, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const list = rows ?? [];

  // Resolve actor profiles in one query.
  const actorIds = Array.from(new Set(list.map((n) => n.actor_id).filter(Boolean) as string[]));
  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", actorIds)
    : { data: [] };
  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  const unreadCount = list.filter((n) => !n.is_read).length;

  return (
    <>
      <PageHero
        eyebrow="Activity"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You are caught up."}
      >
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 ? <MarkAllReadButton /> : null}
          <Link
            href="/notifications/preferences"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white/10 backdrop-blur-sm text-white border border-white/30 font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-white/20"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden />
            Preferences
          </Link>
        </div>
      </PageHero>

      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
          {list.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-5 h-5" aria-hidden />}
              title="No notifications yet."
              description="Likes, comments, mentions, and team updates will land here."
            />
          ) : (
            <ul className="rounded-lg border border-asf-border bg-white divide-y divide-asf-border">
              {list.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={{
                    id: n.id,
                    type: n.type,
                    body: n.body ?? "",
                    link: n.link ?? "/dashboard",
                    is_read: !!n.is_read,
                    created_at: n.created_at,
                    actor: actorMap.get(n.actor_id ?? "") ?? null,
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
