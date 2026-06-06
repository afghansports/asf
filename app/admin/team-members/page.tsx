import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTeamCategories, labelForCategory } from "@/lib/team/categories";
import { cn } from "@/lib/utils";
import { ActionButton } from "../_action-button";
import { deleteTeamMember } from "../_actions";
import { TeamMemberForm } from "./form";

export const metadata = { title: "Admin ASF Team" };

type SearchParams = { id?: string; new?: string; category?: string };

export default async function AdminTeamMembersPage({
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

  const categories = await getTeamCategories();

  if (sp.id) {
    const { data: row } = await supabase
      .from("management_team")
      .select("id, name, role, bio, photo_url, category, sort_order, is_active")
      .eq("id", sp.id)
      .maybeSingle();
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">Edit team member</h1>
          <Link href="/admin/team-members" className="text-sm text-asf-muted hover:text-asf-text">
            Back to list
          </Link>
        </div>
        <TeamMemberForm
          userId={user.id}
          initial={(row as Record<string, unknown>) ?? {}}
          categories={categories}
        />
      </div>
    );
  }

  if (sp.new) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">New team member</h1>
          <Link href="/admin/team-members" className="text-sm text-asf-muted hover:text-asf-text">
            Back to list
          </Link>
        </div>
        <TeamMemberForm userId={user.id} initial={{}} categories={categories} />
      </div>
    );
  }

  const activeCategory =
    sp.category && categories.includes(sp.category) ? sp.category : null;

  let listQuery = supabase
    .from("management_team")
    .select("id, name, role, category, photo_url, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (activeCategory) listQuery = listQuery.eq("category", activeCategory);
  const { data: rows } = await listQuery;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">ASF Team</h1>
        <Link
          href="/admin/team-members?new=1"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark"
        >
          <PlusCircle className="w-3.5 h-3.5" aria-hidden />
          Add member
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip href="/admin/team-members" label="All" active={!activeCategory} />
        {categories.map((c) => (
          <FilterChip
            key={c}
            href={`/admin/team-members?category=${encodeURIComponent(c)}`}
            label={labelForCategory(c)}
            active={activeCategory === c}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-start">
              <Th>Photo</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Category</Th>
              <Th>Sort</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-off-2 overflow-hidden">
                    {r.photo_url ? (
                      <Image src={r.photo_url} alt="" fill className="object-cover" sizes="36px" unoptimized />
                    ) : (
                      <span aria-hidden className="w-full h-full inline-flex items-center justify-center text-asf-muted text-xs">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-asf-text font-medium">{r.name}</td>
                <td className="px-4 py-3 text-asf-muted">{r.role}</td>
                <td className="px-4 py-3 capitalize text-asf-muted">{r.category}</td>
                <td className="px-4 py-3 text-asf-muted">{r.sort_order ?? 0}</td>
                <td className="px-4 py-3">
                  {r.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-off-2 text-asf-muted text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link
                      href={`/admin/team-members?id=${r.id}`}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-asf-off-2 text-asf-text text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy hover:text-white"
                    >
                      <Edit3 className="w-3 h-3" aria-hidden />
                      Edit
                    </Link>
                    <ActionButton
                      action={deleteTeamMember.bind(null, r.id)}
                      label="Delete"
                      variant="danger"
                      confirm={`Delete ${r.name}?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-asf-muted text-sm">
                  No team members yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
      {children}
    </th>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-8 px-4 inline-flex items-center rounded-full font-condensed font-bold text-xs tracking-[0.18em] uppercase transition-colors",
        active
          ? "bg-asf-red text-white"
          : "bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
      )}
    >
      {label}
    </Link>
  );
}
