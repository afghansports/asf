import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "Federations",
  description: "Governing federations on the ASF platform.",
};

export default async function FederationsListPage() {
  const enabled = await isFeatureEnabled("module.federations");
  if (!enabled) return <ModuleDisabled name="Federations" />;

  const supabase = await createClient();
  const { data: feds } = await supabase
    .from("federations")
    .select("id, slug, name, short_name, description, logo_url, scope, country_code, founded_year, follower_count")
    .eq("is_active", true)
    .order("scope")
    .order("name");

  if (!feds) notFound();

  return (
    <>
      <PageHero
        eyebrow="Hierarchy"
        title="Federations"
        subtitle="Governing bodies that sanction tournaments, charter clubs, and host the wider community."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
          {feds.length === 0 ? (
            <EmptyState
              icon={<Globe className="w-5 h-5" />}
              title="No federations yet."
              description="An admin can add the first one from the admin console."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feds.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/federations/${f.slug}`}
                    className="group flex flex-col h-full p-5 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex w-10 h-10 rounded bg-asf-navy text-white items-center justify-center font-condensed font-bold text-sm">
                        {f.short_name ?? f.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-base text-asf-text truncate">{f.name}</p>
                        <p className="text-xs text-asf-muted capitalize">{f.scope} federation</p>
                      </div>
                    </div>
                    {f.description ? (
                      <p className="mt-3 text-sm text-asf-muted line-clamp-3">{f.description}</p>
                    ) : null}
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-asf-muted">
                      {f.founded_year ? <span>Since {f.founded_year}</span> : <span />}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {f.follower_count ?? 0}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
