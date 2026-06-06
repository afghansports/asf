import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { createClient } from "@/lib/supabase/server";

/**
 * /faq. Reads from `faq_items` table, grouped by category. Editable from
 * /admin/faq.
 */

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Afghan Sports Federation membership, teams, events, and the Afghan Cup.",
};

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number | null;
};

// Display labels for known categories. Unknown categories get title-cased.
const CATEGORY_ORDER = ["general", "registration", "teams", "events", "afghan_cup", "volunteering"];
const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  registration: "Registration",
  teams: "Teams",
  events: "Events",
  afghan_cup: "Afghan Cup",
  volunteering: "Volunteering and contact",
};

function labelFor(cat: string): string {
  return (
    CATEGORY_LABELS[cat] ??
    cat
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
  );
}

const FALLBACK: FaqRow[] = [
  {
    id: "f1",
    question: "What is ASF?",
    answer:
      "Afghan Sports Federation is a non-profit organization founded in 1998 in the Washington D.C. metro area. We organize tournaments, leagues, and community events in five sports across the United States.",
    category: "general",
    sort_order: 1,
  },
];

export default async function FaqPage() {
  let rows: FaqRow[] = FALLBACK;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("faq_items")
      .select("id, question, answer, category, sort_order")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) rows = data as FaqRow[];
  } catch {
    // keep fallback
  }

  // Group into ordered sections
  const grouped = new Map<string, FaqRow[]>();
  for (const r of rows) {
    const arr = grouped.get(r.category) ?? [];
    arr.push(r);
    grouped.set(r.category, arr);
  }

  // Order: known categories first in CATEGORY_ORDER, then any unknown alphabetical
  const knownPresent = CATEGORY_ORDER.filter((c) => grouped.has(c));
  const unknown = Array.from(grouped.keys())
    .filter((c) => !CATEGORY_ORDER.includes(c))
    .sort();
  const sections = [...knownPresent, ...unknown];

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions."
        subtitle="Quick answers to the most common questions about ASF, teams, events, and the Afghan Cup."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-12">
          {sections.map((cat) => {
            const items = grouped.get(cat) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <SectionLabel>{labelFor(cat)}</SectionLabel>
                <ul className="rounded-lg overflow-hidden border border-asf-border bg-white divide-y divide-asf-border">
                  {items.map((it) => (
                    <li key={it.id}>
                      <details className="group">
                        <summary className="list-none cursor-pointer flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-asf-off-2">
                          <span className="font-medium text-asf-text">{it.question}</span>
                          <ChevronDown
                            className="w-4 h-4 text-asf-muted transition-transform group-open:rotate-180"
                            aria-hidden
                          />
                        </summary>
                        <div className="px-4 sm:px-5 pb-5 text-asf-text/85 leading-relaxed whitespace-pre-line">
                          {it.answer}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
