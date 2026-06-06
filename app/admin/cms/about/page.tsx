import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { readAllContent, readFieldTranslations } from "../_helpers";

export const metadata = { title: "Admin: About" };

const FIELDS: CmsField[] = [
  { key: "about_story_title", label: "Story title", type: "text" },
  { key: "about_story_body", label: "Story body", type: "textarea", rows: 8 },
  { key: "about_mission", label: "Mission statement", type: "textarea", rows: 4 },
  { key: "about_vision", label: "Vision statement", type: "textarea", rows: 4 },
  { key: "about_goal_1", label: "Long-term goal 1", type: "textarea", rows: 2 },
  { key: "about_goal_2", label: "Long-term goal 2", type: "textarea", rows: 2 },
  { key: "about_goal_3", label: "Long-term goal 3", type: "textarea", rows: 2 },
  { key: "value_1_title", label: "Value 1 title", type: "text" },
  { key: "value_1_body", label: "Value 1 body", type: "textarea", rows: 2 },
  { key: "value_2_title", label: "Value 2 title", type: "text" },
  { key: "value_2_body", label: "Value 2 body", type: "textarea", rows: 2 },
  { key: "value_3_title", label: "Value 3 title", type: "text" },
  { key: "value_3_body", label: "Value 3 body", type: "textarea", rows: 2 },
  { key: "value_4_title", label: "Value 4 title", type: "text" },
  { key: "value_4_body", label: "Value 4 body", type: "textarea", rows: 2 },
];

export default async function AboutCmsPage() {
  const initial = await readAllContent();
  const translations = await readFieldTranslations(FIELDS.map((f) => f.key), initial);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <CmsEditor
        title="About Page"
        description="Story, mission, vision, four values, and three long-term goals."
        fields={FIELDS}
        initial={initial}
        translations={translations}
      />
    </div>
  );
}
