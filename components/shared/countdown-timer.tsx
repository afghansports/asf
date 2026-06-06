"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CountdownTimer. Per ASF_LAUNCH_PRD.md > Reusable Components.
 * Shows DD days HH hours MM min SS sec until `targetDate`. After expiry:
 * "The event has started!" Updates every second.
 *
 * Decision: SSR renders an empty placeholder with the same layout to avoid
 * hydration mismatches (per HANDOFF.md verification step #6 requirement).
 */

type CountdownTimerProps = {
  targetDate: string; // ISO 8601 string
  variant?: "light" | "dark"; // dark = on red banner (white text), light = on white card
  className?: string;
};

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function compute(target: number): TimeParts {
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    expired: false,
  };
}

export function CountdownTimer({
  targetDate,
  variant = "dark",
  className,
}: CountdownTimerProps) {
  const targetMs = new Date(targetDate).getTime();
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState<TimeParts>(() => compute(targetMs));

  useEffect(() => {
    setMounted(true);
    setParts(compute(targetMs));
    const id = window.setInterval(() => {
      setParts(compute(targetMs));
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn(
          "inline-flex items-center gap-3 sm:gap-5 invisible",
          className
        )}
      >
        <Cell value="00" label="Days" variant={variant} />
        <Cell value="00" label="Hours" variant={variant} />
        <Cell value="00" label="Min" variant={variant} />
        <Cell value="00" label="Sec" variant={variant} />
      </div>
    );
  }

  if (parts.expired) {
    return (
      <p
        className={cn(
          "font-condensed font-bold tracking-wider uppercase text-base",
          variant === "dark" ? "text-white" : "text-asf-text",
          className
        )}
      >
        The event has started.
      </p>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label="Countdown to Afghan Cup"
      className={cn("inline-flex items-center gap-3 sm:gap-5", className)}
    >
      <Cell value={pad(parts.days)} label="Days" variant={variant} />
      <Cell value={pad(parts.hours)} label="Hours" variant={variant} />
      <Cell value={pad(parts.minutes)} label="Min" variant={variant} />
      <Cell value={pad(parts.seconds)} label="Sec" variant={variant} />
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Cell({
  value,
  label,
  variant,
}: {
  value: string;
  label: string;
  variant: "dark" | "light";
}) {
  return (
    <div className="flex flex-col items-center min-w-[3.25rem]">
      <span
        className={cn(
          "font-condensed font-bold leading-none tabular-nums text-2xl sm:text-3xl tracking-wider",
          variant === "dark" ? "text-white" : "text-asf-text"
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "mt-1 font-condensed font-bold text-[0.65rem] sm:text-xs tracking-[0.18em] uppercase",
          variant === "dark" ? "text-white/70" : "text-asf-muted"
        )}
      >
        {label}
      </span>
    </div>
  );
}
