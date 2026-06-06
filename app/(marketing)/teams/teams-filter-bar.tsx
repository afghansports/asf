"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter } from "lucide-react";
import { SPORTS } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";

/**
 * Sticky filter bar for /teams. Pure client URL-state pattern: each control
 * pushes to the same path with updated searchParams; the server page reads
 * those params on the next render.
 */

export function TeamsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sport = params.get("sport") ?? "";
  const state = params.get("state") ?? "";
  const status = params.get("status") ?? "all";
  const sort = params.get("sort") ?? "recent";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value) next.set(key, value);
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

        <div role="tablist" aria-label="Status" className="inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {[
            { code: "all", label: "All" },
            { code: "looking", label: "Looking for players" },
          ].map((o) => {
            const active = status === o.code;
            return (
              <button
                key={o.code}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParam("status", o.code === "all" ? "" : o.code)}
                className={
                  active
                    ? "h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                    : "h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setParam("sort", e.target.value === "recent" ? "" : e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
        >
          <option value="recent">Most recent</option>
          <option value="alpha">A . Z</option>
        </select>
      </div>
    </div>
  );
}
