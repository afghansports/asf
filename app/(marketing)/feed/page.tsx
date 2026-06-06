import type { Metadata } from "next";
import Link from "next/link";
import {
  Video,
  Calendar,
  Newspaper,
  BarChart3,
  Trophy,
  Medal,
  MessageSquare,
  Shield,
  Sparkles,
  UserPlus,
  ArrowRight,
  Globe,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { FillImage, FixedImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Activity wall",
  description: "Everything happening across ASF right now.",
};

const KIND_META: Record<
  string,
  { icon: typeof Video; label: string; tone: string }
> = {
  reel:             { icon: Video,         label: "Reel",         tone: "bg-asf-red text-white" },
  event:            { icon: Calendar,      label: "Event",        tone: "bg-asf-navy text-white" },
  news:             { icon: Newspaper,     label: "News",         tone: "bg-asf-gold text-asf-text" },
  poll:             { icon: BarChart3,     label: "Poll",         tone: "bg-asf-green text-white" },
  tournament:       { icon: Trophy,        label: "Tournament",   tone: "bg-asf-red text-white" },
  match:            { icon: Medal,         label: "Match",        tone: "bg-asf-navy text-white" },
  match_result:     { icon: Medal,         label: "Result",       tone: "bg-asf-green text-white" },
  discussion:       { icon: MessageSquare, label: "Discussion",   tone: "bg-asf-off-2 text-asf-text" },
  discussion_reply: { icon: MessageSquare, label: "Reply",        tone: "bg-asf-off-2 text-asf-text" },
  team_created:     { icon: Shield,        label: "New team",     tone: "bg-asf-gold text-asf-text" },
  club_created:     { icon: Shield,        label: "New club",     tone: "bg-asf-gold text-asf-text" },
  achievement:      { icon: Sparkles,      label: "Achievement",  tone: "bg-asf-green text-white" },
  user_joined:      { icon: UserPlus,      label: "Joined",       tone: "bg-white text-asf-text border border-asf-border" },
  external_fixture: { icon: Globe,         label: "Pro fixture",  tone: "bg-asf-navy text-white" },
  external_news:    { icon: Newspaper,     label: "Sports news",  tone: "bg-asf-gold text-asf-text" },
  announcement:     { icon: Megaphone,     label: "Announcement", tone: "bg-asf-red text-white" },
};

const FILTERS: { kind: string | null; label: string }[] = [
  { kind: null,               label: "Everything" },
  { kind: "reel",             label: "Reels" },
  { kind: "event",            label: "Events" },
  { kind: "news",             label: "News" },
  { kind: "discussion",       label: "Discussions" },
  { kind: "match_result",     label: "Results" },
  { kind: "tournament",       label: "Tournaments" },
  { kind: "team_created",     label: "Teams" },
  { kind: "external_fixture", label: "Scores" },
  { kind: "external_news",    label: "Sports news" },
];

type Search = { kind?: string };

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<Search> | Search;
}) {
  if (!(await isFeatureEnabled("module.wall"))) return <ModuleDisabled name="Activity wall" />;

  const sp = (searchParams ? await searchParams : {}) as Search;
  const activeKind = sp.kind ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("wall_posts")
    .select("id, actor_id, kind, target_type, target_id, title, body, image_url, link, is_hidden, is_pinned, created_at")
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);
  if (activeKind) query = query.eq("kind", activeKind);
  const { data: posts } = await query;

  // Hydrate actor profiles in one round trip
  const actorIds = Array.from(
    new Set((posts ?? []).map((p) => p.actor_id).filter((id): id is string => !!id)),
  );
  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", actorIds)
    : { data: [] };
  const actorMap = new Map(
    (actors ?? []).map((a) => [a.id, a]),
  );

  return (
    <>
      <PageHero
        eyebrow="Wall"
        title="Activity"
        subtitle="Every reel, event, news post, match result, and discussion in one place. Newest first."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
          {/* Filter chips */}
          <nav className="flex flex-wrap gap-2 mb-6" aria-label="Filter by activity type">
            {FILTERS.map((f) => (
              <Link
                key={f.kind ?? "all"}
                href={f.kind ? `/feed?kind=${f.kind}` : `/feed`}
                className={
                  activeKind === (f.kind ?? "")
                    ? "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-asf-navy text-white"
                    : "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
                }
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {!posts || posts.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-5 h-5" />}
              title="Wall is quiet."
              description="As members post reels, create events, write articles, or join discussions, they will appear here."
            />
          ) : (
            <ol className="space-y-4">
              {posts.map((p) => {
                const meta = KIND_META[p.kind] ?? KIND_META.discussion;
                const Icon = meta.icon;
                const actor = p.actor_id ? actorMap.get(p.actor_id) : null;
                const initial = (actor?.full_name ?? actor?.username ?? "?").charAt(0).toUpperCase();
                return (
                  <li key={p.id} className="rounded-lg bg-white border border-asf-border overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      {/* Actor avatar */}
                      <Link
                        href={actor?.username ? `/profile/${actor.username}` : "#"}
                        className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden shrink-0"
                      >
                        {actor?.avatar_url ? (
                          <FillImage src={cdnUrl(actor.avatar_url)} alt="" className="object-cover" sizes="40px" />
                        ) : (
                          <span aria-hidden>{initial}</span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        {/* Kind tag + actor + time */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-condensed font-bold tracking-[0.16em] uppercase text-[0.6rem] ${meta.tone}`}>
                            <Icon className="w-3 h-3" aria-hidden />
                            {meta.label}
                          </span>
                          {actor?.username ? (
                            <Link
                              href={`/profile/${actor.username}`}
                              className="text-asf-text hover:text-asf-red font-medium"
                            >
                              {actor.full_name ?? actor.username}
                            </Link>
                          ) : null}
                          <span className="text-asf-muted">
                            · {formatRelative(p.created_at)}
                          </span>
                        </div>

                        {/* Title + body */}
                        <SmartLink href={p.link} className="block mt-2 group">
                          <p dir="auto" className="font-display font-bold text-base text-asf-text group-hover:text-asf-red leading-snug">
                            {p.title}
                          </p>
                          {p.body ? (
                            <p dir="auto" className="mt-1 text-sm text-asf-text/80 line-clamp-3 leading-relaxed">
                              {p.body}
                            </p>
                          ) : null}
                        </SmartLink>
                      </div>
                    </div>

                    {/* Optional image */}
                    {p.image_url ? (
                      <SmartLink href={p.link} className="block">
                        <FixedImage
                          src={cdnUrl(p.image_url)}
                          alt=""
                          width={1200}
                          height={675}
                          className="w-full max-h-96 object-cover border-t border-asf-border"
                        />
                      </SmartLink>
                    ) : null}

                    {/* Footer: link to content */}
                    <SmartLink
                      href={p.link}
                      className="flex items-center justify-between gap-2 px-4 py-2 border-t border-asf-border bg-asf-off-2/40 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-red hover:bg-asf-off-2"
                    >
                      <span>
                        {p.kind === "external_news" || p.kind === "external_fixture"
                          ? "Read more"
                          : `View ${meta.label.toLowerCase()}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                    </SmartLink>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

/** Renders an anchor tag for absolute URLs (opens new tab) and Next Link for internal paths. */
function SmartLink({
  href,
  className,
  children,
}: {
  href: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  const dest = href || "#";
  if (dest.startsWith("http")) {
    return (
      <a href={dest} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={dest} className={className}>
      {children}
    </Link>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
