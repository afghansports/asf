"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { saveNotificationPrefs } from "@/lib/notifications/actions";

type Channel = { inapp: boolean; email: boolean };
type Prefs = Record<string, Channel>;

export function PreferencesForm({
  initial,
  labels,
}: {
  initial: Record<string, { inapp?: boolean; email?: boolean }>;
  labels: Record<string, { label: string; description: string }>;
}) {
  const allKeys = Object.keys(labels);
  const initialNormalized: Prefs = {};
  for (const k of allKeys) {
    initialNormalized[k] = {
      inapp: initial[k]?.inapp ?? true,
      email: initial[k]?.email ?? false,
    };
  }
  const [prefs, setPrefs] = useState<Prefs>(initialNormalized);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; m: string }>({
    kind: "idle",
    m: "",
  });

  function setChannel(type: string, channel: keyof Channel, value: boolean) {
    setPrefs((p) => ({ ...p, [type]: { ...p[type], [channel]: value } }));
  }

  function save() {
    start(async () => {
      const r = await saveNotificationPrefs(prefs);
      setStatus({ kind: r.ok ? "ok" : "err", m: r.ok ? "Saved." : r.message });
    });
  }

  return (
    <div className="space-y-5">
      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.m}</Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.m}</Alert>
      ) : null}

      <div className="rounded-lg border border-asf-border bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr,auto,auto] gap-4 px-4 py-3 bg-asf-off border-b border-asf-border text-[0.65rem] font-condensed font-bold tracking-[0.22em] uppercase text-asf-muted">
          <span>Type</span>
          <span>In-app</span>
          <span>Email</span>
        </div>
        <ul className="divide-y divide-asf-border">
          {allKeys.map((k) => (
            <li key={k} className="grid grid-cols-[1fr,auto,auto] gap-4 px-4 py-3 items-center">
              <div>
                <p className="text-sm text-asf-text font-medium">{labels[k].label}</p>
                <p className="text-xs text-asf-muted">{labels[k].description}</p>
              </div>
              <Toggle
                value={prefs[k]?.inapp ?? true}
                onChange={(v) => setChannel(k, "inapp", v)}
                ariaLabel={`In-app ${labels[k].label}`}
              />
              <Toggle
                value={prefs[k]?.email ?? false}
                onChange={(v) => setChannel(k, "email", v)}
                ariaLabel={`Email ${labels[k].label}`}
              />
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        onClick={save}
        disabled={pending}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
      >
        <Save className="w-4 h-4" aria-hidden />
        {pending ? "Saving" : "Save preferences"}
      </Button>
    </div>
  );
}

function Toggle({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative inline-flex items-center"
    >
      <span className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-asf-red" : "bg-asf-border"}`} />
      <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-4" : ""}`} />
    </button>
  );
}
