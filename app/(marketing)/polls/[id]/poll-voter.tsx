"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { votePoll } from "../actions";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string; vote_count: number };

export function PollVoter({
  pollId,
  options,
  initialMyOptionId,
  isClosed,
  isAuthed,
  totalVotes,
}: {
  pollId: string;
  options: Option[];
  initialMyOptionId: string | null;
  isClosed: boolean;
  isAuthed: boolean;
  totalVotes: number;
}) {
  const [optimistic, setOptimistic] = useState<{
    myOptionId: string | null;
    counts: Record<string, number>;
    total: number;
  }>(() => ({
    myOptionId: initialMyOptionId,
    counts: Object.fromEntries(options.map((o) => [o.id, o.vote_count])),
    total: totalVotes,
  }));
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const showResults = isClosed || optimistic.myOptionId !== null;

  function vote(optionId: string) {
    if (!isAuthed) return;
    if (isClosed) return;
    if (optimistic.myOptionId) return;
    setErr(null);
    setOptimistic((s) => ({
      myOptionId: optionId,
      counts: { ...s.counts, [optionId]: (s.counts[optionId] ?? 0) + 1 },
      total: s.total + 1,
    }));
    start(async () => {
      const r = await votePoll({ pollId, optionId });
      if (!r.ok) {
        setErr(r.message);
        setOptimistic((s) => ({
          myOptionId: null,
          counts: { ...s.counts, [optionId]: Math.max(0, (s.counts[optionId] ?? 0) - 1) },
          total: Math.max(0, s.total - 1),
        }));
        toast.error(r.message);
      } else {
        toast.success("Vote recorded");
      }
    });
  }

  return (
    <div className="space-y-3">
      {!isAuthed ? (
        <Alert className="border-asf-gold/30 bg-asf-gold-light text-asf-text">
          <Link href="/login?next=/polls" className="text-asf-red hover:underline">Sign in</Link> to vote.
        </Alert>
      ) : null}
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <ul className="space-y-2">
        {options.map((o) => {
          const count = optimistic.counts[o.id] ?? 0;
          const pct = optimistic.total > 0 ? (count / optimistic.total) * 100 : 0;
          const mine = optimistic.myOptionId === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={!isAuthed || isClosed || optimistic.myOptionId !== null || pending}
                onClick={() => vote(o.id)}
                className={cn(
                  "relative block w-full text-left rounded-md border bg-white p-3 overflow-hidden transition-colors",
                  mine ? "border-asf-red bg-asf-red-light" : "border-asf-border",
                  !showResults && !isClosed && isAuthed && "hover:border-asf-red/40 cursor-pointer",
                  (showResults || isClosed) && "cursor-default",
                )}
              >
                {showResults ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 -z-0",
                      mine ? "bg-asf-red/15" : "bg-asf-navy/8",
                    )}
                    style={{ width: `${pct}%`, transition: "width 250ms ease-out" }}
                  />
                ) : null}
                <div className="relative flex items-center justify-between gap-3">
                  <span className="font-medium text-asf-text">
                    {mine ? <Check className="inline-block w-3.5 h-3.5 mr-1 text-asf-red" aria-hidden /> : null}
                    {o.label}
                  </span>
                  {showResults ? (
                    <span className="text-xs text-asf-muted tabular-nums">
                      {pct.toFixed(0)}% . {count}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {isClosed ? (
        <p className="text-xs text-asf-muted">This poll is closed.</p>
      ) : optimistic.myOptionId ? (
        <p className="text-xs text-asf-muted">Thanks for voting. Results update live.</p>
      ) : null}
    </div>
  );
}
