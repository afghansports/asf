"use client";

import Link from "next/link";
import { Filter, Upload } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SPORTS } from "@/lib/data/sports";
import { COUNTRIES } from "@/lib/data/countries";

export function ReelsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const country = params.get("country") ?? "";
  const sport = params.get("sport") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  // Show top 12 commonly-relevant countries first
  const topCountries = ["US", "AF", "CA", "GB", "DE", "AU", "NL", "SE", "AE", "PK", "IN", "TR"];
  const topRows = topCountries
    .map((c) => COUNTRIES.find((x) => x.code === c))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-asf-muted text-xs font-condensed font-bold tracking-[0.18em] uppercase me-1">
          <Filter className="w-3.5 h-3.5" aria-hidden />
          Filters
        </span>
        {/* Sport first — most users come to /reels to see their sport. */}
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
        {/* Country second — narrows to your diaspora chapter. */}
        <select
          aria-label="Country"
          value={country}
          onChange={(e) => setParam("country", e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm max-w-[12rem]"
        >
          <option value="">All countries</option>
          {topRows.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
          <option disabled>──────</option>
          {COUNTRIES.filter((c) => !topCountries.includes(c.code)).map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <Link
          href="/reels/upload"
          className="ms-auto inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-red-dark"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden />
          Upload reel
        </Link>
      </div>
    </div>
  );
}
