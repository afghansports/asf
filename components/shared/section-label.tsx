import { cn } from "@/lib/utils";

/**
 * SectionLabel. Red 2px left border, uppercase Barlow Condensed eyebrow.
 * Per ASF_LAUNCH_PRD.md > STEP 4 > SectionLabel.
 */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block pl-3 border-l-2 border-asf-red font-condensed font-bold text-xs tracking-[0.24em] uppercase text-asf-text",
        className
      )}
    >
      {children}
    </span>
  );
}
