"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/shared/logo";

/**
 * HeroVideoCarousel. Two videos cycle every 8s. CMS values come from the
 * homepage server component via props (this is a client component for the
 * autoplay/cycle behavior, so it can't fetch directly).
 */

const VIDEOS = [
  "https://assets.mixkit.co/videos/43484/43484-720.mp4",
  "https://assets.mixkit.co/videos/43495/43495-720.mp4",
];
const CYCLE_MS = 8000;

type HeroProps = {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export function HeroVideoCarousel({
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
}: HeroProps) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    intervalRef.current = window.setInterval(() => {
      setActive((i) => (i + 1) % VIDEOS.length);
    }, CYCLE_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [reduceMotion]);

  return (
    <section
      className="relative w-full h-[80vh] min-h-[560px] max-h-[720px] overflow-hidden bg-asf-navy text-white"
      aria-label="Hero"
    >
      <div className="absolute inset-0" aria-hidden>
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{
              transform: `translateX(${(i - active) * 100}%)`,
            }}
          >
            <video
              src={src}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Soft top vignette + heavier bottom gradient so the lower-aligned
            title remains readable without putting a solid panel behind it.
            Per user feedback: "give it a transparent background for more visibility". */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.10) 30%, rgba(34,56,82,0.55) 70%, rgba(17,28,42,0.92) 100%)",
          }}
        />
      </div>

      {/* Content sits in the lower portion of the hero per user feedback */}
      <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-end text-center gap-5 pb-20 sm:pb-24">
        <Logo size={88} href={null} className="drop-shadow-2xl" />
        <p
          className="font-condensed font-bold text-[0.68rem] sm:text-sm tracking-[0.18em] sm:tracking-[0.32em] uppercase text-asf-gold"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >
          Est. 1998 . Northern Virginia
        </p>
        <h1
          className="font-display font-black text-3xl sm:text-5xl md:text-6xl leading-tight text-balance max-w-[21rem] sm:max-w-3xl text-white break-words"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
        >
          {title}
        </h1>
        <p
          className="max-w-[17.5rem] text-sm leading-relaxed text-white sm:max-w-2xl sm:text-lg"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
        >
          {subtitle}
        </p>
        <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-11 w-full max-w-[20rem] sm:w-auto px-6 rounded-md bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors shadow-lg"
          >
            {ctaPrimary}
          </Link>
          <Link
            href="/feed"
            className="inline-flex items-center justify-center h-11 w-full max-w-[20rem] sm:w-auto px-6 rounded-md border border-white/60 bg-white/10 backdrop-blur-sm text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-white/20 transition-colors"
          >
            {ctaSecondary}
          </Link>
        </div>
      </div>

      {/* Dot indicators (top-right since content is bottom-aligned) */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {VIDEOS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-7 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
