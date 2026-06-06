import Link from "next/link";
import { Trophy, MapPin, ArrowRight } from "lucide-react";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { getContentBatch } from "@/lib/cms/site-content";

/**
 * AfghanCupBanner. Per ASF_CLAUDE_CODE_PROMPT.md > TASK 5 + Afghan Cup CMS.
 *
 * Reads cup_banner_title, cup_banner_cta, cup_date, cup_location from
 * site_content. All editable from /admin/cms/afghancup.
 */
export async function AfghanCupBanner() {
  const c = await getContentBatch({
    cup_banner_title: "Afghan Cup 2026",
    cup_banner_cta: "Register Your Team",
    cup_date: "2026-07-02T09:00:00Z",
    cup_location: "Northern Virginia",
  });

  return (
    <section
      aria-label="Afghan Cup countdown"
      className="relative w-full bg-asf-red text-white overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 12px)",
        }}
        aria-hidden
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start sm:items-center gap-4">
          <span className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 ring-1 ring-white/30 items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-condensed font-bold text-[0.7rem] tracking-[0.28em] uppercase text-white/70">
              28th Edition
            </p>
            <p className="font-condensed font-bold text-2xl sm:text-3xl tracking-wide leading-none">
              {c.cup_banner_title}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/85">
              <MapPin className="w-3.5 h-3.5" aria-hidden />
              <span>{c.cup_location}</span>
            </p>
          </div>
        </div>

        <CountdownTimer
          targetDate={c.cup_date}
          variant="dark"
          className="self-start lg:self-center"
        />

        <Link
          href="/events"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-asf-navy text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-navy-light transition-colors self-start lg:self-center"
        >
          {c.cup_banner_cta}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
