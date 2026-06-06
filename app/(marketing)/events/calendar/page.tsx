import type { Metadata } from "next";
import Link from "next/link";
import { List, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { MonthCalendar, type CalEvent } from "./calendar";

export const metadata: Metadata = {
  title: "Events calendar",
  description: "Month view of all upcoming ASF events.",
};

export default async function EventsCalendarPage() {
  const supabase = await createClient();
  // Pull next 90 days of events. Reasonable cap for a month-view spanning
  // current + adjacent months.
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const until = new Date();
  until.setDate(until.getDate() + 120);

  const { data } = await supabase
    .from("events")
    .select("id, title, slug, event_type, sport, start_datetime, city, state_province")
    .eq("is_published", true)
    .gte("start_datetime", since.toISOString())
    .lt("start_datetime", until.toISOString())
    .order("start_datetime", { ascending: true })
    .limit(200);

  const events = (data ?? []) as CalEvent[];

  return (
    <>
      <PageHero
        eyebrow="Events calendar"
        title="Month view."
        subtitle="See every published event in one place. Click any event to open its detail page."
      >
        <div className="inline-flex rounded-md border border-white/30 bg-white/10 backdrop-blur-sm overflow-hidden">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-white/85 hover:bg-white/10"
          >
            <List className="w-3.5 h-3.5" aria-hidden />
            List
          </Link>
          <span className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-white text-asf-navy">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden />
            Calendar
          </span>
        </div>
      </PageHero>

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
          <MonthCalendar events={events} />
        </div>
      </section>
    </>
  );
}
