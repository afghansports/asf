"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, List, Map as MapIcon, CalendarDays } from "lucide-react";
import { SPORTS } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";

const TYPES = [
  { code: "", label: "All types" },
  { code: "tournament", label: "Tournament" },
  { code: "match", label: "Match" },
  { code: "camp", label: "Camp" },
  { code: "community", label: "Community" },
  { code: "other", label: "Other" },
];

const RANGES = [
  { code: "week", label: "This week" },
  { code: "month", label: "This month" },
  { code: "all", label: "All upcoming" },
];

export function EventsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const state = params.get("state") ?? "";
  const sport = params.get("sport") ?? "";
  const type = params.get("type") ?? "";
  const range = params.get("range") ?? "all";
  const view = params.get("view") ?? "list";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-asf-muted text-xs font-condensed font-bold tracking-[0.18em] uppercase mr-1">
          <Filter className="w-3.5 h-3.5" aria-hidden />
          Filters
        </span>

        {/* Primary: WHEN — every user picks a date window first. */}
        <div role="tablist" aria-label="Date range" className="inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {RANGES.map((r) => {
            const active = (range || "all") === r.code;
            return (
              <button
                key={r.code}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParam("range", r.code)}
                className={
                  active
                    ? "h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                    : "h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Secondary: SPORT — second most common filter. */}
        <select
          aria-label="Sport"
          value={sport}
          onChange={(e) => setParam("sport", e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
        >
          <option value="">All sports</option>
          {SPORTS.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Tertiary: TYPE. */}
        <select
          aria-label="Type"
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Geo last — less common than time/sport/type. */}
        <select
          aria-label="State"
          value={state}
          onChange={(e) => setParam("state", e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm max-w-[10rem]"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>

        <div role="tablist" aria-label="View" className="ml-auto inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {[
            { code: "list", label: "List", icon: List },
            { code: "map", label: "Map", icon: MapIcon },
          ].map((v) => {
            const active = view === v.code;
            const Icon = v.icon;
            return (
              <button
                key={v.code}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParam("view", v.code === "list" ? "" : v.code)}
                className={
                  active
                    ? "inline-flex items-center gap-1.5 h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                    : "inline-flex items-center gap-1.5 h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
                }
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                <span>{v.label}</span>
              </button>
            );
          })}
          <Link
            href="/events/calendar"
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2 border-l border-asf-border"
          >
            <CalendarDays className="w-3.5 h-3.5" aria-hidden />
            <span>Calendar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
