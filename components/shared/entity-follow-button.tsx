"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  toggleClubFollow,
  toggleFederationFollow,
} from "@/lib/teams/follow-actions";
import { cn } from "@/lib/utils";

/**
 * Reusable follow button for clubs and federations. Optimistic toggle.
 */
export function EntityFollowButton({
  entityType,
  entityId,
  initialFollowing,
  signedIn,
  className,
}: {
  entityType: "club" | "federation";
  entityId: string;
  initialFollowing: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function go() {
    if (!signedIn) {
      router.push(`/login`);
      return;
    }
    const next = !following;
    setFollowing(next);
    setErr(null);
    start(async () => {
      const fn = entityType === "club" ? toggleClubFollow : toggleFederationFollow;
      const r = await fn(entityId);
      if (!r.ok) {
        setFollowing(!next);
        setErr(r.message);
        toast.error(r.message);
      } else {
        setFollowing(r.following);
        toast.success(r.following ? "Following" : "Unfollowed");
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={go}
        disabled={pending}
        className={cn(
          "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.18em] uppercase",
          following
            ? "bg-asf-navy text-white hover:bg-asf-navy-light"
            : "bg-asf-red text-white hover:bg-asf-red-dark",
          className,
        )}
      >
        {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
        {following ? "Following" : "Follow"}
      </Button>
      {err ? <p className="text-xs text-asf-red">{err}</p> : null}
    </div>
  );
}
