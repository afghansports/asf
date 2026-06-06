import type { Metadata } from "next";
import { ToggleRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ModuleToggle } from "./module-toggle";

export const metadata: Metadata = { title: "Modules" };

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  social: "Social",
  content: "Content",
  safety: "Trust & safety",
  monetization: "Monetization",
  integration: "Integrations",
  homepage: "Homepage",
};

export default async function AdminModulesPage() {
  const supabase = await createClient();
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("key, label, description, category, is_enabled, default_value")
    .order("category")
    .order("key");

  type Flag = {
    key: string;
    label: string;
    description: string | null;
    category: string;
    is_enabled: boolean;
    default_value: boolean;
  };
  const grouped: Record<string, Flag[]> = {};
  for (const f of (flags ?? []) as Flag[]) {
    grouped[f.category] = grouped[f.category] ?? [];
    grouped[f.category].push(f);
  }

  return (
    <section className="space-y-8">
      <header className="flex items-start gap-3">
        <span className="inline-flex w-10 h-10 rounded bg-asf-navy text-white items-center justify-center">
          <ToggleRight className="w-5 h-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text leading-none">Modules</h1>
          <p className="mt-1 text-sm text-asf-muted">
            Toggle any feature on or off platform-wide. Disabled modules disappear from menus and
            their routes return a friendly &ldquo;feature unavailable&rdquo; page.
          </p>
        </div>
      </header>

      {Object.keys(grouped)
        .sort()
        .map((cat) => (
          <div key={cat} className="rounded-lg border border-asf-border bg-white">
            <div className="px-5 py-3 border-b border-asf-border">
              <p className="font-condensed font-bold text-[0.7rem] tracking-[0.22em] uppercase text-asf-muted">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
            </div>
            <ul className="divide-y divide-asf-border">
              {grouped[cat].map((f) => (
                <li key={f.key} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-asf-text">{f.label}</p>
                    {f.description ? (
                      <p className="text-xs text-asf-muted mt-0.5">{f.description}</p>
                    ) : null}
                    <code className="block text-[0.65rem] text-asf-muted/70 mt-1 font-mono">{f.key}</code>
                  </div>
                  <ModuleToggle flagKey={f.key} initialEnabled={f.is_enabled} />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
