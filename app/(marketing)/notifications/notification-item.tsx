"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markNotificationRead } from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";
import { FillImage } from "@/components/shared/optimized-image";

type N = {
  id: string;
  type: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
  actor: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export function NotificationItem({ notification }: { notification: N }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function open() {
    if (!notification.is_read) {
      start(async () => {
        await markNotificationRead(notification.id);
      });
    }
    router.push(notification.link);
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer hover:bg-asf-off-2",
        !notification.is_read && "bg-asf-off",
      )}
      onClick={open}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open();
      }}
    >
      <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden shrink-0">
        {notification.actor?.avatar_url ? (
          <FillImage src={notification.actor.avatar_url} alt="" className="object-cover" sizes="36px" />
        ) : (
          <span aria-hidden>
            {(notification.actor?.full_name ?? notification.actor?.username ?? "A").charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", !notification.is_read && "text-asf-text font-medium", notification.is_read && "text-asf-text/85")}>
          {notification.body}
        </p>
        <p className="text-[0.7rem] text-asf-muted mt-1">
          {relativeTime(notification.created_at)} . {notification.type.replace("_", " ")}
        </p>
      </div>
      {!notification.is_read ? (
        <span className="mt-1 inline-block w-2 h-2 rounded-full bg-asf-red shrink-0" aria-hidden />
      ) : null}
      {pending ? <span className="sr-only">marking read</span> : null}
    </li>
  );
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-US");
}
