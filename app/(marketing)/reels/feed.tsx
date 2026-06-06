"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Heart,
  MessageCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  MapPin,
} from "lucide-react";
import { FillImage } from "@/components/shared/optimized-image";
import { getSport } from "@/lib/data/sports";
import { COUNTRIES } from "@/lib/data/countries";
import { US_STATES } from "@/lib/data/us-states";
import { AFGHAN_PROVINCE_BY_CODE } from "@/lib/data/afghan-provinces";
import { cn } from "@/lib/utils";
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { toggleReelLike, bumpReelView } from "./actions";

export type ReelItem = {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  video_kind?: "file" | "youtube" | "mux" | null;
  youtube_id?: string | null;
  caption: string | null;
  sport: string | null;
  country_code: string | null;
  state_province: string | null;
  district_code: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  liked: boolean;
};

/**
 * Vertical scrolling reels feed. Each reel is a snap-aligned card; the one
 * currently in the viewport autoplays, others are paused. Mute is global,
 * persisted to localStorage. Like is optimistic.
 */
export function ReelsFeed({ items }: { items: ReelItem[] }) {
  const [muted, setMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const seenViews = useRef(new Set<string>());

  // Persist mute pref
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("asf_reels_muted");
      if (v === "false") setMuted(false);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("asf_reels_muted", String(muted));
    } catch {}
  }, [muted]);

  // IntersectionObserver: pick the most-visible card and autoplay it.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = activeIdx;
        let bestRatio = 0;
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.idx ?? -1);
          if (idx < 0) return;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = idx;
          }
        });
        if (bestRatio > 0.55) setActiveIdx(bestIdx);
      },
      { root: containerRef.current, threshold: [0, 0.25, 0.55, 0.85] }
    );
    const cards = containerRef.current.querySelectorAll("[data-idx]");
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [items.length, activeIdx]);

  // Play/pause + view tracking
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIdx) {
        v.muted = muted;
        v.play().catch(() => {});
        const id = items[i]?.id;
        if (id && !seenViews.current.has(id)) {
          seenViews.current.add(id);
          // Fire-and-forget view bump after a 2s viewing threshold.
          window.setTimeout(() => {
            void bumpReelView(id);
          }, 2000);
        }
      } else {
        v.pause();
      }
    });
  }, [activeIdx, muted, items]);

  function scrollTo(idx: number) {
    const cards = containerRef.current?.querySelectorAll<HTMLElement>("[data-idx]");
    cards?.[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-asf-border bg-white p-12 text-center max-w-xl mx-auto">
        <p className="font-display font-bold text-xl text-asf-text">No reels match these filters.</p>
        <p className="mt-2 text-sm text-asf-muted">
          Try clearing a filter, or be the first to upload a reel.
        </p>
        <Link
          href="/reels/upload"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-asf-red px-5 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-white hover:bg-asf-red-dark"
        >
          Upload reel
        </Link>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto">
      {/* Mute toggle (global, fixed) */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute top-4 right-4 z-20 inline-flex w-10 h-10 rounded-full bg-black/50 text-white items-center justify-center hover:bg-black/70 backdrop-blur-sm"
      >
        {muted ? <VolumeX className="w-4 h-4" aria-hidden /> : <Volume2 className="w-4 h-4" aria-hidden />}
      </button>

      <div
        ref={containerRef}
        className="h-[80vh] min-h-[560px] max-h-[820px] overflow-y-auto rounded-lg bg-black snap-y snap-mandatory"
      >
        {items.map((reel, idx) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            idx={idx}
            isActive={idx === activeIdx}
            muted={muted}
            videoRef={(el) => (videoRefs.current[idx] = el)}
          />
        ))}
      </div>

      {/* Up/down */}
      <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => scrollTo(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          aria-label="Previous reel"
          className="inline-flex w-9 h-9 rounded-full bg-black/50 text-white items-center justify-center hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronUp className="w-4 h-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollTo(Math.min(items.length - 1, activeIdx + 1))}
          disabled={activeIdx === items.length - 1}
          aria-label="Next reel"
          className="inline-flex w-9 h-9 rounded-full bg-black/50 text-white items-center justify-center hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronDown className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function ReelCard({
  reel,
  idx,
  isActive,
  muted,
  videoRef,
}: {
  reel: ReelItem;
  idx: number;
  isActive: boolean;
  muted: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const [liked, setLiked] = useState(reel.liked);
  const [likeCount, setLikeCount] = useState(reel.like_count);
  const [pending, startTransition] = useTransition();

  const sport = reel.sport ? getSport(reel.sport) : undefined;
  const SportIcon = sport?.icon;
  const country = reel.country_code ? COUNTRIES.find((c) => c.code === reel.country_code) : undefined;
  const region = reel.country_code === "US"
    ? US_STATES.find((s) => s.code === reel.state_province)?.name
    : reel.country_code === "AF"
      ? AFGHAN_PROVINCE_BY_CODE[reel.state_province ?? ""]?.name
      : reel.state_province;

  function onLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const r = await toggleReelLike(reel.id);
      if (!r.ok) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <article
      data-idx={idx}
      className="relative h-full w-full snap-start snap-always flex items-stretch"
    >
      {reel.video_kind === "youtube" && reel.youtube_id ? (
        <iframe
          title={reel.caption ?? "YouTube reel"}
          src={
            isActive
              ? `https://www.youtube.com/embed/${reel.youtube_id}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&modestbranding=1&rel=0&loop=1&playlist=${reel.youtube_id}`
              : `https://www.youtube.com/embed/${reel.youtube_id}?playsinline=1&modestbranding=1&rel=0`
          }
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full bg-black"
        />
      ) : (
        <video
          ref={videoRef}
          src={cdnUrl(reel.video_url)}
          poster={cdnUrl(reel.thumbnail_url) || undefined}
          loop
          playsInline
          preload={isActive ? "auto" : "none"}
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />
      )}

      {/* Bottom gradient for legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Right-side action rail */}
      <div className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onLike}
          disabled={pending}
          aria-label={liked ? "Unlike" : "Like"}
          className="flex flex-col items-center gap-1 group"
        >
          <span
            className={cn(
              "inline-flex w-11 h-11 rounded-full items-center justify-center transition-colors",
              liked ? "bg-asf-red text-white" : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            <Heart
              className={cn("w-5 h-5", liked && "fill-current")}
              aria-hidden
            />
          </span>
          <span className="text-[0.65rem] text-white tabular-nums font-medium">
            {likeCount.toLocaleString()}
          </span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex w-11 h-11 rounded-full bg-black/40 text-white items-center justify-center">
            <MessageCircle className="w-5 h-5" aria-hidden />
          </span>
          <span className="text-[0.65rem] text-white tabular-nums font-medium">
            {reel.comment_count.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex w-11 h-11 rounded-full bg-black/40 text-white items-center justify-center">
            <Eye className="w-5 h-5" aria-hidden />
          </span>
          <span className="text-[0.65rem] text-white tabular-nums font-medium">
            {reel.view_count.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-4 text-white">
        {reel.author?.username ? (
          <Link
            href={`/profile/${reel.author.username}`}
            className="inline-flex items-center gap-2 mb-2 hover:underline"
          >
            <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden ring-2 ring-white/40">
              {reel.author.avatar_url ? (
                <FillImage src={reel.author.avatar_url} alt="" className="object-cover" sizes="32px" />
              ) : (
                <span aria-hidden>
                  {(reel.author.full_name ?? reel.author.username ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="text-sm font-medium drop-shadow">
              {reel.author.full_name ?? `@${reel.author.username}`}
            </span>
          </Link>
        ) : null}
        {reel.caption ? (
          <p className="text-sm leading-snug line-clamp-3 drop-shadow max-w-[80%]">
            {reel.caption}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-white/85">
          {sport && SportIcon ? (
            <span className="inline-flex items-center gap-1">
              <SportIcon className="w-3.5 h-3.5" aria-hidden />
              <span>{sport.name}</span>
            </span>
          ) : null}
          {country ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>{country.flag}</span>
              <span>{country.name}</span>
            </span>
          ) : null}
          {region ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden />
              <span>{region}</span>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
