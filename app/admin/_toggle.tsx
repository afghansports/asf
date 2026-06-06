"use client";

import { useState, useTransition } from "react";
import type { AdminResult } from "./_actions";

/**
 * Toggle switch wired to a server action. Optimistic UI flips the visual state
 * immediately; reverts and shows alert if the action fails.
 */
export function AdminToggle({
  initial,
  action,
  ariaLabel,
}: {
  initial: boolean;
  action: (next: boolean) => Promise<AdminResult>;
  ariaLabel: string;
}) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function flip() {
    const next = !on;
    setOn(next);
    start(async () => {
      const r = await action(next);
      if (!r.ok) {
        window.alert(r.message);
        setOn(!next);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={on}
      onClick={flip}
      disabled={pending}
      className="relative inline-flex items-center"
    >
      <span className={`w-9 h-5 rounded-full transition-colors ${on ? "bg-asf-red" : "bg-asf-border"}`} />
      <span
        className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
