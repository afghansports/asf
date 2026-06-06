"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleHashtagFollow } from "@/lib/hashtags/actions";
import { cn } from "@/lib/utils";

export function HashtagFollowButton({
  tag,
  initialFollowing,
  className,
}: {
  tag: string;
  initialFollowing: boolean;
  className?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  function go() {
    const next = !following;
    setFollowing(next);
    start(async () => {
      const r = await toggleHashtagFollow(tag);
      if (!r.ok) {
        setFollowing(!next);
        toast.error("Could not update hashtag");
      } else {
        toast.success(next ? "Following hashtag" : "Unfollowed hashtag");
      }
    });
  }

  return (
    <Button
      type="button"
      onClick={go}
      disabled={pending}
      className={cn(
        "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.18em] uppercase",
        following
          ? "bg-asf-navy text-white hover:bg-asf-navy-light"
          : "bg-white border border-asf-border text-asf-text hover:bg-asf-off-2",
        className,
      )}
    >
      <Hash className="w-3.5 h-3.5" aria-hidden />
      {following ? "Following" : "Follow"}
    </Button>
  );
}
