"use client";

import { useState, useTransition } from "react";
import { Save, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { saveSettings } from "@/app/admin/cms/_actions";

type Setting = {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  label: string | null;
  group_name: string | null;
};

export function SettingsForm({ initial }: { initial: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const s of initial) out[s.setting_key] = s.setting_value ?? "";
    return out;
  });
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({ kind: "idle", msg: "" });

  function setOne(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function onSave(group: string) {
    setStatus({ kind: "idle", msg: "" });
    const groupKeys = initial.filter((s) => (s.group_name ?? "general") === group).map((s) => s.setting_key);
    const updates = groupKeys.map((k) => ({ key: k, value: values[k] ?? "" }));
    start(async () => {
      const r = await saveSettings(updates);
      if (r.ok) setStatus({ kind: "ok", msg: `Saved ${r.saved} setting${r.saved === 1 ? "" : "s"}.` });
      else setStatus({ kind: "err", msg: r.message });
    });
  }

  // Group settings by group_name
  const grouped = new Map<string, Setting[]>();
  for (const s of initial) {
    const g = s.group_name ?? "general";
    const arr = grouped.get(g) ?? [];
    arr.push(s);
    grouped.set(g, arr);
  }

  return (
    <div className="space-y-8">
      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green flex items-center gap-2">
          <Check className="w-4 h-4" aria-hidden />
          {status.msg}
        </Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4" aria-hidden />
          {status.msg}
        </Alert>
      ) : null}

      {Array.from(grouped.entries()).map(([group, settings]) => (
        <section key={group} className="rounded-lg border border-asf-border bg-white p-5">
          <header className="pb-3 mb-5 border-b border-asf-border">
            <h2 className="font-display font-bold text-xl text-asf-text capitalize">{group.replace("_", " ")}</h2>
          </header>

          {group === "general" && values["maintenance_mode"] === "true" ? (
            <Alert className="border-asf-gold/40 bg-asf-gold-light text-asf-text flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-asf-gold" aria-hidden />
              Maintenance mode is on. Visitors will see a 503 page.
            </Alert>
          ) : null}

          <div className="space-y-4">
            {settings.map((s) => {
              const id = `setting_${s.setting_key}`;
              const isBool = s.setting_type === "bool" || s.setting_type === "boolean";
              const v = values[s.setting_key] ?? "";
              return (
                <div key={s.setting_key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={id} className="text-asf-text">
                      {s.label ?? s.setting_key}
                    </Label>
                    <span className="text-[0.65rem] tracking-[0.18em] uppercase font-condensed font-bold text-asf-muted">
                      {s.setting_key}
                    </span>
                  </div>
                  {isBool ? (
                    <label className="inline-flex items-center gap-3 select-none">
                      <span className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={v === "true"}
                          onChange={(e) => setOne(s.setting_key, e.target.checked ? "true" : "false")}
                          disabled={pending}
                          className="peer sr-only"
                        />
                        <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
                        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                      </span>
                      <span className="text-sm text-asf-text">{v === "true" ? "On" : "Off"}</span>
                    </label>
                  ) : (
                    <Input
                      id={id}
                      type={s.setting_type === "datetime" ? "datetime-local" : "text"}
                      value={v}
                      onChange={(e) => setOne(s.setting_key, e.target.value)}
                      disabled={pending}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-asf-border">
            <Button
              type="button"
              onClick={() => onSave(group)}
              disabled={pending}
              className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5 inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" aria-hidden />
              {pending ? "Saving" : "Save group"}
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
