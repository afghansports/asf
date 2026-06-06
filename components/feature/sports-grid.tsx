import { SectionLabel } from "@/components/shared/section-label";
import { SPORTS } from "@/lib/data/sports";

/**
 * SportsGrid. Per ASF_LAUNCH_PRD.md > STEP 5 > Sports Grid.
 * Five static cards (responsive). Cards no longer link to /teams — the Teams
 * section can be hidden, so these are presentational only.
 */
export function SportsGrid() {
  return (
    <section className="w-full bg-white border-y border-asf-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <SectionLabel>Programs</SectionLabel>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight max-w-2xl">
            Five sports, one community.
          </h2>
          <p className="text-asf-muted max-w-xl">
            All ASF programs run year-round across the United States.
          </p>
        </div>

        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {SPORTS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.code}>
                <div className="flex flex-col h-full p-6 rounded-lg bg-asf-off border-t-4 border-transparent">
                  <span className="inline-flex w-12 h-12 rounded-full bg-asf-navy/5 items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-asf-navy" aria-hidden />
                  </span>
                  <p className="font-condensed font-bold text-base tracking-wide text-asf-text">
                    {s.name}
                  </p>
                  <p className="mt-1 text-xs text-asf-muted leading-relaxed">{s.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
