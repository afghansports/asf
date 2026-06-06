"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleBookmark, type BookmarkTarget } from "@/lib/bookmarks/actions";

/**
 * Save / unsave button. Drop into any reel, event, news post, team, or
 * tournament card. Shows filled bookmark when saved.
 */
export function BookmarkButton({
  targetType,
  targetId,
  initialSaved,
  variant = "icon",
  className,
}: {
  targetType: BookmarkTarget;
  targetId: string;
  initialSaved: boolean;
  variant?: "icon" | "labeled";
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  function go() {
    const next = !saved;
    setSaved(next);
    start(async () => {
      const r = await toggleBookmark({ targetType, targetId });
      if (!r.ok) setSaved(!next);
    });
  }

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-condensed font-bold tracking-[0.16em] uppercase transition-colors",
          saved
            ? "bg-asf-navy text-white border-asf-navy hover:bg-asf-navy-light"
            : "bg-white text-asf-text border-asf-border hover:bg-asf-off-2",
          className,
        )}
      >
        <Bookmark className={cn("w-4 h-4", saved && "fill-current")} aria-hidden />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Unsave" : "Save"}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors",
        saved ? "text-asf-gold" : "text-asf-muted hover:text-asf-text hover:bg-asf-off-2",
        className,
      )}
    >
      <Bookmark className={cn("w-4 h-4", saved && "fill-current")} aria-hidden />
    </button>
  );
}
