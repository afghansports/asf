import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When true, renders inline with no centering or padding (for use inside buttons). */
  inline?: boolean;
}

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
} as const;

export function LoadingSpinner({
  size = "md",
  className,
  inline = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn("animate-spin text-asf-red", SIZE_MAP[size], className)}
      aria-label="Loading"
    />
  );
  if (inline) return spinner;
  return <div className="flex items-center justify-center py-8">{spinner}</div>;
}
