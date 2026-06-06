import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * EmptyState. Per ASF_LAUNCH_PRD.md > Reusable Components.
 * Used wherever a list/section has no data to display.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-3 py-12 px-6 rounded-lg border border-dashed border-asf-border bg-white",
        className
      )}
    >
      {icon ? (
        <span className="inline-flex w-10 h-10 rounded-full bg-asf-off items-center justify-center text-asf-muted">
          {icon}
        </span>
      ) : null}
      <h3 className="font-display font-bold text-lg text-asf-text">{title}</h3>
      {description ? (
        <p className="text-sm text-asf-muted max-w-md leading-relaxed">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-2 inline-flex items-center justify-center h-9 px-4 rounded-md bg-asf-red text-white text-sm font-condensed font-bold tracking-wider uppercase hover:bg-asf-red-dark"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
