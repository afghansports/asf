"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleTeamFollow, startTeamMessage } from "@/lib/teams/follow-actions";
import { cn } from "@/lib/utils";

/**
 * Header action row for a team page: Follow / Following toggle + Message
 * button. Optimistic toggle on follow. Message button creates / fetches the
 * 1:1 DM with the team's senior contact and routes to it.
 */
export function TeamProfileActions({
  teamId,
  initialFollowing,
  signedIn,
  className,
}: {
  teamId: string;
  initialFollowing: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pendingFollow, startFollow] = useTransition();
  const [pendingMessage, startMessage] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function follow() {
    if (!signedIn) {
      router.push(`/login?next=/teams`);
      return;
    }
    const next = !following;
    setFollowing(next);
    setErr(null);
    startFollow(async () => {
      const r = await toggleTeamFollow(teamId);
      if (!r.ok) {
        setFollowing(!next);
        setErr(r.message);
      } else {
        setFollowing(r.following);
      }
    });
  }

  function message() {
    if (!signedIn) {
      router.push(`/login?next=/teams`);
      return;
    }
    setErr(null);
    startMessage(async () => {
      const r = await startTeamMessage(teamId);
      if (!r.ok) {
        setErr(r.message);
        return;
      }
      router.push(`/messages/${r.conversationId}`);
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        onClick={follow}
        disabled={pendingFollow}
        className={cn(
          "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.18em] uppercase",
          following
            ? "bg-asf-navy text-white hover:bg-asf-navy-light"
            : "bg-asf-red text-white hover:bg-asf-red-dark",
        )}
      >
        {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
        {following ? "Following" : "Follow team"}
      </Button>
      <Button
        type="button"
        onClick={message}
        disabled={pendingMessage}
        className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
      >
        {pendingMessage ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MessageSquare className="w-3.5 h-3.5" />
        )}
        Message
      </Button>
      {err ? <p className="text-xs text-asf-red w-full">{err}</p> : null}
    </div>
  );
}
