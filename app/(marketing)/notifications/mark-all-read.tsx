"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          await markAllNotificationsRead();
        })
      }
      disabled={pending}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-asf-red text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-red-dark"
    >
      <CheckCheck className="w-3.5 h-3.5" aria-hidden />
      {pending ? "Marking" : "Mark all read"}
    </button>
  );
}
