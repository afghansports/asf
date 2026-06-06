import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { PreferencesForm } from "./preferences-form";
import { PushSubscribe } from "@/components/layout/push-subscribe";
import { SectionLabel } from "@/components/shared/section-label";

export const metadata = { title: "Notification preferences" };

const TYPE_LABELS: Record<string, { label: string; description: string }> = {
  follow: { label: "New follower", description: "Someone followed you." },
  like_reel: { label: "Reel likes", description: "Someone liked your reel." },
  comment_reel: { label: "Reel comments", description: "Someone commented on your reel." },
  mention: { label: "Mentions", description: "Someone @-mentioned you." },
  team_invite: { label: "Team activity", description: "Roster invites and join requests." },
  match_reported: { label: "Match reported", description: "An opposing captain submitted a result." },
  match_confirmed: { label: "Match confirmed", description: "A match result was confirmed." },
  event_approved: { label: "Event approved", description: "Your submitted event was approved." },
  event_rejected: { label: "Event rejected", description: "Your submitted event was rejected." },
  announcement: { label: "Announcements", description: "Official ASF + chapter announcements." },
  message: { label: "Direct messages", description: "New direct messages." },
  message_request: { label: "Message requests", description: "Someone you don't follow wants to message you." },
  strike: { label: "Strikes", description: "Account strikes (always sent)." },
  suspension: { label: "Suspensions", description: "Suspension and appeal updates." },
};

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications/preferences");

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", user.id)
    .maybeSingle();
  const prefs = (profile?.notification_prefs ?? {}) as Record<string, { inapp?: boolean; email?: boolean }>;

  return (
    <>
      <PageHero
        eyebrow="Notifications"
        title="Preferences"
        subtitle="Choose which notifications you receive in-app and by email. Strike and suspension notifications are always delivered."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          <PreferencesForm
            initial={prefs}
            labels={TYPE_LABELS}
          />

          <div className="mt-8 p-6 rounded-lg bg-white border border-asf-border">
            <SectionLabel>Browser push notifications</SectionLabel>
            <p className="mt-2 mb-4 text-sm text-asf-muted">
              Get push notifications on this device even when ASF is closed. Available on supported browsers.
            </p>
            <PushSubscribe />
          </div>
        </div>
      </section>
    </>
  );
}
