"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/data/countries";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CountryPickerProps {
  value?: string;                  // ISO 3166-1 alpha-2
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional: show a smaller list (e.g. for phone country code only) */
  filter?: (c: Country) => boolean;
}

/**
 * Searchable country dropdown with flag emojis.
 * Per ASF_LAUNCH_PRD.md > Form rules: countries are NEVER free text.
 */
export function CountryPicker({
  value,
  onChange,
  placeholder = "Select country",
  disabled = false,
  filter,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const list = filter ? COUNTRIES.filter(filter) : COUNTRIES;
  const selected = list.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label="Country"
        disabled={disabled}
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 h-10 px-3 rounded-md border border-asf-border bg-white text-sm font-normal hover:bg-asf-off-2 focus:outline-none focus:ring-2 focus:ring-asf-red focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none",
          !selected && "text-asf-muted"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <span className="text-base leading-none" aria-hidden>
                {selected.flag}
              </span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {list.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="text-base leading-none me-2" aria-hidden>
                    {c.flag}
                  </span>
                  <span className="flex-1 truncate">{c.name}</span>
                  {value === c.code && <Check className="ms-2 h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
