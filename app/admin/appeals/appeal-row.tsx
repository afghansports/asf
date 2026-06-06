"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { FillImage } from "@/components/shared/optimized-image";
import { resolveAppeal } from "@/lib/safety/moderation";

type Props = {
  appeal: {
    id: string;
    status: string;
    reason_text: string;
    decision_note: string | null;
    created_at: string;
    reviewed_at: string | null;
    user: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
  };
};

export function AppealRow({ appeal }: Props) {
  const [note, setNote] = useState(appeal.decision_note ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "idle"; m: string }>({ kind: "idle", m: "" });

  function go(decision: "approved" | "denied") {
    start(async () => {
      const r = await resolveAppeal({ appealId: appeal.id, decision, note });
      if (r.ok) {
        setMsg({ kind: "ok", m: `Appeal ${decision}.` });
        window.setTimeout(() => window.location.reload(), 700);
      } else {
        setMsg({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <li className="rounded-lg p-5 bg-white border border-asf-border space-y-3">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
          {appeal.user?.avatar_url ? (
            <FillImage src={appeal.user.avatar_url} alt="" className="object-cover" sizes="36px" />
          ) : (
            <span aria-hidden>{(appeal.user?.full_name ?? appeal.user?.username ?? "?").charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          {appeal.user?.username ? (
            <Link href={`/profile/${appeal.user.username}`} target="_blank" className="text-sm text-asf-text hover:text-asf-red">
              {appeal.user.full_name ?? appeal.user.username}
            </Link>
          ) : null}
          <p className="text-xs text-asf-muted">
            Submitted {new Date(appeal.created_at).toLocaleString("en-US")} . Status: {appeal.status}
          </p>
        </div>
      </div>

      <p className="text-sm text-asf-text/90 whitespace-pre-line border-l-2 border-asf-border pl-3">{appeal.reason_text}</p>

      {msg.kind === "ok" ? <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{msg.m}</Alert> : null}
      {msg.kind === "err" ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{msg.m}</Alert> : null}

      {appeal.status === "pending" ? (
        <div className="space-y-2 pt-2 border-t border-asf-border">
          <label className="text-xs text-asf-muted">Decision note (sent to user)</label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => go("approved")}
              disabled={pending}
              className="h-9 bg-asf-green text-white hover:bg-asf-green/90"
            >
              Approve (lift suspension)
            </Button>
            <Button
              type="button"
              onClick={() => go("denied")}
              disabled={pending}
              className="h-9 bg-asf-red text-white hover:bg-asf-red-dark"
            >
              Deny
            </Button>
          </div>
        </div>
      ) : appeal.decision_note ? (
        <p className="text-xs text-asf-muted border-t border-asf-border pt-2">
          Decision note: {appeal.decision_note}
        </p>
      ) : null}
    </li>
  );
}
