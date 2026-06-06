import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { createClient } from "@/lib/supabase/server";
import { getContentBatch } from "@/lib/cms/site-content";
import { tObject, translateMany, isTranslatable, getLocale } from "@/lib/i18n/translate";

/**
 * /about/history. Vertical timeline read from the `history_timeline` table.
 * Editable from /admin/history. Stats row reads from site_content stat_*.
 */

export const metadata: Metadata = {
  title: "History",
  description:
    "Twenty-six years of the Afghan Sports Federation. Founded 1998 in Washington D.C.; first Afghan Cup in 1999; 28 editions and counting.",
};

type HistoryRow = {
  id: string;
  year: number;
  title: string;
  description: string | null;
};

const FALLBACK_TIMELINE: HistoryRow[] = [
  { id: "f1", year: 1998, title: "Federation founded", description: "ASF established in the Washington D.C. metro area." },
  { id: "f2", year: 1999, title: "First Afghan Cup", description: "Inaugural tournament held in Northern Virginia." },
  { id: "f3", year: 2005, title: "Five-sport expansion", description: "Programs grow beyond soccer to four other sports." },
  { id: "f4", year: 2015, title: "500+ active members", description: "Membership crosses 500." },
  { id: "f5", year: 2021, title: "New community arrivals", description: "ASF supports families arriving from Afghanistan." },
  { id: "f6", year: 2024, title: "Platform modernization", description: "Digital platform development begins." },
  { id: "f7", year: 2026, title: "28th edition + platform launch", description: "Afghan Cup 2026 hosts in Northern Virginia." },
];

export default async function HistoryPage() {
  let timeline: HistoryRow[] = FALLBACK_TIMELINE;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("history_timeline")
      .select("id, year, title, description")
      .eq("is_active", true)
      .order("year", { ascending: true });
    if (data && data.length > 0) timeline = data as HistoryRow[];
  } catch {
    // keep fallback
  }

  const locale = await getLocale();

  // Translate timeline entries (title + description) for Dari/Pashto readers.
  let viewTimeline = timeline;
  if (isTranslatable(locale) && timeline.length) {
    const n = timeline.length;
    const tx = await translateMany(
      [...timeline.map((e) => e.title ?? ""), ...timeline.map((e) => e.description ?? "")],
      locale,
    );
    viewTimeline = timeline.map((e, i) => ({
      ...e,
      title: tx[i] || e.title,
      description: tx[n + i] || e.description,
    }));
  }

  const stats = await tObject(
    await getContentBatch({
      stat_1_number: "26+",
      stat_1_label: "Years",
      stat_2_number: "28",
      stat_2_label: "Afghan Cups",
      stat_3_number: "5",
      stat_3_label: "Sports",
      stat_4_number: "1000+",
      stat_4_label: "Members",
    }),
    locale,
  );

  const t = await tObject(
    {
      eyebrow: "History",
      title: "26 years of Afghan sports.",
      subtitle:
        "From a single pick-up tournament to a federation with thousands of members across the United States.",
      timelineLabel: "Timeline",
    },
    locale,
  );

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />

      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
          <SectionLabel>{t.timelineLabel}</SectionLabel>
          <ol className="mt-10 relative ps-6 sm:ps-8 border-s-2 border-asf-red/30 space-y-10">
            {viewTimeline.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  className="absolute -left-[1.6rem] sm:-left-[2.1rem] top-1 inline-flex w-3 h-3 rounded-full bg-asf-red ring-4 ring-asf-off"
                  aria-hidden
                />
                <p className="font-condensed font-bold text-xs tracking-[0.28em] uppercase text-asf-red">
                  {entry.year}
                </p>
                <h3 className="mt-1 font-display font-bold text-xl text-asf-text">
                  {entry.title}
                </h3>
                {entry.description ? (
                  <p className="mt-2 text-asf-muted leading-relaxed whitespace-pre-line">
                    {entry.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-4 divide-y divide-white/10 md:divide-y-0 md:divide-x">
          {[
            { value: stats.stat_1_number, label: stats.stat_1_label },
            { value: stats.stat_2_number, label: stats.stat_2_label },
            { value: stats.stat_3_number, label: stats.stat_3_label },
            { value: stats.stat_4_number, label: stats.stat_4_label },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center text-center py-4 md:py-2 px-2"
            >
              <span className="font-condensed font-bold text-3xl sm:text-4xl tracking-wider leading-none">
                {s.value}
              </span>
              <span className="mt-2 font-condensed font-bold text-[0.7rem] sm:text-xs tracking-[0.28em] uppercase text-white/70">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
