import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, Calendar, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { TeamCard, type TeamCardData } from "@/components/shared/team-card";
import { US_STATES } from "@/lib/data/us-states";
import { EmptyState } from "@/components/shared/empty-state";
import { FillImage } from "@/components/shared/optimized-image";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${params.slug} chapter` };
}

export default async function ChapterDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select(
      "id, slug, name, description, logo_url, banner_url, country_code, state_province, city, member_count, team_count, founded_year, manager_id, deputy_id"
    )
    .eq("slug", params.slug)
    .maybeSingle();
  if (!chapter) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, name, slug, sport, city, state_province, member_count, logo_url, is_looking_for_players, is_asf_affiliate"
    )
    .eq("chapter_id", chapter.id)
    .order("created_at", { ascending: false });

  const profileIds = [chapter.manager_id, chapter.deputy_id].filter((x): x is string => !!x);
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", profileIds)
    : { data: [] };
  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const manager = chapter.manager_id ? profMap.get(chapter.manager_id) : null;
  const deputy = chapter.deputy_id ? profMap.get(chapter.deputy_id) : null;

  const stateName = chapter.state_province
    ? US_STATES.find((s) => s.code === chapter.state_province)?.name ?? chapter.state_province
    : null;

  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-56 sm:h-64 w-full bg-asf-navy overflow-hidden" aria-hidden>
          {chapter.banner_url ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${chapter.banner_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-asf-navy/30 via-asf-navy/60 to-asf-navy" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-12 pb-8 flex flex-col sm:flex-row gap-5 sm:items-end relative">
          <span className="relative inline-flex w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-asf-navy ring-4 ring-asf-off text-white items-center justify-center font-condensed font-bold text-3xl overflow-hidden shadow-lg shrink-0">
            {chapter.logo_url ? (
              <FillImage src={chapter.logo_url} alt="" className="object-cover" sizes="112px" />
            ) : (
              <span aria-hidden>{chapter.name.charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-3xl sm:text-4xl leading-none text-white drop-shadow-sm">
              {chapter.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
              {chapter.city || stateName ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" aria-hidden />
                  {[chapter.city, stateName].filter(Boolean).join(", ")}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" aria-hidden />
                {chapter.member_count ?? 0} members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" aria-hidden />
                {chapter.team_count ?? 0} teams
              </span>
              {chapter.founded_year ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden />
                  est. {chapter.founded_year}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {chapter.description ? (
              <article>
                <SectionLabel>About this chapter</SectionLabel>
                <p className="mt-3 text-asf-text/85 leading-relaxed whitespace-pre-line">
                  {chapter.description}
                </p>
              </article>
            ) : null}

            <article>
              <SectionLabel>Teams in this chapter</SectionLabel>
              <div className="mt-5">
                {(teams ?? []).length === 0 ? (
                  <EmptyState title="No teams yet." description="Teams that join this chapter will show up here." />
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {((teams ?? []) as TeamCardData[]).map((t) => (
                      <li key={t.id}>
                        <TeamCard team={t} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-5">
            {manager ? (
              <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
                <SectionLabel>Chapter manager</SectionLabel>
                <Link
                  href={`/profile/${manager.username}`}
                  className="flex items-center gap-3 hover:text-asf-red"
                >
                  <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-sm overflow-hidden">
                    {manager.avatar_url ? (
                      <FillImage src={manager.avatar_url} alt="" className="object-cover" sizes="40px" />
                    ) : (
                      <span aria-hidden>{(manager.full_name ?? manager.username ?? "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span>
                    <span className="block text-sm text-asf-text">{manager.full_name ?? manager.username}</span>
                    <span className="block text-xs text-asf-muted">@{manager.username}</span>
                  </span>
                </Link>
                {deputy ? (
                  <p className="text-xs text-asf-muted">
                    Deputy: <Link href={`/profile/${deputy.username}`} className="hover:text-asf-red">@{deputy.username}</Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            <Link
              href="/contact"
              className="block w-full text-center rounded-lg p-4 bg-asf-navy text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-navy-light"
            >
              <Mail className="inline-block w-4 h-4 me-1.5" aria-hidden />
              Contact ASF about this chapter
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
