"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { AdminResult } from "./_actions";

/**
 * Generic admin action button. Wraps a server action call so admin pages can
 * be server components and just sprinkle these in cells. Confirms before
 * destructive actions if `confirm` is provided. Reloads the page on success.
 */
export function ActionButton({
  action,
  label,
  variant = "default",
  confirm,
  className,
}: {
  action: () => Promise<AdminResult>;
  label: string;
  variant?: "default" | "danger" | "ok";
  confirm?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  function onClick() {
    if (confirm && !window.confirm(confirm)) return;
    start(async () => {
      const r = await action();
      if (!r.ok) {
        window.alert(r.message);
      } else {
        window.location.reload();
      }
    });
  }
  const tone =
    variant === "danger"
      ? "bg-asf-red-light text-asf-red hover:bg-asf-red hover:text-white"
      : variant === "ok"
      ? "bg-asf-green-light text-asf-green hover:bg-asf-green hover:text-white"
      : "bg-asf-off-2 text-asf-text hover:bg-asf-navy hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "h-8 px-3 rounded-md text-xs font-condensed font-bold tracking-[0.16em] uppercase transition-colors disabled:opacity-50",
        tone,
        className
      )}
    >
      {pending ? "..." : label}
    </button>
  );
}
