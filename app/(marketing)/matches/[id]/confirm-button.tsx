"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { confirmMatch, disputeMatch } from "../actions";

export function ConfirmMatchButton({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "idle"; m: string }>({ kind: "idle", m: "" });

  function go(kind: "confirm" | "dispute") {
    start(async () => {
      const r = kind === "confirm" ? await confirmMatch(matchId) : await disputeMatch(matchId);
      if (r.ok) {
        setMsg({ kind: "ok", m: kind === "confirm" ? "Confirmed." : "Marked as disputed. ASF admin will review." });
        window.setTimeout(() => window.location.reload(), 1000);
      } else {
        setMsg({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <div className="space-y-3">
      {msg.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{msg.m}</Alert>
      ) : null}
      {msg.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{msg.m}</Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => go("confirm")}
          disabled={pending}
          className="bg-asf-green text-white hover:bg-asf-green/90 h-10 px-5"
        >
          Confirm result
        </Button>
        <Button
          type="button"
          onClick={() => go("dispute")}
          disabled={pending}
          className="bg-asf-red-light text-asf-red border border-asf-red/30 hover:bg-asf-red hover:text-white h-10 px-5"
        >
          Dispute
        </Button>
      </div>
    </div>
  );
}
