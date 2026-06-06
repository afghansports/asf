import { getContentBatch } from "@/lib/cms/site-content";

/**
 * StatsBar. Four stats on navy: editable via /admin/cms/homepage.
 * CMS keys: stat_1_number/label through stat_4.
 */
export async function StatsBar() {
  const c = await getContentBatch({
    stat_1_number: "26+",
    stat_1_label: "Years",
    stat_2_number: "1000+",
    stat_2_label: "Members",
    stat_3_number: "5",
    stat_3_label: "Sports",
    stat_4_number: "28+",
    stat_4_label: "Events",
  });

  const stats = [
    { value: c.stat_1_number, label: c.stat_1_label },
    { value: c.stat_2_number, label: c.stat_2_label },
    { value: c.stat_3_number, label: c.stat_3_label },
    { value: c.stat_4_number, label: c.stat_4_label },
  ];

  return (
    <section
      aria-label="Federation statistics"
      className="w-full bg-asf-navy text-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-2 md:grid-cols-4 divide-y divide-white/10 md:divide-y-0 md:divide-x">
        {stats.map((s) => (
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
  );
}
