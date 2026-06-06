import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, User as UserIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { createClient } from "@/lib/supabase/server";
import { getTeamCategories } from "@/lib/team/categories";
import { TeamDirectory } from "./team-directory";
import { getLocale, translateMany, isTranslatable } from "@/lib/i18n/translate";

/**
 * /about/team. Reads from `management_team` table. Editable from
 * /admin/team-members. Members are grouped dynamically by `category`: one
 * section per category from getTeamCategories() (admin-editable, falls back to
 * ['management','alumni']), plus any extra categories present in the data,
 * appended in first-seen order. Empty categories are skipped. Falls back to a
 * single TBC placeholder if there are no members at all.
 */

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  category: string;
};

export const metadata: Metadata = {
  title: "ASF Team",
  description:
    "The volunteer team behind the Afghan Sports Federation. The people who run ASF year-round.",
};

const FALLBACK: TeamMember[] = [
  {
    id: "tbc-1",
    name: "Name TBC",
    role: "Role TBC",
    bio: "Add team members from the admin panel.",
    photo_url: null,
    category: "management",
  },
];

export default async function TeamPage() {
  let members: TeamMember[] = FALLBACK;
  let categories: string[] = ["management", "alumni"];

  try {
    const supabase = await createClient();
    const [{ data }, cats] = await Promise.all([
      supabase
        .from("management_team")
        .select("id, name, role, bio, photo_url, category")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      getTeamCategories(),
    ]);
    if (data && data.length > 0) members = data as TeamMember[];
    categories = cats;
  } catch {
    // keep fallbacks
  }

  // Server-side translate the page for Dari/Pashto readers (cached; en passes
  // through). Covers the hero, the get-involved block, and each member's
  // role + bio. Names are left as-is (proper nouns). The category filter pills
  // inside TeamDirectory are handled by the client AutoTranslate layer.
  const S = {
    eyebrow: "ASF Team",
    title: "The team behind ASF.",
    subtitle:
      "ASF is volunteer-run. The people below organize tournaments, manage programs, and keep the federation alive.",
    giLabel: "Get involved",
    giTitle: "Interested in joining the team?",
    giBody:
      "ASF is always looking for volunteers, coaches, organizers, and chapter leads. Reach out and we will find the best fit.",
    giCta: "Contact ASF",
  };
  let t = S;
  let viewMembers = members;
  const locale = await getLocale();
  if (isTranslatable(locale)) {
    const keys = Object.keys(S) as (keyof typeof S)[];
    const staticVals = keys.map((k) => S[k]);
    const roles = members.map((m) => m.role ?? "");
    const bios = members.map((m) => m.bio ?? "");
    const tx = await translateMany([...staticVals, ...roles, ...bios], locale);
    t = Object.fromEntries(keys.map((k, i) => [k, tx[i] || S[k]])) as typeof S;
    const base = keys.length;
    const n = members.length;
    viewMembers = members.map((m, i) => ({
      ...m,
      role: tx[base + i] || m.role,
      bio: tx[base + n + i] || m.bio,
    }));
  }

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />

      <section className="w-full bg-asf-off">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
          <TeamDirectory members={viewMembers} categories={categories} />
        </div>
      </section>

      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center flex flex-col items-center gap-5">
          <span className="inline-flex w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 items-center justify-center">
            <UserIcon className="w-5 h-5" aria-hidden />
          </span>
          <SectionLabel className="text-asf-gold border-asf-gold">{t.giLabel}</SectionLabel>
          <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight text-balance">
            {t.giTitle}
          </h2>
          <p className="text-white/80 leading-relaxed max-w-xl">{t.giBody}</p>
          <Link
            href="/contact"
            className="mt-2 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
          >
            {t.giCta}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
