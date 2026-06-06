import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Ticket, ExternalLink, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { ShareButtons } from "@/components/shared/share-buttons";
import { EventCard, type EventCardData } from "@/components/shared/event-card";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Event ${params.id}`, description: `ASF event ${params.id}` };
}

/**
 * /events/[id]. Per ASF_LAUNCH_PRD.md > STEP 9 > /events/[id].
 * Banner, title, type/date/location, organizer, description, map, registration,
 * share row, related events.
 *
 * Decision: route accepts either UUID or slug. Tries `id` first, then `slug`.
 */
export default async function EventDetailPage({ params }: Props) {
  const supabase = await createClient();
  let { data: event } = await supabase
    .from("events")
    .select(
      "id, title, slug, event_type, sport, start_datetime, end_datetime, description, banner_url, city, state_province, venue_name, address, is_free, registration_link, organizer_id, organizer_team_id, is_published"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!event) {
    const { data: bySlug } = await supabase
      .from("events")
      .select(
        "id, title, slug, event_type, sport, start_datetime, end_datetime, description, banner_url, city, state_province, venue_name, address, is_free, registration_link, organizer_id, organizer_team_id, is_published"
      )
      .eq("slug", params.id)
      .maybeSingle();
    event = bySlug;
  }

  if (!event || !event.is_published) notFound();

  const sport = event.sport ? getSport(event.sport) : undefined;
  const SportIcon = sport?.icon;
  const stateName = event.state_province
    ? US_STATES.find((s) => s.code === event.state_province)?.name ?? event.state_province
    : null;

  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;
  const dateStr = start.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = start.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTimeStr = end ? end.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }) : null;

  // Organizer
  const { data: organizer } = event.organizer_id
    ? await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", event.organizer_id)
        .maybeSingle()
    : { data: null };

  const { data: organizerTeam } = event.organizer_team_id
    ? await supabase
        .from("teams")
        .select("name, slug, logo_url")
        .eq("id", event.organizer_team_id)
        .maybeSingle()
    : { data: null };

  // Related events
  const { data: relatedRows } = await supabase
    .from("events")
    .select("id, title, slug, event_type, sport, start_datetime, city, state_province, banner_url, is_free, is_featured")
    .eq("is_published", true)
    .eq("state_province", event.state_province ?? "")
    .neq("id", event.id)
    .gt("start_datetime", new Date().toISOString())
    .order("start_datetime", { ascending: true })
    .limit(3);
  const related = (relatedRows ?? []) as EventCardData[];

  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events/${event.slug ?? event.id}`;
  const mapQuery = encodeURIComponent(
    [event.address, event.venue_name, event.city, stateName].filter(Boolean).join(", ")
  );

  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-72 sm:h-80 w-full bg-asf-navy overflow-hidden" aria-hidden>
          {event.banner_url ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${event.banner_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : null}
          {/* Strong bottom gradient ensures the PageHero title below stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-asf-navy/20 via-asf-navy/50 to-asf-navy" />
        </div>
      </section>

      <PageHero
        eyebrow={event.event_type ?? "Event"}
        title={event.title}
        subtitle={[stateName, event.city].filter(Boolean).join(" . ")}
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <article>
              <SectionLabel>Event details</SectionLabel>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailItem icon={<Calendar className="w-4 h-4" aria-hidden />} label="Date">
                  {dateStr}
                </DetailItem>
                <DetailItem icon={<Calendar className="w-4 h-4" aria-hidden />} label="Time">
                  {timeStr}{endTimeStr ? ` to ${endTimeStr}` : ""}
                </DetailItem>
                {sport ? (
                  <DetailItem icon={SportIcon ? <SportIcon className="w-4 h-4" aria-hidden /> : null} label="Sport">
                    {sport.name}
                  </DetailItem>
                ) : null}
                <DetailItem icon={<MapPin className="w-4 h-4" aria-hidden />} label="Location">
                  {[event.venue_name, event.city, stateName].filter(Boolean).join(", ") || "TBA"}
                </DetailItem>
                <DetailItem icon={<Ticket className="w-4 h-4" aria-hidden />} label="Entry">
                  {event.is_free ? "Free" : "Paid"}
                </DetailItem>
              </ul>
            </article>

            {event.description ? (
              <article>
                <SectionLabel>About this event</SectionLabel>
                <p className="mt-4 text-asf-text/85 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </article>
            ) : null}

            {event.address || event.city ? (
              <article>
                <SectionLabel>Map</SectionLabel>
                <div className="mt-4 rounded-lg overflow-hidden border border-asf-border bg-white aspect-[16/8]">
                  <iframe
                    title="Event location"
                    src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>
            ) : null}

            <article>
              <SectionLabel>Share</SectionLabel>
              <div className="mt-4">
                <ShareButtons url={fullUrl} title={event.title} />
              </div>
            </article>

            {related.length > 0 ? (
              <article>
                <SectionLabel>Related events {stateName ? `in ${stateName}` : ""}</SectionLabel>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((e) => (
                    <li key={e.id}>
                      <EventCard event={e} />
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>

          <aside className="space-y-5">
            {event.registration_link ? (
              <a
                href={event.registration_link}
                target="_blank"
                rel="noreferrer noopener"
                className="block w-full text-center rounded-lg p-4 bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
              >
                Register
                <ExternalLink className="inline-block w-3.5 h-3.5 ml-1.5" aria-hidden />
              </a>
            ) : null}

            {organizer ? (
              <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
                <SectionLabel>Organizer</SectionLabel>
                <Link
                  href={`/profile/${organizer.username}`}
                  className="flex items-center gap-3 hover:text-asf-red"
                >
                  <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-sm overflow-hidden">
                    {organizer.avatar_url ? (
                      <Image src={organizer.avatar_url} alt="" fill className="object-cover" sizes="40px" unoptimized />
                    ) : (
                      <span aria-hidden>
                        {(organizer.full_name ?? organizer.username ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span>
                    <span className="block text-sm text-asf-text">{organizer.full_name ?? organizer.username}</span>
                    <span className="block text-xs text-asf-muted">@{organizer.username}</span>
                  </span>
                </Link>
                {organizerTeam ? (
                  <Link
                    href={`/teams/${organizerTeam.slug}`}
                    className="block text-xs text-asf-muted hover:text-asf-red"
                  >
                    Hosted by {organizerTeam.name}
                    <ArrowRight className="inline-block w-3.5 h-3.5 ml-1" aria-hidden />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 p-4 rounded-lg bg-white border border-asf-border">
      <span className="inline-flex w-8 h-8 rounded-full bg-asf-navy/5 items-center justify-center text-asf-navy mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
          {label}
        </p>
        <p className="text-sm text-asf-text mt-0.5">{children}</p>
      </div>
    </li>
  );
}
