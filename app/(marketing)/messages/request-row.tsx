"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Check, X, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FillImage } from "@/components/shared/optimized-image";
import { reviewMessageRequest } from "./actions";

export function MessageRequestRow({
  request,
}: {
  request: {
    id: string;
    preview_body: string | null;
    created_at: string;
    sender: { username: string | null; full_name: string | null; avatar_url: string | null };
  };
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function go(decision: "accepted" | "declined" | "blocked") {
    setErr(null);
    start(async () => {
      const r = await reviewMessageRequest({ requestId: request.id, decision });
      if (r.ok) setDone(decision);
      else setErr(r.message);
    });
  }

  if (done === "accepted") {
    return (
      <li className="rounded-md p-4 bg-asf-green-light border border-asf-green/30 text-sm text-asf-green">
        Conversation moved to your inbox.
      </li>
    );
  }
  if (done === "declined" || done === "blocked") {
    return (
      <li className="rounded-md p-4 bg-asf-off-2 border border-asf-border text-sm text-asf-muted">
        Request {done}.
      </li>
    );
  }

  return (
    <li className="rounded-lg p-4 bg-white border border-asf-border space-y-3">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
          {request.sender.avatar_url ? (
            <FillImage src={request.sender.avatar_url} alt="" className="object-cover" sizes="40px" />
          ) : (
            <span aria-hidden>{(request.sender.full_name ?? request.sender.username ?? "?").charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${request.sender.username}`} className="text-sm text-asf-text hover:text-asf-red">
            {request.sender.full_name ?? request.sender.username}
          </Link>
          <p className="text-xs text-asf-muted">
            wants to send you a message . {new Date(request.created_at).toLocaleDateString("en-US")}
          </p>
        </div>
      </div>
      {request.preview_body ? (
        <p className="text-sm text-asf-text/90 italic border-l-2 border-asf-border pl-3">
          {request.preview_body}
        </p>
      ) : null}
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => go("accepted")} disabled={pending} className="h-9 bg-asf-green text-white hover:bg-asf-green/90">
          <Check className="w-3.5 h-3.5" aria-hidden />
          Accept
        </Button>
        <Button onClick={() => go("declined")} disabled={pending} className="h-9 bg-white border border-asf-border text-asf-text hover:bg-asf-off-2">
          <X className="w-3.5 h-3.5" aria-hidden />
          Decline
        </Button>
        <Button onClick={() => go("blocked")} disabled={pending} className="h-9 bg-asf-red-light text-asf-red border border-asf-red/30 hover:bg-asf-red hover:text-white">
          <ShieldOff className="w-3.5 h-3.5" aria-hidden />
          Block
        </Button>
      </div>
    </li>
  );
}
