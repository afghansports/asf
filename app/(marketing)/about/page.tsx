import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Target, Users, Shield } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { Logo } from "@/components/shared/logo";
import { getContentBatch } from "@/lib/cms/site-content";

/**
 * /about. CMS keys: about_story_title, about_story_body, about_mission,
 * about_vision, value_1_title/body through value_4_title/body. Editable from
 * /admin/cms/about.
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "Afghan Sports Federation: a non-profit founded in 1998 in Northern Virginia, building community through five sports across the United States.",
};

const VALUE_ICONS = [Users, Target, Heart, Shield];

const SUB_PAGES = [
  { href: "/about/mission", label: "Mission and Vision" },
  { href: "/about/history", label: "History" },
];

export default async function AboutPage() {
  const c = await getContentBatch({
    about_story_title: "Our Story",
    about_story_body:
      "ASF began as a small group of friends organizing pick-up soccer matches in Northern Virginia. Today the federation runs leagues, camps, and tournaments coast to coast, with Afghan Cup 2026 marking the 28th edition.",
    about_mission:
      "We exist to give every Afghan in America a place to play, compete, and belong.",
    about_vision:
      "ASF is building a national network of chapters, players, and supporters.",
    value_1_title: "Community",
    value_1_body: "Players, families, volunteers. Everyone has a place at ASF.",
    value_2_title: "Excellence",
    value_2_body: "Competitive programs that push players. Honest standards on and off the field.",
    value_3_title: "Inclusivity",
    value_3_body: "Open to every Afghan and friend of the community. Five sports, all ages.",
    value_4_title: "Integrity",
    value_4_body: "Volunteer-run, transparent, and accountable to the people we serve.",
  });

  const values = [
    { title: c.value_1_title, body: c.value_1_body },
    { title: c.value_2_title, body: c.value_2_body },
    { title: c.value_3_title, body: c.value_3_body },
    { title: c.value_4_title, body: c.value_4_body },
  ];

  return (
    <>
      <PageHero
        eyebrow="About ASF"
        title="A federation built by the community, for the community."
        subtitle="Founded in 1998 in the Washington D.C. metro area, the Afghan Sports Federation is a non-profit organization. We run year-round programs in five sports and host the Afghan Cup."
      />

      {/* Story */}
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-5">
            <SectionLabel>Our story</SectionLabel>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight text-balance">
              {c.about_story_title}
            </h2>
            <div className="text-asf-text/85 leading-relaxed whitespace-pre-line">
              {c.about_story_body}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-lg bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 14px)",
                }}
                aria-hidden
              />
              <Logo size={180} href={null} className="relative shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission + Vision cards */}
      <section className="w-full bg-white border-y border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 grid gap-6 md:grid-cols-2">
          <article className="rounded-lg p-8 sm:p-10 bg-asf-navy text-white">
            <SectionLabel className="text-asf-gold border-asf-gold">Mission</SectionLabel>
            <p className="mt-4 text-white/90 text-lg leading-relaxed whitespace-pre-line">
              {c.about_mission}
            </p>
          </article>
          <article className="rounded-lg p-8 sm:p-10 bg-asf-red text-white">
            <SectionLabel className="text-white border-white">Vision</SectionLabel>
            <p className="mt-4 text-white/95 text-lg leading-relaxed whitespace-pre-line">
              {c.about_vision}
            </p>
          </article>
        </div>
      </section>

      {/* Values */}
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
          <div className="text-center mb-12 flex flex-col items-center gap-3">
            <SectionLabel>What we stand for</SectionLabel>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight">
              Four values, every day.
            </h2>
          </div>
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => {
              const Icon = VALUE_ICONS[i];
              return (
                <li
                  key={v.title}
                  className="flex flex-col gap-3 p-6 rounded-lg bg-white border border-asf-border"
                >
                  <span className="inline-flex w-10 h-10 rounded-full bg-asf-red/10 items-center justify-center">
                    <Icon className="w-5 h-5 text-asf-red" aria-hidden />
                  </span>
                  <h3 className="font-display font-bold text-lg text-asf-text">{v.title}</h3>
                  <p className="text-sm text-asf-muted leading-relaxed">{v.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Sub-page nav */}
      <section className="w-full bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
          <div className="text-center mb-10 flex flex-col items-center gap-3">
            <SectionLabel>Read more</SectionLabel>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-asf-text leading-tight">
              Explore the federation.
            </h2>
          </div>
          <ul className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {SUB_PAGES.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="group flex items-center justify-between p-6 rounded-lg bg-asf-off hover:bg-asf-navy hover:text-white transition-colors"
                >
                  <span className="font-condensed font-bold text-base tracking-wider uppercase text-asf-text group-hover:text-white">
                    {p.label}
                  </span>
                  <ArrowRight className="w-5 h-5 text-asf-red group-hover:text-asf-gold" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
