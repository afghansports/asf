"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { US_STATES } from "@/lib/data/us-states";
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

interface StatePickerProps {
  value?: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * US states + DC dropdown (50 + DC).
 * Per ASF_LAUNCH_PRD.md > Form rules: state is NEVER free text.
 * Render this only when country = "US".
 */
export function StatePicker({
  value,
  onChange,
  placeholder = "Select state",
  disabled = false,
}: StatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = US_STATES.find((s) => s.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label="State"
        disabled={disabled}
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 h-10 px-3 rounded-md border border-asf-border bg-white text-sm font-normal hover:bg-asf-off-2 focus:outline-none focus:ring-2 focus:ring-asf-red focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none",
          !selected && "text-asf-muted"
        )}
      >
        <span className="truncate">
          {selected ? selected.name : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search state..." className="h-9" />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {US_STATES.map((s) => (
                <CommandItem
                  key={s.code}
                  value={`${s.name} ${s.code}`}
                  onSelect={() => {
                    onChange(s.code);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="flex-1 truncate">{s.name}</span>
                  {value === s.code && <Check className="ms-2 h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
