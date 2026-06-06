import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { EventCard, type EventCardData } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";

/**
 * UpcomingEvents (server). Per ASF_LAUNCH_PRD.md > STEP 5 > Upcoming Events.
 *
 * Query: published upcoming events ORDER BY start_datetime ASC LIMIT 3.
 * Empty state per PRD: "No upcoming events. Be the first to create one."
 */
export async function UpcomingEvents() {
  let events: EventCardData[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, title, slug, event_type, sport, start_datetime, city, state_province, banner_url, is_free, is_featured"
      )
      .eq("is_published", true)
      .gt("start_datetime", new Date().toISOString())
      .order("start_datetime", { ascending: true })
      .limit(3);
    events = (data ?? []) as EventCardData[];
  } catch {
    events = [];
  }

  return (
    <section className="w-full bg-asf-off">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="space-y-3">
            <SectionLabel>Coming up</SectionLabel>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight">
              Upcoming events
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
          >
            View all events
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-5 h-5" aria-hidden />}
            title="No upcoming events yet."
            description="Be the first to create one. Events are reviewed by ASF before publishing."
            action={{ label: "Post an event", href: "/events/create" }}
          />
        ) : (
          <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <EventCard event={e} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
