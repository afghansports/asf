import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { readAllContent } from "../_helpers";

export const metadata = { title: "Admin: Homepage" };

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
  const initial = await readAllContent();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <CmsEditor
        title="Homepage Sections"
        description="About teaser, stats bar, and newsletter signup banner on the homepage."
        fields={FIELDS}
        initial={initial}
      />
    </div>
  );
}
