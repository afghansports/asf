import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { deleteHistoryEntry } from "../_actions";
import { HistoryForm } from "./form";

export const metadata = { title: "Admin history" };

type SearchParams = { id?: string; new?: string };

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (sp.id) {
    const { data: row } = await supabase.from("history_timeline").select("*").eq("id", sp.id).maybeSingle();
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">Edit history entry</h1>
          <Link href="/admin/history" className="text-sm text-asf-muted hover:text-asf-text">Back to list</Link>
        </div>
        <HistoryForm initial={(row as Record<string, unknown>) ?? {}} />
      </div>
    );
  }

  if (sp.new) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">New history entry</h1>
          <Link href="/admin/history" className="text-sm text-asf-muted hover:text-asf-text">Back to list</Link>
        </div>
        <HistoryForm initial={{}} />
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("history_timeline")
    .select("id, year, title, description, sort_order, is_active")
    .order("year", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">History timeline</h1>
        <Link href="/admin/history?new=1" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark">
          <PlusCircle className="w-3.5 h-3.5" aria-hidden />
          Add entry
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-start">
              <Th>Year</Th>
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>Sort</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-asf-border">
                <td className="px-4 py-3 text-asf-text font-medium">{r.year}</td>
                <td className="px-4 py-3 text-asf-text">{r.title}</td>
                <td className="px-4 py-3 text-asf-muted max-w-[28rem] truncate">{r.description ?? "-"}</td>
                <td className="px-4 py-3 text-asf-muted">{r.sort_order ?? 0}</td>
                <td className="px-4 py-3">{r.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">Active</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-off-2 text-asf-muted text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">Hidden</span>
                )}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/admin/history?id=${r.id}`} className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-asf-off-2 text-asf-text text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy hover:text-white">
                      <Edit3 className="w-3 h-3" aria-hidden />
                      Edit
                    </Link>
                    <ActionButton action={deleteHistoryEntry.bind(null, r.id)} label="Delete" variant="danger" confirm={`Delete ${r.year} ${r.title}?`} />
                  </div>
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-asf-muted text-sm">No history entries yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">{children}</th>;
}
