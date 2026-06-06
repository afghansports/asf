import Link from "next/link";
import { Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReportRow } from "./report-row";

export const metadata = { title: "Admin reports" };

type SearchParams = { filter?: string };

const TARGET_LABELS: Record<string, string> = {
  post: "Post",
  reel: "Reel",
  comment: "Comment",
  reel_comment: "Reel comment",
  profile: "Profile",
  team: "Team",
  dm: "Direct message",
  event: "Event",
  news: "News",
};

const CATEGORY_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate speech",
  threats: "Threats",
  impersonation: "Impersonation",
  inappropriate: "Inappropriate",
  misinformation: "Misinformation",
  underage: "Underage user",
  copyright: "Copyright",
  other: "Other",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const filter = sp.filter ?? "pending";

  const supabase = await createClient();
  let q = supabase
    .from("reports")
    .select("id, target_type, target_id, category, status, hit_count, first_reported_at, last_reported_at, reviewed_at, resolution_note")
    .order("hit_count", { ascending: false })
    .order("last_reported_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data: rows } = await q.limit(200);
  const reports = rows ?? [];

  // Pull recent submission previews for each report (max 3 reasons each).
  const ids = reports.map((r) => r.id);
  const { data: subs } = ids.length
    ? await supabase
        .from("report_submissions")
        .select("report_id, reason_text, created_at, reporter_id")
        .in("report_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };
  const subsByReport = new Map<string, Array<{ reason_text: string | null; created_at: string }>>();
  for (const s of subs ?? []) {
    const list = subsByReport.get(s.report_id) ?? [];
    if (list.length < 3) {
      list.push({ reason_text: s.reason_text, created_at: s.created_at });
      subsByReport.set(s.report_id, list);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text inline-flex items-center gap-2">
            <Flag className="w-6 h-6 text-asf-red" aria-hidden />
            Reports
          </h1>
          <p className="text-sm text-asf-muted mt-1">
            Each row is one (target, category) pair, deduplicated. The hit-count is the number of unique reporters.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {[
            { code: "pending", label: "Pending" },
            { code: "actioned", label: "Actioned" },
            { code: "dismissed", label: "Dismissed" },
            { code: "all", label: "All" },
          ].map((o) => {
            const active = filter === o.code;
            return (
              <Link
                key={o.code}
                href={`/admin/reports?filter=${o.code}`}
                className={
                  active
                    ? "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                    : "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
                }
              >
                {o.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-asf-border bg-white divide-y divide-asf-border">
        {reports.length === 0 ? (
          <p className="p-10 text-center text-asf-muted text-sm">
            No reports in this queue.
          </p>
        ) : (
          reports.map((r) => (
            <ReportRow
              key={r.id}
              report={{
                id: r.id,
                target_type: r.target_type,
                target_label: TARGET_LABELS[r.target_type] ?? r.target_type,
                target_id: r.target_id,
                category: r.category,
                category_label: CATEGORY_LABELS[r.category] ?? r.category,
                status: r.status,
                hit_count: r.hit_count,
                first_reported_at: r.first_reported_at,
                last_reported_at: r.last_reported_at,
                resolution_note: r.resolution_note,
              }}
              previews={subsByReport.get(r.id) ?? []}
            />
          ))
        )}
      </div>
    </div>
  );
}
