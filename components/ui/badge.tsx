import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * <Badge> — replaces the 60+ inline status pills written as
 *   <span className="inline-flex items-center px-2 py-0.5 rounded bg-X text-Y text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
 *
 * Tones are semantic, not branded: success / warning / danger / neutral /
 * primary / accent. UI stays consistent even if the palette evolves again.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded font-condensed font-bold tracking-[0.18em] uppercase whitespace-nowrap",
  {
    variants: {
      tone: {
        primary:    "bg-asf-red text-white",
        success:    "bg-asf-green-light text-asf-green",
        successSolid: "bg-asf-green text-white",
        warning:    "bg-asf-gold-light text-asf-text border border-asf-gold/30",
        danger:     "bg-asf-red-light text-asf-red",
        neutral:    "bg-asf-off-2 text-asf-text",
        dark:       "bg-asf-navy text-white",
        outline:    "border border-asf-border text-asf-text",
        accent:     "bg-asf-gold text-white",
      },
      size: {
        sm: "text-[0.6rem] tracking-[0.16em] px-1.5 py-0.5",
        md: "text-[0.65rem] px-2 py-0.5",
        lg: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
