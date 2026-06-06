import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminToggle } from "../_toggle";
import { toggleTeamActive, toggleTeamAffiliate } from "../_actions";
import { ModuleToggle } from "../modules/module-toggle";
import { isFeatureEnabled } from "@/lib/features/flags";
import { TeamForm } from "./team-form";

export const metadata = { title: "Admin teams" };

type SearchParams = { new?: string };

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const creating = !!sp.new;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, slug, sport, city, state_province, member_count, is_asf_affiliate, is_active, logo_url")
    .order("created_at", { ascending: false })
    .limit(200);

  const moduleEnabled = await isFeatureEnabled("module.teams");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Teams</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/teams?new=1"
            className="inline-flex items-center h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark"
          >
            + New team
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
              Show on site
            </span>
            <ModuleToggle flagKey="module.teams" initialEnabled={moduleEnabled} />
          </div>
        </div>
      </div>

      {creating ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xl text-asf-text">New team</h2>
            <Link href="/admin/teams" className="text-sm text-asf-muted hover:text-asf-red">
              Cancel
            </Link>
          </div>
          <TeamForm userId={user.id} />
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-start">
              <Th>Team</Th>
              <Th>Sport</Th>
              <Th>Location</Th>
              <Th>Members</Th>
              <Th>ASF Affiliate</Th>
              <Th>Active</Th>
            </tr>
          </thead>
          <tbody>
            {(teams ?? []).map((t) => (
              <tr key={t.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <Link href={`/teams/${t.slug}`} className="inline-flex items-center gap-2.5 hover:text-asf-red">
                    <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                      {t.logo_url ? (
                        <Image src={t.logo_url} alt="" fill className="object-cover" sizes="32px" unoptimized />
                      ) : (
                        <span aria-hidden>{t.name.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span>
                      <span className="block text-asf-text">{t.name}</span>
                      <span className="block text-xs text-asf-muted">/{t.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-asf-muted">{t.sport}</td>
                <td className="px-4 py-3 text-asf-muted">
                  {[t.city, t.state_province].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3 text-asf-muted">{t.member_count ?? 0}</td>
                <td className="px-4 py-3">
                  <AdminToggle
                    initial={!!t.is_asf_affiliate}
                    action={toggleTeamAffiliate.bind(null, t.id)}
                    ariaLabel={`Toggle ASF affiliate for ${t.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <AdminToggle
                    initial={t.is_active ?? true}
                    action={toggleTeamActive.bind(null, t.id)}
                    ariaLabel={`Toggle active for ${t.name}`}
                  />
                </td>
              </tr>
            ))}
            {(teams ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-asf-muted text-sm">No teams yet.</td>
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
