"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalEvent = {
  id: string;
  title: string;
  slug: string | null;
  event_type: string | null;
  sport: string | null;
  start_datetime: string;
  city: string | null;
  state_province: string | null;
};

const TYPE_TONE: Record<string, string> = {
  tournament: "bg-asf-red text-white",
  match: "bg-asf-navy text-white",
  camp: "bg-asf-gold text-asf-text",
  community: "bg-asf-green text-white",
  other: "bg-asf-off-2 text-asf-text",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({ events }: { events: CalEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Group events by yyyy-mm-dd
  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const d = new Date(e.start_datetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    Array.from(map.values()).forEach((arr) => {
      arr.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
    });
    return map;
  }, [events]);

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  function shift(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className="rounded-lg border border-asf-border bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-asf-border">
        <h2 className="font-display font-bold text-2xl text-asf-text">{monthLabel}</h2>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-asf-border bg-white hover:bg-asf-off-2"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
            }
            className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-asf-border bg-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-off-2"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-asf-border bg-white hover:bg-asf-off-2"
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-asf-border bg-asf-off">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[0.7rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`;
          const dayEvents = byDay.get(key) ?? [];
          const isToday = isSameDay(day.date, new Date());
          return (
            <div
              key={key}
              className={cn(
                "min-h-[120px] sm:min-h-[140px] border-e border-b border-asf-border last:border-e-0 p-2 flex flex-col gap-1",
                !day.inMonth && "bg-asf-off/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-medium",
                    isToday
                      ? "bg-asf-red text-white"
                      : day.inMonth
                        ? "text-asf-text"
                        : "text-asf-muted",
                  )}
                >
                  {day.date.getDate()}
                </span>
                {dayEvents.length > 0 ? (
                  <span className="text-[0.65rem] text-asf-muted">{dayEvents.length}</span>
                ) : null}
              </div>
              <ul className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => {
                  const tone = TYPE_TONE[e.event_type ?? "other"] ?? TYPE_TONE.other;
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.slug ?? e.id}`}
                        className={cn(
                          "block px-1.5 py-0.5 rounded text-[0.65rem] truncate hover:opacity-90",
                          tone,
                        )}
                        title={e.title}
                      >
                        {new Date(e.start_datetime).toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        {e.title}
                      </Link>
                    </li>
                  );
                })}
                {dayEvents.length > 3 ? (
                  <li className="text-[0.65rem] text-asf-muted px-1.5">
                    +{dayEvents.length - 3} more
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function buildMonthGrid(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const start = new Date(year, month, 1 - startDow);
  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === month });
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
