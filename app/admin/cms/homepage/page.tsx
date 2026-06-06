import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { ModuleToggle } from "../../modules/module-toggle";
import { readAllContent, readFieldTranslations } from "../_helpers";

export const metadata = { title: "Admin: Homepage" };

/**
 * Homepage control panel. Each public homepage section can be shown/hidden via
 * its `home.*` feature flag (seeded in migration 028), and the copy for the
 * inline-editable sections is edited in the form below.
 */
const SECTIONS: { key: string; label: string; description: string; editHref?: string }[] = [
  { key: "home.hero", label: "Hero (video + headline)", description: "Top video hero with headline and CTA buttons.", editHref: "/admin/cms/hero" },
  { key: "home.afghan_cup", label: "Afghan Cup countdown banner", description: "Red banner with the countdown + “Register your team”.", editHref: "/admin/cms/afghancup" },
  { key: "home.stats", label: "Stats bar", description: "The four big numbers. Edit the values below.", editHref: "#homepage-copy" },
  { key: "home.about", label: "About teaser", description: "Short intro + bullet points. Edit the copy below.", editHref: "#homepage-copy" },
  { key: "home.sports", label: "Sports grid", description: "The five sport cards (presentational)." },
  { key: "home.upcoming_events", label: "Upcoming events", description: "Cards for the next published events.", editHref: "/admin/events" },
  { key: "home.scores_strip", label: "Scores strip", description: "Live & recent pro scores. Powered by the Scores feed." },
  { key: "home.gallery", label: "Gallery teaser", description: "Recent photos from the gallery.", editHref: "/admin/gallery" },
  { key: "home.newsletter", label: "Newsletter signup", description: "Email signup banner. Edit the copy below.", editHref: "#homepage-copy" },
  { key: "home.news", label: "News teaser", description: "Latest news headlines.", editHref: "/admin/news" },
];

const FIELDS: CmsField[] = [
  { key: "about_teaser_title", label: "About teaser title", type: "text" },
  { key: "about_teaser_body", label: "About teaser body", type: "textarea", rows: 5 },
  { key: "about_teaser_bullet_1", label: "Bullet 1", type: "text" },
  { key: "about_teaser_bullet_2", label: "Bullet 2", type: "text" },
  { key: "about_teaser_bullet_3", label: "Bullet 3", type: "text" },
  { key: "stat_1_number", label: "Stat 1 number", type: "text", placeholder: "26+" },
  { key: "stat_1_label", label: "Stat 1 label", type: "text", placeholder: "Years" },
  { key: "stat_2_number", label: "Stat 2 number", type: "text", placeholder: "1000+" },
  { key: "stat_2_label", label: "Stat 2 label", type: "text", placeholder: "Members" },
  { key: "stat_3_number", label: "Stat 3 number", type: "text", placeholder: "5" },
  { key: "stat_3_label", label: "Stat 3 label", type: "text", placeholder: "Sports" },
  { key: "stat_4_number", label: "Stat 4 number", type: "text", placeholder: "28+" },
  { key: "stat_4_label", label: "Stat 4 label", type: "text", placeholder: "Events" },
  { key: "newsletter_title", label: "Newsletter title", type: "text" },
  { key: "newsletter_subtitle", label: "Newsletter subtitle", type: "textarea", rows: 2 },
];

export default async function HomepageCmsPage() {
  const supabase = await createClient();
  const { data: flagRows } = await supabase
    .from("feature_flags")
    .select("key, is_enabled")
    .like("key", "home.%");
  const enabled = new Map((flagRows ?? []).map((r) => [r.key as string, r.is_enabled as boolean]));

  const initial = await readAllContent();
  const translations = await readFieldTranslations(FIELDS.map((f) => f.key), initial);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <header>
        <h1 className="font-display font-black text-3xl text-asf-text">Homepage</h1>
        <p className="text-sm text-asf-muted mt-1">
          Show, hide, and edit each section of the public homepage. Changes go live immediately.
        </p>
      </header>

      <div className="rounded-lg border border-asf-border bg-white">
        <div className="px-5 py-3 border-b border-asf-border">
          <p className="font-condensed font-bold text-[0.7rem] tracking-[0.22em] uppercase text-asf-muted">
            Sections — show / hide
          </p>
        </div>
        <ul className="divide-y divide-asf-border">
          {SECTIONS.map((s) => (
            <li key={s.key} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-asf-text">{s.label}</p>
                <p className="text-xs text-asf-muted mt-0.5">{s.description}</p>
                {s.editHref ? (
                  <Link
                    href={s.editHref}
                    className="inline-flex items-center gap-1 mt-1.5 text-[0.7rem] font-condensed font-bold tracking-[0.16em] uppercase text-asf-red hover:underline"
                  >
                    Edit <ArrowUpRight className="w-3 h-3" aria-hidden />
                  </Link>
                ) : null}
              </div>
              <ModuleToggle flagKey={s.key} initialEnabled={enabled.get(s.key) ?? true} />
            </li>
          ))}
        </ul>
      </div>

      <div id="homepage-copy" className="scroll-mt-20">
        <CmsEditor
          title="Homepage copy"
          description="About teaser, stats bar numbers, and the newsletter banner text."
          fields={FIELDS}
          initial={initial}
        translations={translations}
        />
      </div>
    </div>
  );
}
