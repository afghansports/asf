import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Building, Users, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { EntityFollowButton } from "@/components/shared/entity-follow-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.slug };
}

export default async function FederationDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: fed } = await supabase
    .from("federations")
    .select("id, slug, name, short_name, description, scope, country_code, founded_year, follower_count, member_count, website_url, logo_url")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!fed) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialFollowing = false;
  if (user) {
    const { data: f } = await supabase
      .from("federation_followers")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("federation_id", fed.id)
      .maybeSingle();
    initialFollowing = !!f;
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, slug, name, country_code, tier, member_count, team_count")
    .eq("federation_id", fed.id)
    .eq("is_active", true)
    .order("tier")
    .order("name");

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, slug, name, city, country_code, team_count, member_count")
    .eq("federation_id", fed.id)
    .eq("is_active", true)
    .order("name")
    .limit(24);

  return (
    <>
      <PageHero
        eyebrow={`${fed.scope} federation`}
        title={fed.name}
        subtitle={fed.description ?? undefined}
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          <div className="flex flex-wrap gap-3 items-center">
            <EntityFollowButton
              entityType="federation"
              entityId={fed.id}
              initialFollowing={initialFollowing}
              signedIn={!!user}
            />
            {fed.website_url ? (
              <a
                href={fed.website_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
              </a>
            ) : null}
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-asf-muted">
              <Users className="w-3.5 h-3.5" />
              {fed.follower_count ?? 0} followers
            </span>
          </div>

          {chapters && chapters.length > 0 ? (
            <div>
              <SectionLabel>Chapters</SectionLabel>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chapters.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/chapters/${c.slug}`}
                      className="group flex flex-col p-4 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <p className="font-display font-bold text-sm text-asf-text">{c.name}</p>
                      <p className="text-xs text-asf-muted mt-0.5 capitalize">{c.tier}</p>
                      <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-asf-muted">
                        <span className="inline-flex items-center gap-1"><Building className="w-3 h-3" /> {c.team_count ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {c.member_count ?? 0}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {clubs && clubs.length > 0 ? (
            <div>
              <SectionLabel>Clubs</SectionLabel>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clubs.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clubs/${c.slug}`}
                      className="group flex flex-col p-4 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <p className="font-display font-bold text-sm text-asf-text">{c.name}</p>
                      <p className="text-xs text-asf-muted mt-0.5">{c.city ?? c.country_code}</p>
                      <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-asf-muted">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.team_count ?? 0} teams</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
