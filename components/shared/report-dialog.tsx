"use client";

import { useState, useTransition } from "react";
import { Flag, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { submitReport, type ReportCategory, type ReportTarget } from "@/lib/safety/actions";
import { cn } from "@/lib/utils";

const CATEGORIES: { code: ReportCategory; label: string; description: string }[] = [
  { code: "spam", label: "Spam", description: "Repetitive, unwanted, or commercial content." },
  { code: "harassment", label: "Harassment", description: "Targeting someone with insults, slurs, or unwanted contact." },
  { code: "hate", label: "Hate speech", description: "Attacks based on ethnicity, religion, gender, sexuality." },
  { code: "threats", label: "Threats of violence", description: "Direct threats to harm a person or group." },
  { code: "impersonation", label: "Impersonation", description: "Pretending to be someone else." },
  { code: "inappropriate", label: "Inappropriate content", description: "Nudity, gore, or sexual content." },
  { code: "misinformation", label: "Misinformation", description: "False claims about people, events, or results." },
  { code: "underage", label: "Underage user", description: "Account belongs to someone under 13." },
  { code: "copyright", label: "Copyright", description: "Uses copyrighted music, footage, or images without permission." },
  { code: "other", label: "Something else", description: "Add details below." },
];

/**
 * <ReportDialog/> — drop-in trigger for reporting any user-generated surface.
 * Pass `targetType` + `targetId`. The trigger button is rendered as a
 * subtle Flag icon by default, customizable via `triggerClassName`.
 *
 * The reporter's identity is never revealed to the reported party. Reports
 * with the same (target_type, target_id, category) are deduplicated server-
 * side via the submit_report() RPC, which atomically bumps the parent count.
 */
export function ReportDialog({
  targetType,
  targetId,
  trigger,
  triggerClassName,
}: {
  targetType: ReportTarget;
  targetId: string;
  trigger?: React.ReactNode;
  triggerClassName?: string;
}) {
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; m: string }>({
    kind: "idle",
    m: "",
  });

  function reset() {
    setCategory("");
    setReason("");
    setStatus({ kind: "idle", m: "" });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    start(async () => {
      const r = await submitReport({
        targetType,
        targetId,
        category,
        reasonText: reason,
      });
      setStatus({ kind: r.ok ? "ok" : "err", m: r.ok ? r.message ?? "Submitted." : r.message });
      if (r.ok) {
        window.setTimeout(reset, 2000);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) ?? (
            <button
              type="button"
              aria-label="Report"
              className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-md text-asf-muted hover:text-asf-red hover:bg-asf-red-light",
                triggerClassName,
              )}
            >
              <Flag className="w-3.5 h-3.5" aria-hidden />
            </button>
          )
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-asf-red" aria-hidden />
            Report content
          </DialogTitle>
          <DialogDescription>
            Tell us what is wrong. Your report goes to ASF moderators. The reported person never sees who reported them.
          </DialogDescription>
        </DialogHeader>

        {status.kind === "ok" ? (
          <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.m}</Alert>
        ) : null}
        {status.kind === "err" ? (
          <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.m}</Alert>
        ) : null}

        {status.kind !== "ok" ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <fieldset>
              <legend className="sr-only">Category</legend>
              <ul className="flex flex-col rounded-md border border-asf-border max-h-72 overflow-y-auto">
                {CATEGORIES.map((c) => {
                  const checked = category === c.code;
                  return (
                    <li key={c.code} className="border-b border-asf-border last:border-b-0">
                      <label
                        className={cn(
                          "flex items-start gap-3 px-3 py-2.5 cursor-pointer",
                          checked ? "bg-asf-red-light" : "hover:bg-asf-off-2",
                        )}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={c.code}
                          checked={checked}
                          onChange={() => setCategory(c.code)}
                          className="mt-1 accent-asf-red"
                        />
                        <span>
                          <span className="block text-sm font-medium text-asf-text">{c.label}</span>
                          <span className="block text-xs text-asf-muted leading-snug mt-0.5">
                            {c.description}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div className="space-y-1">
              <label className="text-xs text-asf-muted">
                Add details (optional, 500 chars)
              </label>
              <Textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <p className="text-xs text-asf-muted">
              See our{" "}
              <a href="/community-guidelines" target="_blank" rel="noreferrer" className="underline hover:text-asf-red">
                Community Guidelines
              </a>{" "}
              for what we allow.
            </p>

            <div className="flex items-center justify-end gap-2">
              <DialogClose
                render={<Button variant="outline" className="h-9">Cancel</Button>}
              />
              <Button
                type="submit"
                disabled={pending || !category}
                className="h-9 bg-asf-red text-white hover:bg-asf-red-dark"
              >
                {pending ? "Submitting" : "Submit report"}
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
