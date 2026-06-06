import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Verified badge — blue checkmark for `verified` users (known athletes /
 * coaches / public figures), gold checkmark for `official` accounts (ASF
 * staff / chapters). Renders nothing for `unverified`.
 */
export function VerifiedBadge({
  status,
  className,
}: {
  status: "unverified" | "verified" | "official" | string | null | undefined;
  className?: string;
}) {
  if (status !== "verified" && status !== "official") return null;
  const tone = status === "official" ? "text-asf-gold" : "text-blue-500";
  const title = status === "official" ? "Official account" : "Verified";
  return (
    <CheckCircle2
      className={cn("inline-block w-4 h-4 fill-current", tone, className)}
      aria-label={title}
      role="img"
    />
  );
}
