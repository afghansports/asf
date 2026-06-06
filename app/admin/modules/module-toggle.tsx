"use client";

import { useState, useTransition } from "react";
import { setFeatureFlag } from "@/lib/features/actions";
import { cn } from "@/lib/utils";

export function ModuleToggle({
  flagKey,
  initialEnabled,
}: {
  flagKey: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function go() {
    const next = !enabled;
    setEnabled(next);
    setErr(null);
    start(async () => {
      const r = await setFeatureFlag(flagKey, next);
      if (!r.ok) {
        setEnabled(!next);
        setErr(r.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        aria-pressed={enabled}
        aria-label={enabled ? "Disable" : "Enable"}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-asf-green" : "bg-asf-off-2 border border-asf-border",
          pending && "opacity-60",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {err ? <p className="text-[0.65rem] text-asf-red">{err}</p> : null}
    </div>
  );
}
