"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleReelLike } from "../actions";

export function LikeButton({
  reelId,
  initialLiked,
  initialCount,
}: {
  reelId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const r = await toggleReelLike(reelId);
      if (!r.ok) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-condensed font-bold tracking-[0.16em] uppercase transition-colors",
        liked
          ? "bg-asf-red text-white border-asf-red hover:bg-asf-red-dark"
          : "bg-white text-asf-text border-asf-border hover:bg-asf-off-2"
      )}
    >
      <Heart className={cn("w-4 h-4", liked && "fill-current")} aria-hidden />
      {liked ? "Liked" : "Like"} . {count.toLocaleString()}
    </button>
  );
}
