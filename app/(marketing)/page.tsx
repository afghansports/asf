import type { Metadata } from "next";
import { HeroVideoCarousel } from "@/components/feature/hero-video-carousel";
import { AfghanCupBanner } from "@/components/feature/afghan-cup-banner";
import { StatsBar } from "@/components/feature/stats-bar";
import { AboutTeaser } from "@/components/feature/about-teaser";
import { SportsGrid } from "@/components/feature/sports-grid";
import { UpcomingEvents } from "@/components/feature/upcoming-events";
import { GalleryTeaser } from "@/components/feature/gallery-teaser";
import { NewsletterSection } from "@/components/feature/newsletter-section";
import { NewsTeaser } from "@/components/feature/news-teaser";
import { ScoresStrip } from "@/components/feature/scores-strip";
import { getContentBatch } from "@/lib/cms/site-content";

/**
 * ASF homepage. Server Components fetch CMS values; the client-only
 * HeroVideoCarousel receives them as props.
 */

export const metadata: Metadata = {
  title: "Home",
  description:
    "Afghan Sports Federation. Soccer, basketball, volleyball, bowling, and table tennis programs across the United States. Afghan Cup 2026 incoming.",
};

export default async function HomePage() {
  const c = await getContentBatch({
    hero_title: "Afghan Sports Federation",
    hero_subtitle: "Building community through sports excellence since 1998",
    hero_cta_primary: "Join the Community",
    hero_cta_secondary: "View Events",
  });

  return (
    <>
      <HeroVideoCarousel
        title={c.hero_title}
        subtitle={c.hero_subtitle}
        ctaPrimary={c.hero_cta_primary}
        ctaSecondary={c.hero_cta_secondary}
      />
      <AfghanCupBanner />
      <StatsBar />
      <AboutTeaser />
      <SportsGrid />
      <UpcomingEvents />
      <ScoresStrip />
      <GalleryTeaser />
      <NewsletterSection />
      <NewsTeaser />
    </>
  );
}
