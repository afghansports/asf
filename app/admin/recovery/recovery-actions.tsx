"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveRecoveryRequest, denyRecoveryRequest } from "../_actions";

export function RecoveryActions({
  requestId,
  matchedUserId,
}: {
  requestId: string;
  matchedUserId: string | null;
}) {
  const [pending, start] = useTransition();
  const [denying, setDenying] = useState(false);
  const [notes, setNotes] = useState("");

  function approve() {
    if (!matchedUserId) {
      toast.error("Match the request to an account first.");
      return;
    }
    if (!confirm("Change this account's email to the requested address and send a password reset?")) return;
    start(async () => {
      const res = await approveRecoveryRequest(requestId, matchedUserId);
      if (res.ok) toast.success("Account email updated; reset link sent");
      else toast.error(res.message);
    });
  }

  function deny() {
    start(async () => {
      const res = await denyRecoveryRequest(requestId, notes.trim());
      if (res.ok) {
        toast.success("Request denied");
        setDenying(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending || !matchedUserId}
          className="px-3 py-1.5 rounded-md bg-asf-green text-white text-xs font-condensed font-bold tracking-[0.14em] uppercase disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => setDenying((v) => !v)}
          disabled={pending}
          className="px-3 py-1.5 rounded-md bg-asf-off text-asf-text border border-asf-border text-xs font-condensed font-bold tracking-[0.14em] uppercase"
        >
          Deny
        </button>
      </div>
      {denying && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Reason (optional, internal)"
            className="w-full text-sm rounded-md border border-asf-border bg-white px-2 py-1.5"
          />
          <button
            type="button"
            onClick={deny}
            disabled={pending}
            className="px-3 py-1.5 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.14em] uppercase disabled:opacity-40"
          >
            Confirm denial
          </button>
        </div>
      )}
    </div>
  );
}
