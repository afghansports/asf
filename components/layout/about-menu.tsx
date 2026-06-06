"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * About dropdown for the desktop nav. Per PRD > STEP 4:
 * About ASF, Mission and Vision, History, Management Team.
 *
 * Uses a render-prop trigger (no `asChild` — base-ui doesn't support it; see
 * HANDOFF.md > recurring problem #2).
 */
const ITEMS = [
  { href: "/about", label: "About ASF" },
  { href: "/about/mission", label: "Mission and Vision" },
  { href: "/about/history", label: "History" },
  { href: "/about/team", label: "Management Team" },
];

export function AboutMenu({ tone = "navy" }: { tone?: "navy" | "white" }) {
  const triggerCls =
    tone === "navy"
      ? "inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-condensed font-bold tracking-wider uppercase text-asf-text hover:text-asf-red transition-colors aria-expanded:text-asf-red"
      : "inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-condensed font-bold tracking-wider uppercase text-white hover:text-asf-gold transition-colors";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button type="button" className={triggerCls}>
            <span>About</span>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden />
          </button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-56 p-1.5"
      >
        <ul className="flex flex-col">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-asf-text hover:bg-asf-off-2 hover:text-asf-red"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
