import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * <Card> — single source of truth for the white-bordered surface used
 * everywhere (teams, events, news, profiles, dashboard tiles, etc.).
 *
 * Replaces 100+ inline `rounded-lg bg-white border border-asf-border p-X`.
 *
 * Variants:
 *   - default: white, hover-elevate
 *   - flat: white, no shadow on hover (use inside long lists)
 *   - dark: charcoal background, white text
 *   - ghost: transparent border-only, for sub-sections
 *
 * Slots:
 *   <Card>
 *     <Card.Header />
 *     <Card.Body />
 *     <Card.Footer />
 *   </Card>
 */

const cardVariants = cva(
  "rounded-lg overflow-hidden transition-all duration-base ease-out",
  {
    variants: {
      variant: {
        default: "bg-white border border-asf-border hover:border-asf-red/30 hover:shadow-sm",
        flat:    "bg-white border border-asf-border",
        dark:    "bg-asf-navy text-white border border-asf-navy-light",
        ghost:   "border border-asf-border bg-transparent",
      },
      padding: {
        none: "",
        sm:   "p-3",
        md:   "p-4",
        lg:   "p-5",
        xl:   "p-6",
      },
    },
    defaultVariants: { variant: "default", padding: "none" },
  },
);

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

function CardRoot({ variant, padding, className, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 border-b border-asf-border", className)} {...props} />;
}

function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3 border-t border-asf-border bg-asf-off/40", className)} {...props} />;
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
