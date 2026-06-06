"use client";

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
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { FillImage, FixedImage } from "@/components/shared/optimized-image";

/**
 * One activity-wall post. Client component so it can be rendered both by the
 * server (initial page) and by the infinite-scroll loader (load-more.tsx).
 * Title/body arrive already translated for the active locale (see the feed
 * page + loadMoreFeed server action).
 */

export type FeedPost = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link: string | null;
  created_at: string;
  actor: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

const KIND_META: Record<string, { icon: typeof Video; label: string; tone: string }> = {
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

function SmartLink({ href, className, children }: { href: string | null; className?: string; children: React.ReactNode }) {
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

export function FeedItem({ post: p }: { post: FeedPost }) {
  const meta = KIND_META[p.kind] ?? KIND_META.discussion;
  const Icon = meta.icon;
  const actor = p.actor;
  const initial = (actor?.full_name ?? actor?.username ?? "?").charAt(0).toUpperCase();

  return (
    <li className="rounded-lg bg-white border border-asf-border overflow-hidden">
      <div className="p-4 flex items-start gap-3">
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
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-condensed font-bold tracking-[0.16em] uppercase text-[0.6rem] ${meta.tone}`}>
              <Icon className="w-3 h-3" aria-hidden />
              {meta.label}
            </span>
            {actor?.username ? (
              <Link href={`/profile/${actor.username}`} className="text-asf-text hover:text-asf-red font-medium">
                {actor.full_name ?? actor.username}
              </Link>
            ) : null}
            <span className="text-asf-muted">· {formatRelative(p.created_at)}</span>
          </div>

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

      <SmartLink
        href={p.link}
        className="flex items-center justify-between gap-2 px-4 py-2 border-t border-asf-border bg-asf-off-2/40 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-red hover:bg-asf-off-2"
      >
        <span>
          {p.kind === "external_news" || p.kind === "external_fixture" ? "Read more" : `View ${meta.label.toLowerCase()}`}
        </span>
        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden />
      </SmartLink>
    </li>
  );
}
