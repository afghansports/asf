"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ASF Logo. Default UI is the navy circle + ASF text. After mount, we preload
 * /asf-logo-round.png in a detached Image() — if it loads, we swap to the
 * real image. If it 404s (file not yet saved by ASF leadership), we stay on
 * the navy fallback. This prevents the browser's ugly broken-image icon.
 *
 * The PNG should have a transparent background. Once saved at
 * /public/asf-logo-round.png and the page reloaded, the real logo appears
 * everywhere automatically.
 */

type LogoProps = {
  size?: number;
  withText?: boolean;
  textVariant?: "navy" | "white";
  className?: string;
  href?: string | null;
  textClassName?: string;
};

const SRC = "/asf-logo-round.png";

// Module-scoped so a single check covers every Logo instance on the page.
let cachedStatus: "ok" | "missing" | null = null;
const listeners = new Set<(s: "ok" | "missing") => void>();

function ensureLoaded() {
  if (cachedStatus !== null) return;
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.onload = () => {
    cachedStatus = "ok";
    listeners.forEach((l) => l("ok"));
  };
  img.onerror = () => {
    cachedStatus = "missing";
    listeners.forEach((l) => l("missing"));
  };
  img.src = SRC;
}

export function Logo({
  size = 36,
  withText = false,
  textVariant = "navy",
  className,
  href = "/",
  textClassName,
}: LogoProps) {
  const [status, setStatus] = useState<"ok" | "missing" | null>(cachedStatus);

  useEffect(() => {
    if (cachedStatus !== null) {
      setStatus(cachedStatus);
      return;
    }
    const sub = (s: "ok" | "missing") => setStatus(s);
    listeners.add(sub);
    ensureLoaded();
    return () => {
      listeners.delete(sub);
    };
  }, []);

  const dim = `${size}px`;
  const fontSize = size <= 32 ? "0.65rem" : size <= 48 ? "0.85rem" : "1.05rem";

  const fallback = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-asf-navy text-white font-condensed font-bold tracking-[0.12em] shrink-0 shadow-sm",
        className
      )}
      style={{ width: dim, height: dim, fontSize }}
      aria-hidden
    >
      ASF
    </span>
  );

  const real = (
    <Image
      src={SRC}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain select-none", className)}
      style={{ width: dim, height: dim }}
      draggable={false}
      aria-hidden
      unoptimized
    />
  );

  const badge = status === "ok" ? real : fallback;

  const wordmark = withText ? (
    <span
      className={cn(
        "font-condensed font-bold text-[0.72rem] tracking-[0.2em] uppercase whitespace-nowrap",
        textVariant === "white" ? "text-white" : "text-asf-text",
        textClassName
      )}
    >
      Afghan Sports Federation
    </span>
  ) : null;

  const inner = (
    <span className="inline-flex items-center gap-3">
      {badge}
      {wordmark}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} aria-label="Afghan Sports Federation home" className="inline-flex items-center">
      {inner}
    </Link>
  );
}
