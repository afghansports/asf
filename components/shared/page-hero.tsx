import { cn } from "@/lib/utils";

/**
 * PageHero. Full-width navy banner with red eyebrow, Playfair Display title,
 * optional subtitle and slot. Per ASF_LAUNCH_PRD.md > STEP 4 > PageHero.
 *
 * Decision: subtle diagonal-line texture is implemented via repeating-linear
 * gradient at 3% opacity (PRD calls this "optional"); turned on by default and
 * suppressible via `texture={false}`.
 */

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  texture?: boolean;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
};

const TEXTURE_BG =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 12px)";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  texture = true,
  align = "left",
  className,
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full bg-asf-navy text-white overflow-hidden",
        className
      )}
      style={
        texture
          ? { backgroundImage: TEXTURE_BG, backgroundColor: "var(--asf-navy)" }
          : undefined
      }
    >
      <div
        className={cn(
          "max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20",
          align === "center" && "text-center"
        )}
      >
        {eyebrow ? (
          <p className="font-condensed font-bold text-xs tracking-[0.28em] uppercase text-asf-red mb-4">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-display font-black text-3xl sm:text-5xl md:text-6xl leading-tight text-balance text-white break-words max-w-[21rem] sm:max-w-4xl",
            align === "center" && "mx-auto"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-5 max-w-[21rem] sm:max-w-2xl text-sm sm:text-lg text-white/80 leading-relaxed",
              align === "center" && "mx-auto"
            )}
          >
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
