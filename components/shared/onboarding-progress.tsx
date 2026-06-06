import { cn } from "@/lib/utils";

type OnboardingStep = 1 | 2 | 3;

interface Props {
  current: OnboardingStep;
}

const STEPS: Array<{ n: OnboardingStep; label: string }> = [
  { n: 1, label: "Location" },
  { n: 2, label: "Sports" },
  { n: 3, label: "Community" },
];

export function OnboardingProgress({ current }: Props) {
  return (
    <div className="mb-10">
      <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red mb-3 text-center">
        Step {current} of 3
      </p>
      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => {
          const done = current > s.n;
          const active = current === s.n;
          return (
            <div key={s.n} className="flex-1 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-condensed font-bold text-sm shrink-0",
                    done && "bg-asf-green text-white",
                    active && "bg-asf-red text-white",
                    !done && !active && "bg-asf-off-2 text-asf-muted"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {s.n}
                </div>
                <span
                  className={cn(
                    "font-condensed font-bold text-xs tracking-[0.14em] uppercase whitespace-nowrap",
                    (done || active) && "text-asf-text",
                    !done && !active && "text-asf-muted"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    done ? "bg-asf-green" : "bg-asf-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
