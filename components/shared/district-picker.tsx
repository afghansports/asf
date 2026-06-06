"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { AFGHAN_PROVINCES } from "@/lib/data/afghan-provinces";
import { cn } from "@/lib/utils";

/**
 * DistrictPicker — cascading province → district picker for Afghanistan.
 *
 * Loads districts from `geo_districts` table for the selected province on
 * demand (cached per-session). Only renders when parent country = 'AF'.
 */

type DistrictRow = { code: string; name: string; province_code: string };

const cache = new Map<string, DistrictRow[]>();

export function DistrictPicker({
  countryCode,
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  disabled,
  className,
}: {
  countryCode: string;
  province: string;
  district: string;
  onProvinceChange: (code: string) => void;
  onDistrictChange: (code: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  if (countryCode !== "AF") return null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <ProvinceSelect value={province} onChange={(p) => { onProvinceChange(p); onDistrictChange(""); }} disabled={disabled} />
      {province ? (
        <DistrictSelect
          provinceCode={province}
          value={district}
          onChange={onDistrictChange}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function ProvinceSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const selected = AFGHAN_PROVINCES.find((p) => p.code === value);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className="h-10 w-full inline-flex items-center justify-between gap-2 px-3 rounded-md border border-asf-border bg-white text-sm text-left hover:bg-asf-off-2 disabled:opacity-50"
          >
            <span className={selected ? "text-asf-text" : "text-asf-muted"}>
              {selected?.name ?? "Select province"}
            </span>
            <ChevronDown className="w-4 h-4 text-asf-muted" aria-hidden />
          </button>
        }
      />
      <PopoverContent align="start" sideOffset={6} className="w-72 p-1.5 max-h-72 overflow-y-auto">
        <ul className="flex flex-col">
          {AFGHAN_PROVINCES.map((p) => (
            <li key={p.code}>
              <button
                type="button"
                onClick={() => onChange(p.code)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-asf-off-2",
                  value === p.code ? "bg-asf-off-2 font-medium" : ""
                )}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function DistrictSelect({
  provinceCode,
  value,
  onChange,
  disabled,
}: {
  provinceCode: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [districts, setDistricts] = useState<DistrictRow[]>(() => cache.get(provinceCode) ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cache.has(provinceCode)) {
      setDistricts(cache.get(provinceCode)!);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("geo_districts")
      .select("code, name, province_code")
      .eq("country_code", "AF")
      .eq("province_code", provinceCode)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        const rows = (data ?? []) as DistrictRow[];
        cache.set(provinceCode, rows);
        setDistricts(rows);
        setLoading(false);
      });
  }, [provinceCode]);

  const selected = districts.find((d) => d.code === value);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled || districts.length === 0}
            className="h-10 w-full inline-flex items-center justify-between gap-2 px-3 rounded-md border border-asf-border bg-white text-sm text-left hover:bg-asf-off-2 disabled:opacity-50"
          >
            <span className={selected ? "text-asf-text" : "text-asf-muted"}>
              {loading ? "Loading districts..." : selected?.name ?? (districts.length === 0 ? "No districts seeded" : "Select district")}
            </span>
            <ChevronDown className="w-4 h-4 text-asf-muted" aria-hidden />
          </button>
        }
      />
      <PopoverContent align="start" sideOffset={6} className="w-72 p-1.5 max-h-72 overflow-y-auto">
        <ul className="flex flex-col">
          {districts.map((d) => (
            <li key={d.code}>
              <button
                type="button"
                onClick={() => onChange(d.code)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-asf-off-2",
                  value === d.code ? "bg-asf-off-2 font-medium" : ""
                )}
              >
                {d.name}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
