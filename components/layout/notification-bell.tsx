import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * NotificationBell — server component, fetches the unread count for the
 * current user. Returns null if not signed in. Renders a bell icon with a
 * red badge if unread > 0.
 */
export async function NotificationBell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  const unread = count ?? 0;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-md text-asf-text hover:bg-asf-off-2"
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
    >
      <Bell className="w-5 h-5" aria-hidden />
      {unread > 0 ? (
        <span className="absolute top-1 right-1 inline-flex min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-asf-red text-white text-[0.6rem] font-condensed font-bold items-center justify-center leading-none">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
