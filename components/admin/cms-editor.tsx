"use client";

import { useState, useTransition } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { saveContent, saveContentTranslations } from "@/app/admin/cms/_actions";

/**
 * CmsEditor. Generic per-section form over site_content fields, with a language
 * switch so admins edit each field in English (the source) or Dari/Pashto
 * (manual translation overrides). English saves to site_content; Dari/Pashto
 * save to the translation cache keyed by the English source, so they replace the
 * machine translation on the public side immediately. A blank Dari/Pashto field
 * falls back to automatic translation.
 */

export type CmsField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "datetime" | "color";
  hint?: string;
  placeholder?: string;
  rows?: number;
};

type Translations = { "fa-AF": Record<string, string>; ps: Record<string, string> };
type Lang = "en" | "fa-AF" | "ps";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fa-AF", label: "دری" },
  { code: "ps", label: "پښتو" },
];

type Props = {
  title: string;
  description?: string;
  fields: CmsField[];
  initial: Record<string, string>;
  translations?: Translations;
};

export function CmsEditor({ title, description, fields, initial, translations }: Props) {
  const [lang, setLang] = useState<Lang>("en");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of fields) out[f.key] = initial[f.key] ?? "";
    return out;
  });
  const [tr, setTr] = useState<Translations>(() => ({
    "fa-AF": { ...(translations?.["fa-AF"] ?? {}) },
    ps: { ...(translations?.ps ?? {}) },
  }));
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({
    kind: "idle",
    msg: "",
  });

  const isEn = lang === "en";
  const tl = lang as "fa-AF" | "ps"; // only read when !isEn

  const getVal = (key: string) => (isEn ? values[key] ?? "" : tr[tl][key] ?? "");
  function setVal(key: string, v: string) {
    if (isEn) setValues((p) => ({ ...p, [key]: v }));
    else setTr((p) => ({ ...p, [tl]: { ...p[tl], [key]: v } }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle", msg: "" });
    start(async () => {
      const r = isEn
        ? await saveContent(fields.map((f) => ({ key: f.key, value: values[f.key] ?? "" })))
        : await saveContentTranslations(
            lang,
            fields.map((f) => ({ sourceText: values[f.key] ?? "", value: tr[tl][f.key] ?? "" })),
          );
      if (r.ok) {
        const langLabel = LANGS.find((l) => l.code === lang)?.label ?? lang;
        setStatus({ kind: "ok", msg: `Saved ${r.saved} field${r.saved === 1 ? "" : "s"} (${langLabel}).` });
      } else {
        setStatus({ kind: "err", msg: r.message });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-asf-border">
        <div>
          <h2 className="font-display font-bold text-2xl text-asf-text">{title}</h2>
          {description ? <p className="text-sm text-asf-muted mt-1">{description}</p> : null}
          <p className="text-[0.65rem] tracking-[0.18em] uppercase font-condensed font-bold text-asf-muted mt-2">
            Live on site after saving
          </p>
        </div>
        {/* Language switch */}
        <div className="inline-flex rounded-md border border-asf-border overflow-hidden shrink-0">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={
                lang === l.code
                  ? "h-8 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                  : "h-8 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
              }
            >
              {l.label}
            </button>
          ))}
        </div>
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
          const id = `cms_${f.key}_${lang}`;
          const v = getVal(f.key);
          const en = values[f.key] ?? "";
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
              {/* English reference when translating */}
              {!isEn && en ? (
                <p dir="ltr" className="text-xs text-asf-muted bg-asf-off-2/50 rounded px-2 py-1">
                  <span className="font-condensed font-bold tracking-wider uppercase me-1">EN</span>
                  {en}
                </p>
              ) : null}
              {f.type === "textarea" ? (
                <Textarea
                  id={id}
                  dir={isEn ? "ltr" : "rtl"}
                  rows={f.rows ?? 4}
                  value={v}
                  onChange={(e) => setVal(f.key, e.target.value)}
                  placeholder={isEn ? f.placeholder : "Leave blank to auto-translate"}
                  disabled={pending}
                />
              ) : (
                <Input
                  id={id}
                  dir={isEn ? "ltr" : "rtl"}
                  type={f.type === "url" ? "url" : f.type === "datetime" ? "datetime-local" : "text"}
                  value={v}
                  onChange={(e) => setVal(f.key, e.target.value)}
                  placeholder={isEn ? f.placeholder : "Leave blank to auto-translate"}
                  disabled={pending}
                />
              )}
              {isEn && f.hint ? <p className="text-xs text-asf-muted">{f.hint}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-asf-border">
        <Button
          type="submit"
          disabled={pending}
          className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" aria-hidden />
          {pending ? "Saving" : `Save ${LANGS.find((l) => l.code === lang)?.label}`}
        </Button>
        {!isEn ? (
          <p className="text-xs text-asf-muted">Blank fields fall back to automatic translation.</p>
        ) : null}
      </div>
    </form>
  );
}
