"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminResolveReport } from "@/lib/safety/actions";
import { cn } from "@/lib/utils";

type Props = {
  report: {
    id: string;
    target_type: string;
    target_label: string;
    target_id: string;
    category: string;
    category_label: string;
    status: string;
    hit_count: number;
    first_reported_at: string;
    last_reported_at: string;
    resolution_note: string | null;
  };
  previews: Array<{ reason_text: string | null; created_at: string }>;
};

export function ReportRow({ report, previews }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(report.resolution_note ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function resolve(outcome: "actioned" | "dismissed" | "false") {
    setErr(null);
    start(async () => {
      const r = await adminResolveReport({ reportId: report.id, outcome, note });
      if (!r.ok) setErr(r.message);
      else window.location.reload();
    });
  }

  const tone =
    report.status === "actioned"
      ? "bg-asf-green-light text-asf-green"
      : report.status === "dismissed"
        ? "bg-asf-off-2 text-asf-muted"
        : report.hit_count >= 5
          ? "bg-asf-red text-white"
          : report.hit_count >= 2
            ? "bg-asf-gold-light text-asf-text"
            : "bg-white text-asf-text";

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-wrap items-center gap-3 text-start"
      >
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[3rem] h-7 px-2 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase",
            tone,
          )}
        >
          {report.hit_count}
        </span>
        <span className="font-medium text-asf-text">
          {report.target_label} — {report.category_label}
        </span>
        <code className="text-[0.7rem] text-asf-muted truncate max-w-[16rem]">
          {report.target_id}
        </code>
        <span className="ms-auto text-xs text-asf-muted">
          last {new Date(report.last_reported_at).toLocaleDateString("en-US")}
        </span>
        <span className="text-xs text-asf-muted capitalize">{report.status}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-asf-muted" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-asf-muted" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="mt-3 ps-4 space-y-3 border-s-2 border-asf-border">
          {previews.length > 0 ? (
            <ul className="space-y-2">
              {previews.map((p, i) => (
                <li key={i} className="text-xs text-asf-text">
                  <span className="text-asf-muted">
                    {new Date(p.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    :{" "}
                  </span>
                  {p.reason_text ? (
                    <span>{p.reason_text}</span>
                  ) : (
                    <span className="italic text-asf-muted">(no extra detail)</span>
                  )}
                </li>
              ))}
              {report.hit_count > previews.length ? (
                <li className="text-[0.7rem] text-asf-muted italic">
                  +{report.hit_count - previews.length} more reporter{report.hit_count - previews.length === 1 ? "" : "s"}
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs text-asf-muted">Resolution note (optional)</label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Why this decision? Visible to other admins only."
            />
          </div>

          {err ? (
            <p className="text-xs text-asf-red">{err}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => resolve("actioned")}
              disabled={pending || report.status === "actioned"}
              className="h-9 bg-asf-green text-white hover:bg-asf-green/90"
            >
              Action taken
            </Button>
            <Button
              type="button"
              onClick={() => resolve("dismissed")}
              disabled={pending}
              className="h-9 bg-asf-off-2 text-asf-text hover:bg-asf-navy hover:text-white"
            >
              Dismiss (not a violation)
            </Button>
            <Button
              type="button"
              onClick={() => resolve("false")}
              disabled={pending}
              className="h-9 bg-asf-red-light text-asf-red border border-asf-red/30 hover:bg-asf-red hover:text-white"
            >
              Dismiss as false
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
