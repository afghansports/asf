import { cn } from "@/lib/utils";

/**
 * <Skeleton> — content-aware loading placeholder.
 *
 * Uses a shimmer animation (defined in tailwind.config.ts). The 1.6s loop is
 * deliberate: fast enough that a brief load (~300ms) still gets one full
 * sweep so users perceive motion, slow enough that a long load (~3s) doesn't
 * feel anxious.
 *
 * Honors `motion-reduce` — drops to a static dim block for users with the
 * preference set.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "bg-asf-off-2 rounded-md",
        "bg-gradient-to-r from-asf-off-2 via-white/70 to-asf-off-2 bg-[length:200%_100%]",
        "motion-safe:animate-shimmer motion-reduce:bg-asf-off-2",
        className,
      )}
      {...props}
    />
  );
}

/** Convenience presets so callers don't fight Tailwind for common shapes. */
export function SkeletonLine({ width = "100%", className }: { width?: string; className?: string }) {
  return <Skeleton className={cn("h-3", className)} style={{ width }} />;
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton className={cn("rounded-full", className)} style={{ width: size, height: size }} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg bg-white border border-asf-border p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="40%" />
          <SkeletonLine width="25%" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine width="85%" />
      <Skeleton className="h-40 w-full rounded-md" />
    </div>
  );
}
