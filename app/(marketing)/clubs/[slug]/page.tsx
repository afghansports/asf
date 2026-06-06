import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, Calendar, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { EntityFollowButton } from "@/components/shared/entity-follow-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.slug };
}

export default async function ClubDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, slug, name, short_name, description, country_code, state_province, city, founded_year, member_count, follower_count, team_count, website_url, contact_email, chapter_id, federation_id")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!club) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialFollowing = false;
  if (user) {
    const { data: f } = await supabase
      .from("club_followers")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("club_id", club.id)
      .maybeSingle();
    initialFollowing = !!f;
  }

  // Teams under this club
  const { data: teams } = await supabase
    .from("teams")
    .select("id, slug, name, sport, age_group, gender_division, member_count, follower_count, logo_url")
    .eq("club_id", club.id)
    .order("name");

  // Chapter / federation breadcrumb
  const [chapterRes, fedRes] = await Promise.all([
    club.chapter_id
      ? supabase.from("chapters").select("slug, name").eq("id", club.chapter_id).maybeSingle()
      : Promise.resolve({ data: null }),
    club.federation_id
      ? supabase.from("federations").select("slug, name").eq("id", club.federation_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Club"
        title={club.name}
        subtitle={club.description ?? undefined}
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-asf-muted flex flex-wrap items-center gap-1.5">
            {fedRes.data ? (
              <>
                <Link href={`/federations/${fedRes.data.slug}`} className="hover:text-asf-red">{fedRes.data.name}</Link>
                <span>/</span>
              </>
            ) : null}
            {chapterRes.data ? (
              <>
                <Link href={`/chapters/${chapterRes.data.slug}`} className="hover:text-asf-red">{chapterRes.data.name}</Link>
                <span>/</span>
              </>
            ) : null}
            <span className="text-asf-text">{club.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <EntityFollowButton
              entityType="club"
              entityId={club.id}
              initialFollowing={initialFollowing}
              signedIn={!!user}
            />
            {club.website_url ? (
              <a
                href={club.website_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
              >
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-xs text-asf-muted">
              <MapPin className="w-3.5 h-3.5" />
              {[club.city, club.state_province].filter(Boolean).join(", ") || club.country_code}
            </span>
            {club.founded_year ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-asf-muted">
                <Calendar className="w-3.5 h-3.5" />
                Since {club.founded_year}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-xs text-asf-muted">
              <Users className="w-3.5 h-3.5" />
              {club.follower_count ?? 0} followers
            </span>
          </div>

          {/* Teams */}
          <div>
            <SectionLabel>Teams</SectionLabel>
            {!teams || teams.length === 0 ? (
              <p className="mt-4 text-sm text-asf-muted">No teams in this club yet.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/teams/${t.slug}`}
                      className="group flex flex-col p-4 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <p className="font-display font-bold text-sm text-asf-text">{t.name}</p>
                      <p className="text-xs text-asf-muted mt-0.5 capitalize">
                        {[t.sport, t.age_group, t.gender_division].filter(Boolean).join(" • ")}
                      </p>
                      <div className="mt-auto pt-3 text-xs text-asf-muted">
                        {t.member_count ?? 0} players · {t.follower_count ?? 0} followers
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {club.contact_email ? (
            <div className="p-4 rounded-lg bg-white border border-asf-border">
              <SectionLabel>Contact</SectionLabel>
              <p className="text-sm text-asf-text mt-2">
                <a href={`mailto:${club.contact_email}`} className="hover:text-asf-red">{club.contact_email}</a>
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
