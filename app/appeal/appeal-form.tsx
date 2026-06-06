"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { submitAppeal } from "@/lib/safety/moderation";

export function AppealForm({
  suspensionId,
  suspensionType,
  suspensionReason,
  hasPendingAppeal,
}: {
  suspensionId: string;
  suspensionType: string;
  suspensionReason: string;
  hasPendingAppeal: boolean;
}) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; m: string }>({
    kind: "idle",
    m: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await submitAppeal({ suspensionId, reasonText: reason });
      setStatus({ kind: r.ok ? "ok" : "err", m: r.ok ? r.message ?? "Submitted." : r.message });
      if (r.ok) setReason("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg p-6 bg-white border border-asf-border space-y-4">
      <div className="space-y-2">
        <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-red">
          Suspension type: {suspensionType.replace("_", " ")}
        </p>
        <p className="text-sm text-asf-text">
          <strong>Reason on file:</strong> {suspensionReason}
        </p>
      </div>

      {hasPendingAppeal ? (
        <Alert className="border-asf-gold/40 bg-asf-gold-light text-asf-text">
          You already have a pending appeal for this suspension. We will respond within 7 days.
        </Alert>
      ) : null}

      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.m}</Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.m}</Alert>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="reason" className="text-sm font-medium text-asf-text">
          Why should this be reversed? (20-2000 chars)
        </label>
        <Textarea
          id="reason"
          rows={6}
          minLength={20}
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain what happened, provide any context or evidence."
          disabled={pending || hasPendingAppeal}
        />
        <p className="text-xs text-asf-muted">{reason.length} / 2000</p>
      </div>

      <Button
        type="submit"
        disabled={pending || hasPendingAppeal || reason.length < 20}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
      >
        <Send className="w-4 h-4" aria-hidden />
        {pending ? "Submitting" : "Submit appeal"}
      </Button>
    </form>
  );
}
