import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, User as UserIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { createClient } from "@/lib/supabase/server";
import { getTeamCategories, labelForCategory } from "@/lib/team/categories";
import { avatarSrc } from "@/lib/data/dicebear";

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

  // Build the display order: configured categories first, then any extra
  // categories found in the data (in first-seen order), so nothing is hidden.
  const order: string[] = [...categories];
  for (const m of members) {
    if (!order.includes(m.category)) order.push(m.category);
  }

  const groups = order
    .map((category) => ({
      category,
      members: members.filter((m) => m.category === category),
    }))
    .filter((g) => g.members.length > 0);

  return (
    <>
      <PageHero
        eyebrow="ASF Team"
        title="The team behind ASF."
        subtitle="ASF is volunteer-run. The people below organize tournaments, manage programs, and keep the federation alive."
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-14">
          {groups.length === 0 ? (
            <p className="text-asf-muted text-sm py-8 text-center">No team members yet.</p>
          ) : (
            groups.map((group) => (
              <div key={group.category}>
                <div className="mb-8">
                  <SectionLabel>{labelForCategory(group.category)}</SectionLabel>
                </div>
                <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {group.members.map((m) => (
                    <li key={m.id}>
                      <article className="flex flex-col h-full p-6 rounded-lg bg-white border border-asf-border">
                        <span className="relative inline-flex w-16 h-16 rounded-full overflow-hidden bg-asf-off-2 mb-4">
                          <Image
                            src={avatarSrc(m.photo_url, m.name)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </span>
                        <h3 className="font-display font-bold text-lg text-asf-text">{m.name}</h3>
                        <p className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red mt-1">
                          {m.role}
                        </p>
                        {m.bio ? (
                          <p className="text-sm text-asf-muted leading-relaxed mt-3 whitespace-pre-line">
                            {m.bio}
                          </p>
                        ) : null}
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
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
