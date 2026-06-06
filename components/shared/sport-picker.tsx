"use client";

import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SPORTS, type SportCode } from "@/lib/data/sports";
import { cn } from "@/lib/utils";

/**
 * SportPicker. Per ASF_LAUNCH_PRD.md > Form Rules: dropdown with Lucide icon
 * + sport label. Optional "All sports" option for filter UIs.
 */

type SportPickerProps = {
  value: SportCode | "" | null;
  onChange: (value: SportCode | "") => void;
  allowAll?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SportPicker({
  value,
  onChange,
  allowAll = false,
  placeholder = "Select sport",
  disabled,
  className,
}: SportPickerProps) {
  const selected = value ? SPORTS.find((s) => s.code === value) : undefined;
  const SelectedIcon = selected?.icon;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "h-10 w-full inline-flex items-center justify-between gap-2 px-3 rounded-md border border-asf-border bg-white text-sm text-start hover:bg-asf-off-2 disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
          >
            {selected && SelectedIcon ? (
              <span className="inline-flex items-center gap-2 text-asf-text">
                <SelectedIcon className="w-4 h-4 text-asf-navy" aria-hidden />
                {selected.name}
              </span>
            ) : value === "" && allowAll ? (
              <span className="text-asf-text">All sports</span>
            ) : (
              <span className="text-asf-muted">{placeholder}</span>
            )}
            <ChevronDown className="w-4 h-4 text-asf-muted" aria-hidden />
          </button>
        }
      />
      <PopoverContent align="start" sideOffset={6} className="w-60 p-1.5">
        <ul className="flex flex-col">
          {allowAll ? (
            <li>
              <button
                type="button"
                onClick={() => onChange("")}
                className={cn(
                  "w-full text-start px-3 py-2 rounded-md text-sm hover:bg-asf-off-2",
                  value === "" ? "bg-asf-off-2 font-medium" : ""
                )}
              >
                All sports
              </button>
            </li>
          ) : null}
          {SPORTS.map((s) => {
            const Icon = s.icon;
            const active = value === s.code;
            return (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => onChange(s.code)}
                  className={cn(
                    "w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-asf-off-2",
                    active ? "bg-asf-off-2 font-medium" : ""
                  )}
                >
                  <Icon className="w-4 h-4 text-asf-navy" aria-hidden />
                  <span className="flex-1 text-start">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
