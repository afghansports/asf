import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppealRow } from "./appeal-row";

export const metadata = { title: "Admin appeals" };

type SearchParams = { filter?: string };

export default async function AdminAppealsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const filter = sp.filter ?? "pending";
  const supabase = await createClient();

  let q = supabase
    .from("ban_appeals")
    .select("id, user_id, suspension_id, status, reason_text, decision_note, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter !== "all") q = q.eq("status", filter);

  const { data: appeals } = await q;
  const list = appeals ?? [];

  const userIds = Array.from(new Set(list.map((a) => a.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Appeals</h1>
        <div className="inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {[
            { code: "pending", label: "Pending" },
            { code: "approved", label: "Approved" },
            { code: "denied", label: "Denied" },
            { code: "all", label: "All" },
          ].map((o) => {
            const active = filter === o.code;
            return (
              <Link
                key={o.code}
                href={`/admin/appeals?filter=${o.code}`}
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

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="rounded-lg p-10 border border-dashed border-asf-border bg-white text-center text-asf-muted text-sm">
            No appeals in this queue.
          </li>
        ) : null}
        {list.map((a) => {
          const p = profMap.get(a.user_id);
          return (
            <AppealRow
              key={a.id}
              appeal={{
                id: a.id,
                status: a.status,
                reason_text: a.reason_text,
                decision_note: a.decision_note,
                created_at: a.created_at,
                reviewed_at: a.reviewed_at,
                user: p
                  ? { username: p.username, full_name: p.full_name, avatar_url: p.avatar_url }
                  : null,
              }}
            />
          );
        })}
      </ul>
    </div>
  );
}
