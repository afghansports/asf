"use client";

import { useState, useTransition } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { saveContent } from "@/app/admin/cms/_actions";

/**
 * CmsEditor. Generic per-section form. Takes a list of fields (key, label,
 * type, hint?) and the current values, and saves changes to site_content
 * via the saveContent server action.
 *
 * Per ASF_CLAUDE_CODE_PROMPT.md > SHARED COMPONENTS > CmsEditor:
 *   "Mark fields that control visible content with a note: Live on site after saving"
 */

export type CmsField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "datetime" | "color";
  hint?: string;
  placeholder?: string;
  rows?: number;
};

type Props = {
  title: string;
  description?: string;
  fields: CmsField[];
  initial: Record<string, string>;
};

export function CmsEditor({ title, description, fields, initial }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of fields) out[f.key] = initial[f.key] ?? "";
    return out;
  });
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({
    kind: "idle",
    msg: "",
  });

  function setOne(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle", msg: "" });
    start(async () => {
      const updates = fields.map((f) => ({ key: f.key, value: values[f.key] ?? "" }));
      const r = await saveContent(updates);
      if (r.ok) {
        setStatus({ kind: "ok", msg: `Saved ${r.saved} field${r.saved === 1 ? "" : "s"}.` });
      } else {
        setStatus({ kind: "err", msg: r.message });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <header className="flex items-start justify-between gap-4 pb-3 border-b border-asf-border">
        <div>
          <h2 className="font-display font-bold text-2xl text-asf-text">{title}</h2>
          {description ? (
            <p className="text-sm text-asf-muted mt-1">{description}</p>
          ) : null}
        </div>
        <p className="hidden sm:block text-[0.65rem] tracking-[0.22em] uppercase font-condensed font-bold text-asf-muted text-end">
          Live on site
          <br />
          after saving
        </p>
      </header>

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

      <div className="space-y-5">
        {fields.map((f) => {
          const id = `cms_${f.key}`;
          const v = values[f.key] ?? "";
          return (
            <div key={f.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={id} className="text-asf-text">
                  {f.label}
                </Label>
                <span className="text-[0.65rem] tracking-[0.18em] uppercase font-condensed font-bold text-asf-muted">
                  {f.key}
                </span>
              </div>
              {f.type === "textarea" ? (
                <Textarea
                  id={id}
                  rows={f.rows ?? 4}
                  value={v}
                  onChange={(e) => setOne(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  disabled={pending}
                />
              ) : (
                <Input
                  id={id}
                  type={f.type === "url" ? "url" : f.type === "datetime" ? "datetime-local" : "text"}
                  value={v}
                  onChange={(e) => setOne(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  disabled={pending}
                />
              )}
              {f.hint ? <p className="text-xs text-asf-muted">{f.hint}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button
          type="submit"
          disabled={pending}
          className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" aria-hidden />
          {pending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
