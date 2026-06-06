import type { Metadata } from "next";
import Link from "next/link";
import { Network, Building, Globe, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Hierarchy" };

/**
 * /admin/hierarchy — read-only tree view of the federation > chapter > club > team
 * structure. Click into each tier to edit on its detail page.
 */
export default async function AdminHierarchyPage() {
  const supabase = await createClient();
  const [{ data: feds }, { data: chapters }, { data: clubs }, { data: teams }] = await Promise.all([
    supabase.from("federations").select("id, slug, name, scope, country_code").order("scope"),
    supabase.from("chapters").select("id, slug, name, federation_id, parent_chapter_id, tier, country_code").order("tier"),
    supabase.from("clubs").select("id, slug, name, chapter_id, federation_id, country_code").order("name"),
    supabase.from("teams").select("id, slug, name, club_id, chapter_id, federation_id, sport").order("name"),
  ]);

  type Ch = { id: string; slug: string; name: string; federation_id: string | null; parent_chapter_id: string | null; tier: string; country_code: string | null };
  type Cl = { id: string; slug: string; name: string; chapter_id: string | null; federation_id: string | null; country_code: string | null };
  type Te = { id: string; slug: string; name: string; club_id: string | null; chapter_id: string | null; federation_id: string | null; sport: string };

  const chsByFed = new Map<string, Ch[]>();
  for (const c of (chapters ?? []) as Ch[]) {
    if (!c.federation_id) continue;
    const arr = chsByFed.get(c.federation_id) ?? [];
    arr.push(c);
    chsByFed.set(c.federation_id, arr);
  }
  const clubsByCh = new Map<string, Cl[]>();
  for (const c of (clubs ?? []) as Cl[]) {
    if (!c.chapter_id) continue;
    const arr = clubsByCh.get(c.chapter_id) ?? [];
    arr.push(c);
    clubsByCh.set(c.chapter_id, arr);
  }
  const teamsByClub = new Map<string, Te[]>();
  const teamsByCh = new Map<string, Te[]>();
  for (const t of (teams ?? []) as Te[]) {
    if (t.club_id) {
      const arr = teamsByClub.get(t.club_id) ?? [];
      arr.push(t);
      teamsByClub.set(t.club_id, arr);
    } else if (t.chapter_id) {
      const arr = teamsByCh.get(t.chapter_id) ?? [];
      arr.push(t);
      teamsByCh.set(t.chapter_id, arr);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="inline-flex w-10 h-10 rounded bg-asf-navy text-white items-center justify-center">
          <Network className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text leading-none">Hierarchy</h1>
          <p className="mt-1 text-sm text-asf-muted">
            Federation → Chapter → Club → Team. Click a node to view its public page.
          </p>
        </div>
      </header>

      <ul className="space-y-4">
        {(feds ?? []).map((fed) => (
          <li key={fed.id} className="rounded-lg border border-asf-border bg-white">
            <Link href={`/federations/${fed.slug}`} className="block px-5 py-3 border-b border-asf-border hover:bg-asf-off">
              <p className="font-display font-bold text-base text-asf-text inline-flex items-center gap-2">
                <Globe className="w-4 h-4 text-asf-navy" />
                {fed.name}
                <span className="text-xs text-asf-muted capitalize font-normal">({fed.scope})</span>
              </p>
            </Link>
            <ul className="px-5 py-3 space-y-3">
              {(chsByFed.get(fed.id) ?? []).map((ch) => (
                <li key={ch.id} className="border-s-2 border-asf-border ps-4">
                  <Link href={`/chapters/${ch.slug}`} className="font-display font-bold text-sm text-asf-text inline-flex items-center gap-2 hover:text-asf-red">
                    <Building className="w-3.5 h-3.5" />
                    {ch.name}
                    <span className="text-xs text-asf-muted capitalize font-normal">({ch.tier})</span>
                  </Link>
                  <ul className="mt-1.5 space-y-1.5 ms-4">
                    {(clubsByCh.get(ch.id) ?? []).map((cl) => (
                      <li key={cl.id}>
                        <Link href={`/clubs/${cl.slug}`} className="text-sm text-asf-text inline-flex items-center gap-2 hover:text-asf-red">
                          <Shield className="w-3.5 h-3.5 text-asf-red" />
                          {cl.name}
                        </Link>
                        <ul className="ms-5 mt-1 space-y-0.5">
                          {(teamsByClub.get(cl.id) ?? []).map((t) => (
                            <li key={t.id}>
                              <Link href={`/teams/${t.slug}`} className="text-xs text-asf-muted hover:text-asf-red">
                                — {t.name} <span className="text-asf-muted/70">({t.sport})</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                    {(teamsByCh.get(ch.id) ?? []).map((t) => (
                      <li key={t.id}>
                        <Link href={`/teams/${t.slug}`} className="text-xs text-asf-muted hover:text-asf-red ms-1">
                          ◦ {t.name} <span className="text-asf-muted/70">({t.sport}, no club)</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {(chsByFed.get(fed.id) ?? []).length === 0 ? (
                <li className="text-xs text-asf-muted italic">No chapters under this federation yet.</li>
              ) : null}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
