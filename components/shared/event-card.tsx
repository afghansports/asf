import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { getSport } from "@/lib/data/sports";
import { cn } from "@/lib/utils";
import { cdnUrl } from "@/lib/cdn/cloudflare";

/**
 * EventCard. Used on /events list, homepage Upcoming Events, team detail
 * Events tab. Spec from ASF_LAUNCH_PRD.md > STEP 9 (list view) reused here in
 * a slightly tighter homepage variant.
 */

export type EventCardData = {
  id: string;
  title: string;
  slug: string | null;
  event_type: string | null;
  sport: string | null;
  start_datetime: string;
  city: string | null;
  state_province: string | null;
  banner_url: string | null;
  is_free: boolean | null;
  is_featured?: boolean | null;
};

const TYPE_LABEL: Record<string, string> = {
  tournament: "Tournament",
  match: "Match",
  camp: "Camp",
  community: "Community",
  other: "Other",
};

const TYPE_TONE: Record<string, string> = {
  tournament: "bg-asf-red text-white",
  match: "bg-asf-navy text-white",
  camp: "bg-asf-gold text-asf-text",
  community: "bg-asf-green text-white",
  other: "bg-asf-off-2 text-asf-text",
};

function formatDateBadge(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();
  return { month, day };
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function EventCard({ event, className }: { event: EventCardData; className?: string }) {
  const sport = event.sport ? getSport(event.sport) : undefined;
  const SportIcon = sport?.icon;
  const { month, day } = formatDateBadge(event.start_datetime);
  const href = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;
  const typeKey = event.event_type ?? "other";
  const typeLabel = TYPE_LABEL[typeKey] ?? "Event";
  const typeTone = TYPE_TONE[typeKey] ?? TYPE_TONE.other;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-asf-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      <div
        className="relative h-40 w-full bg-asf-navy overflow-hidden"
        style={
          event.banner_url
            ? { backgroundImage: `url("${cdnUrl(event.banner_url)}")`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {/* Scrim so date badge + type pill stay readable on bright photos */}
        {event.banner_url ? (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/30" />
        ) : null}
        {!event.banner_url ? (
          <div className="absolute inset-0 bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy" />
        ) : null}
        <div className="absolute top-3 left-3 inline-flex flex-col items-center justify-center bg-white text-asf-navy rounded-md w-12 h-14 shadow-md">
          <span className="font-condensed font-bold text-[0.6rem] tracking-[0.16em] uppercase text-asf-red">
            {month}
          </span>
          <span className="font-display font-black text-2xl leading-none">{day}</span>
        </div>
        <span
          className={cn(
            "absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-md font-condensed font-bold text-[0.65rem] tracking-[0.18em] uppercase",
            typeTone
          )}
        >
          {typeLabel}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="font-display font-bold text-lg leading-snug text-asf-text line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs text-asf-muted">
          {sport ? (
            <span className="inline-flex items-center gap-1.5">
              {SportIcon ? <SportIcon className="w-3.5 h-3.5" aria-hidden /> : null}
              <span>{sport.name}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            <span>{formatLongDate(event.start_datetime)}</span>
          </span>
          {event.city || event.state_province ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" aria-hidden />
              <span>
                {[event.city, event.state_province].filter(Boolean).join(", ")}
              </span>
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          {event.is_free ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
              Free
            </span>
          ) : (
            <span />
          )}
          <Link
            href={href}
            className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red group-hover:underline underline-offset-4"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
