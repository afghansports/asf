import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EventCard, type EventCardData } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { US_STATES } from "@/lib/data/us-states";
import { EventsFilterBar } from "./events-filter-bar";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

/**
 * /events. Per ASF_LAUNCH_PRD.md > STEP 9 > /events.
 *
 * Server component. Reads filters from searchParams. Map view shows a single
 * Google Maps iframe centered on the filter state (or Northern Virginia by
 * default) with event cards below — per PRD note "Google Maps iframe (static
 * embed showing event location), event cards listed below map." Phase 2 will
 * upgrade this to per-event pins.
 */

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Afghan Sports Federation events: tournaments, matches, camps, and community days.",
};

type SearchParams = {
  state?: string;
  sport?: string;
  type?: string;
  range?: string;
  view?: string;
};

export default async function EventsListPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  if (!(await isFeatureEnabled("module.events"))) return <ModuleDisabled name="Events" />;
  const sp = (searchParams ? await searchParams : {}) as SearchParams;

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(
      "id, title, slug, event_type, sport, start_datetime, city, state_province, banner_url, is_free, is_featured"
    )
    .eq("is_published", true);

  const now = new Date();
  const nowIso = now.toISOString();
  let upper: string | null = null;
  if (sp.range === "week") {
    const u = new Date(now); u.setDate(u.getDate() + 7); upper = u.toISOString();
  } else if (sp.range === "month") {
    const u = new Date(now); u.setMonth(u.getMonth() + 1); upper = u.toISOString();
  }
  query = query.gt("start_datetime", nowIso);
  if (upper) query = query.lt("start_datetime", upper);
  if (sp.state) query = query.eq("state_province", sp.state);
  if (sp.sport) query = query.eq("sport", sp.sport);
  if (sp.type) query = query.eq("event_type", sp.type);
  query = query.order("start_datetime", { ascending: true }).limit(60);

  const { data: rows } = await query;
  const events = (rows ?? []) as EventCardData[];
  const view = sp.view === "map" ? "map" : "list";

  const stateName = sp.state
    ? US_STATES.find((s) => s.code === sp.state)?.name ?? sp.state
    : "Northern Virginia";
  const mapQuery = encodeURIComponent(stateName);

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="ASF events near you."
        subtitle="Tournaments, matches, camps, and community gatherings. All events are vetted by ASF before publishing."
      >
        <Link
          href="/events/create"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-asf-red text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
        >
          <PlusCircle className="w-4 h-4" aria-hidden />
          Post an event
        </Link>
      </PageHero>

      <EventsFilterBar />

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-8">
          {view === "map" ? (
            <div className="rounded-lg overflow-hidden border border-asf-border bg-white aspect-[16/7]">
              <iframe
                title="Events map"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}

          {events.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-5 h-5" aria-hidden />}
              title="No events match those filters."
              description="Try clearing a filter, or be the first to post an event."
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
    </>
  );
}
