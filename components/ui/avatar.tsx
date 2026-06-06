import Image from "next/image";
import { cn } from "@/lib/utils";
import { cdnUrl } from "@/lib/cdn/cloudflare";

/**
 * <Avatar> — single source of truth for circular user/team imagery.
 *
 * Replaces 50+ inline reimplementations of
 *   <span className="relative inline-flex w-X h-X rounded-full ..."> +
 *   {url ? <Image ...> : <span>initial</span>}
 *
 * sizes are intentionally limited (xs/sm/md/lg/xl). If you need a custom
 * size, prefer a new variant over an arbitrary value.
 */
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_PX: Record<Size, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  "2xl": 112,
};

const TEXT_SIZE: Record<Size, string> = {
  xs: "text-[0.55rem]",
  sm: "text-[0.65rem]",
  md: "text-xs",
  lg: "text-base",
  xl: "text-xl",
  "2xl": "text-3xl",
};

const RING: Record<NonNullable<AvatarProps["ring"]>, string> = {
  none: "",
  thin: "ring-2 ring-white",
  thick: "ring-4 ring-white shadow-md",
};

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: Size;
  /** Decorative ring for emphasis (e.g., active story-style border). */
  ring?: "none" | "thin" | "thick";
  className?: string;
};

export function Avatar({ src, name, size = "md", ring = "none", className }: AvatarProps) {
  const px = SIZE_PX[size];
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-asf-navy text-white font-condensed font-bold",
        TEXT_SIZE[size],
        RING[ring],
        className,
      )}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image
          src={cdnUrl(src)}
          alt=""
          fill
          sizes={`${px}px`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}

/** Overlapping cluster — e.g., "+3 from your team". */
export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
  className,
}: {
  users: { src?: string | null; name?: string | null }[];
  max?: number;
  size?: Size;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;
  return (
    <div className={cn("inline-flex -space-x-2", className)}>
      {shown.map((u, i) => (
        <Avatar key={i} src={u.src} name={u.name} size={size} ring="thin" />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-asf-off-2 text-asf-text ring-2 ring-white font-condensed font-bold",
            TEXT_SIZE[size],
          )}
          style={{ width: SIZE_PX[size], height: SIZE_PX[size] }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
