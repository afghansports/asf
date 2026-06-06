import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Users, Heart, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { getSport } from "@/lib/data/sports";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { FillImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Top teams, players, and rising stars across ASF.",
};

export default async function LeaderboardsPage() {
  if (!(await isFeatureEnabled("module.leaderboards"))) return <ModuleDisabled name="Leaderboards" />;
  const supabase = await createClient();

  const [
    topTeamsByMembers,
    topAffiliateTeams,
    mostFollowedPlayers,
    mostActivePlayers,
    risingReels,
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id, slug, name, sport, member_count, is_asf_affiliate, logo_url")
      .eq("is_active", true)
      .order("member_count", { ascending: false })
      .limit(10),
    supabase
      .from("teams")
      .select("id, slug, name, sport, member_count, logo_url")
      .eq("is_active", true)
      .eq("is_asf_affiliate", true)
      .order("member_count", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, follower_count, verification_status")
      .eq("is_active", true)
      .order("follower_count", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, total_games, sport, verification_status")
      .eq("is_player", true)
      .eq("is_active", true)
      .order("total_games", { ascending: false })
      .limit(10),
    supabase
      .from("reels")
      .select("id, video_url, thumbnail_url, caption, like_count, view_count, author_id")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("like_count", { ascending: false })
      .limit(8),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Leaderboards"
        title="Who is on top."
        subtitle="Top teams, most-followed players, most active players, and the reels lighting up the feed."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          <Card icon={<Users className="w-4 h-4" aria-hidden />} title="Top teams by roster size">
            <List>
              {(topTeamsByMembers.data ?? []).map((t, i) => {
                const sport = getSport(t.sport);
                return (
                  <li key={t.id} className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border">
                    <Rank n={i + 1} />
                    <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                      {t.logo_url ? (
                        <FillImage src={t.logo_url} alt="" className="object-cover" sizes="36px" />
                      ) : (
                        <span aria-hidden>{t.name.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <Link href={`/teams/${t.slug}`} className="text-sm text-asf-text hover:text-asf-red flex-1 truncate">
                      {t.name}
                    </Link>
                    <span className="text-xs text-asf-muted">{sport?.name ?? t.sport}</span>
                    <span className="text-sm font-display font-bold text-asf-text">{t.member_count}</span>
                  </li>
                );
              })}
            </List>
          </Card>

          <Card icon={<Trophy className="w-4 h-4" aria-hidden />} title="ASF Affiliate teams">
            <List>
              {(topAffiliateTeams.data ?? []).map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border">
                  <Rank n={i + 1} />
                  <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                    {t.logo_url ? (
                      <FillImage src={t.logo_url} alt="" className="object-cover" sizes="36px" />
                    ) : (
                      <span aria-hidden>{t.name.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <Link href={`/teams/${t.slug}`} className="text-sm text-asf-text hover:text-asf-red flex-1 truncate">
                    {t.name}
                  </Link>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-gold-light text-asf-text text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase">
                    Affiliate
                  </span>
                </li>
              ))}
            </List>
          </Card>

          <Card icon={<Users className="w-4 h-4" aria-hidden />} title="Most followed players">
            <List>
              {(mostFollowedPlayers.data ?? []).map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border">
                  <Rank n={i + 1} />
                  <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                    {p.avatar_url ? (
                      <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="36px" />
                    ) : (
                      <span aria-hidden>{(p.full_name ?? p.username ?? "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <Link href={`/profile/${p.username}`} className="text-sm text-asf-text hover:text-asf-red flex-1 truncate inline-flex items-center gap-1">
                    {p.full_name ?? p.username}
                    <VerifiedBadge status={p.verification_status} />
                  </Link>
                  <span className="text-sm font-display font-bold text-asf-text">
                    {(p.follower_count ?? 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </List>
          </Card>

          <Card icon={<Award className="w-4 h-4" aria-hidden />} title="Most active players">
            <List>
              {(mostActivePlayers.data ?? []).map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border">
                  <Rank n={i + 1} />
                  <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                    {p.avatar_url ? (
                      <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="36px" />
                    ) : (
                      <span aria-hidden>{(p.full_name ?? p.username ?? "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <Link href={`/profile/${p.username}`} className="text-sm text-asf-text hover:text-asf-red flex-1 truncate inline-flex items-center gap-1">
                    {p.full_name ?? p.username}
                    <VerifiedBadge status={p.verification_status} />
                  </Link>
                  <span className="text-xs text-asf-muted capitalize">{p.sport}</span>
                  <span className="text-sm font-display font-bold text-asf-text">{p.total_games ?? 0}</span>
                </li>
              ))}
            </List>
          </Card>

          <Card icon={<Heart className="w-4 h-4" aria-hidden />} title="Most-liked reels">
            <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {(risingReels.data ?? []).map((r) => (
                <li key={r.id}>
                  <Link href={`/reels/${r.id}`} className="block aspect-[9/16] rounded-md overflow-hidden bg-black relative">
                    {r.thumbnail_url ? (
                      <FillImage src={r.thumbnail_url} alt="" className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={r.video_url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <p className="absolute bottom-1 left-1 right-1 text-white text-[0.65rem] inline-flex items-center gap-1 drop-shadow">
                      <Heart className="w-3 h-3 fill-current" aria-hidden />
                      {r.like_count.toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <article>
      <SectionLabel className="inline-flex items-center gap-1.5">
        {icon} {title}
      </SectionLabel>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2">{children}</ul>;
}

function Rank({ n }: { n: number }) {
  return (
    <span className="inline-flex w-7 h-7 rounded-full bg-asf-navy text-white items-center justify-center font-display font-bold text-xs">
      {n}
    </span>
  );
}
