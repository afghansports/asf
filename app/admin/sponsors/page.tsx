import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { deleteSponsor } from "../_actions";
import { SponsorForm } from "./form";
import { ModuleToggle } from "../modules/module-toggle";
import { isFeatureEnabled } from "@/lib/features/flags";

export const metadata = { title: "Admin sponsors" };

type SearchParams = { id?: string; new?: string };

export default async function AdminSponsorsPage({
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
    const { data: row } = await supabase.from("sponsors").select("*").eq("id", sp.id).maybeSingle();
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">Edit sponsor</h1>
          <Link href="/admin/sponsors" className="text-sm text-asf-muted hover:text-asf-text">Back to list</Link>
        </div>
        <SponsorForm userId={user.id} initial={(row as Record<string, unknown>) ?? {}} />
      </div>
    );
  }

  if (sp.new) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">New sponsor</h1>
          <Link href="/admin/sponsors" className="text-sm text-asf-muted hover:text-asf-text">Back to list</Link>
        </div>
        <SponsorForm userId={user.id} initial={{}} />
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("sponsors")
    .select("id, name, logo_url, website_url, tier, sort_order, is_active")
    .order("sort_order", { ascending: true });

  const moduleEnabled = await isFeatureEnabled("module.sponsors");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Sponsors</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
              Show on site
            </span>
            <ModuleToggle flagKey="module.sponsors" initialEnabled={moduleEnabled} />
          </div>
          <Link
            href="/admin/sponsors?new=1"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden />
            New sponsor
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-start">
              <Th>Logo</Th>
              <Th>Name</Th>
              <Th>Tier</Th>
              <Th>Website</Th>
              <Th>Sort</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <span className="relative inline-flex w-12 h-9 bg-asf-off-2 rounded items-center justify-center overflow-hidden">
                    {r.logo_url ? (
                      <Image src={r.logo_url} alt="" fill className="object-contain p-1" sizes="48px" unoptimized />
                    ) : (
                      <span className="text-[0.65rem] text-asf-muted">no logo</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-asf-text font-medium">{r.name}</td>
                <td className="px-4 py-3 capitalize text-asf-muted">{r.tier}</td>
                <td className="px-4 py-3 text-asf-muted">{r.website_url ? (
                  <a href={r.website_url} target="_blank" rel="noreferrer noopener" className="hover:text-asf-red truncate max-w-[18rem] inline-block">{r.website_url}</a>
                ) : "-"}</td>
                <td className="px-4 py-3 text-asf-muted">{r.sort_order ?? 0}</td>
                <td className="px-4 py-3">{r.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="off">Hidden</Badge>}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/admin/sponsors?id=${r.id}`} className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-asf-off-2 text-asf-text text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy hover:text-white">
                      <Edit3 className="w-3 h-3" aria-hidden />
                      Edit
                    </Link>
                    <ActionButton action={deleteSponsor.bind(null, r.id)} label="Delete" variant="danger" confirm={`Delete sponsor "${r.name}"?`} />
                  </div>
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-asf-muted text-sm">No sponsors yet.</td></tr>
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
function Badge({ children, tone }: { children: React.ReactNode; tone: "ok" | "off" }) {
  const cls = tone === "ok" ? "bg-asf-green-light text-asf-green" : "bg-asf-off-2 text-asf-muted";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded ${cls} text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase`}>{children}</span>;
}
