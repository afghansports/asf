"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * <ThemeToggle> — three-state pill switcher: Light / System / Dark.
 *
 * A segmented control beats a single icon toggle because users always know
 * which state they're in. The current segment fills with the active surface
 * (charcoal on light theme, white on dark) for unmissable feedback.
 */

const OPTIONS = [
  { value: "light",  label: "Light",  icon: Sun },
  { value: "system", label: "System", icon: MonitorSmartphone },
  { value: "dark",   label: "Dark",   icon: Moon },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — next-themes only knows the right value client-side
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex p-0.5 rounded-md bg-white/10 border border-white/15",
        className,
      )}
    >
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = mounted && theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1 px-2 h-7 rounded text-xs transition-colors duration-fast ease-out",
              active
                ? "bg-white text-asf-text shadow-sm"
                : "text-white/70 hover:text-white",
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
