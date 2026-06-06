import type { Metadata } from "next";
import { Trophy, Users, Globe } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { getContentBatch } from "@/lib/cms/site-content";

/**
 * /about/mission. CMS keys: about_mission, about_vision,
 * about_goal_1/2/3. Editable from /admin/cms/about.
 */

export const metadata: Metadata = {
  title: "Mission and Vision",
  description:
    "Afghan Sports Federation mission, vision, and long-term goals. Building community through sports excellence since 1998.",
};

const GOAL_ICONS = [Users, Trophy, Globe];

export default async function MissionPage() {
  const c = await getContentBatch({
    about_mission:
      "We exist to give every Afghan in America a place to play, compete, and belong.",
    about_vision:
      "A national network of chapters, players, and supporters across the United States.",
    about_goal_1: "10,000 active members by 2030 across the United States.",
    about_goal_2: "Five regional chapters with full Afghan Cup qualifying pipelines.",
    about_goal_3: "International friendly tournaments with Afghan diaspora federations worldwide.",
  });

  const goals = [c.about_goal_1, c.about_goal_2, c.about_goal_3].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow="Mission and Vision"
        title="Why ASF exists, and where we are headed."
      />

      {/* Mission */}
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
          <SectionLabel>Mission</SectionLabel>
          <p className="mt-6 text-asf-text/90 text-lg leading-relaxed whitespace-pre-line">
            {c.about_mission}
          </p>
        </div>
      </section>

      {/* Vision */}
      <section className="w-full bg-white border-y border-asf-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
          <SectionLabel>Vision</SectionLabel>
          <p className="mt-6 text-asf-text/90 text-lg leading-relaxed whitespace-pre-line">
            {c.about_vision}
          </p>
        </div>
      </section>

      {/* Long-term goals */}
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
          <div className="mb-10">
            <SectionLabel>Long-term goals</SectionLabel>
            <h2 className="mt-4 font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight">
              Three things we are building toward.
            </h2>
          </div>
          <ol className="space-y-6">
            {goals.map((body, i) => {
              const Icon = GOAL_ICONS[i] ?? Users;
              return (
                <li
                  key={i}
                  className="grid gap-5 sm:grid-cols-[auto,auto,1fr] sm:items-start p-6 rounded-lg bg-white border border-asf-border"
                >
                  <span className="font-display font-black text-4xl text-asf-red leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="hidden sm:inline-flex w-10 h-10 rounded-full bg-asf-navy/5 items-center justify-center mt-1">
                    <Icon className="w-5 h-5 text-asf-navy" aria-hidden />
                  </span>
                  <p className="text-asf-text/85 leading-relaxed whitespace-pre-line">{body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
