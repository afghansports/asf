import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/data/countries";
import { AdminToggle } from "../_toggle";
import { toggleUserActive, toggleUserAdmin } from "../_actions";

export const metadata = { title: "Admin users" };

type SearchParams = { q?: string };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const q = (sp.q ?? "").trim();

  const supabase = await createClient();
  const query = supabase
    .from("profiles")
    .select("id, username, full_name, country_code, is_admin, is_active, created_at")
    .order("created_at", { ascending: false });
  const { data: users } = await query.limit(200);
  const service = createServiceClient();
  const { data: authUsers } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""] as const));
  const filteredUsers = q
    ? (users ?? []).filter((u) => {
        const email = emailById.get(u.id) ?? "";
        const needle = q.toLowerCase();
        return (
          email.toLowerCase().includes(needle) ||
          (u.username ?? "").toLowerCase().includes(needle) ||
          (u.full_name ?? "").toLowerCase().includes(needle)
        );
      })
    : users ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Users</h1>
        <form className="inline-flex items-stretch gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or username"
            className="h-9 px-3 rounded-md border border-asf-border bg-white text-sm w-72"
          />
          <button type="submit" className="h-9 px-3 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <Th>User</Th>
              <Th>Country</Th>
              <Th>Joined</Th>
              <Th>Admin</Th>
              <Th>Active</Th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const country = COUNTRIES.find((c) => c.code === u.country_code);
              return (
                <tr key={u.id} className="border-t border-asf-border">
                  <td className="px-4 py-3">
                    <Link href={`/profile/${u.username}`} className="hover:text-asf-red">
                      <span className="block text-asf-text font-medium">{u.full_name ?? u.username}</span>
                      <span className="block text-xs text-asf-muted">@{u.username}</span>
                      <span className="block text-xs text-asf-muted">{emailById.get(u.id) || "No email"}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-asf-muted">
                    {country ? `${country.flag} ${country.name}` : u.country_code ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-asf-muted">
                    {new Date(u.created_at).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <AdminToggle
                      initial={!!u.is_admin}
                      action={(next) => toggleUserAdmin(u.id, next)}
                      ariaLabel={`Toggle admin for ${u.username}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminToggle
                      initial={u.is_active ?? true}
                      action={(next) => toggleUserActive(u.id, next)}
                      ariaLabel={`Toggle active for ${u.username}`}
                    />
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-asf-muted text-sm">No users.</td>
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
