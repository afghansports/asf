import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, User as UserIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { TeamFilterPills, type TeamMember } from "./filter-pills";
import { createClient } from "@/lib/supabase/server";

/**
 * /about/team. Reads from `management_team` table. Editable from
 * /admin/team-members. Falls back to a single TBC placeholder if empty.
 */

export const metadata: Metadata = {
  title: "Management Team",
  description:
    "The volunteer team behind the Afghan Sports Federation. Board members and program volunteers who run ASF year-round.",
};

const FALLBACK: TeamMember[] = [
  {
    id: "tbc-1",
    name: "Name TBC",
    role: "Role TBC",
    bio: "Add team members from the admin panel.",
    photo_url: null,
    category: "board",
  },
];

export default async function TeamPage() {
  let members: TeamMember[] = FALLBACK;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("management_team")
      .select("id, name, role, bio, photo_url, category")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) members = data as TeamMember[];
  } catch {
    // keep fallback
  }

  return (
    <>
      <PageHero
        eyebrow="Management Team"
        title="The team behind ASF."
        subtitle="ASF is volunteer-run. The people below organize tournaments, manage programs, and keep the federation alive."
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
          <div className="mb-8">
            <SectionLabel>Members</SectionLabel>
          </div>
          <TeamFilterPills members={members} />
        </div>
      </section>

      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center flex flex-col items-center gap-5">
          <span className="inline-flex w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 items-center justify-center">
            <UserIcon className="w-5 h-5" aria-hidden />
          </span>
          <SectionLabel className="text-asf-gold border-asf-gold">Get involved</SectionLabel>
          <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight text-balance">
            Interested in joining the team?
          </h2>
          <p className="text-white/80 leading-relaxed max-w-xl">
            ASF is always looking for volunteers, coaches, organizers, and chapter leads. Reach
            out and we will find the best fit.
          </p>
          <Link
            href="/contact"
            className="mt-2 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
          >
            Contact ASF
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
