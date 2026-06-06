import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { readAllContent, readFieldTranslations } from "../_helpers";

export const metadata = { title: "Admin: Hero" };

const FIELDS: CmsField[] = [
  { key: "hero_title", label: "Hero title", type: "text", placeholder: "Afghan Sports Federation" },
  { key: "hero_subtitle", label: "Hero subtitle", type: "text", placeholder: "Building community since 1998" },
  { key: "hero_cta_primary", label: "Primary CTA button", type: "text", placeholder: "Join the Community" },
  { key: "hero_cta_secondary", label: "Secondary CTA button", type: "text", placeholder: "View Events" },
];

export default async function HeroCmsPage() {
  const initial = await readAllContent();
  const translations = await readFieldTranslations(FIELDS.map((f) => f.key), initial);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <CmsEditor
        title="Hero Section"
        description="The video carousel at the top of the homepage."
        fields={FIELDS}
        initial={initial}
        translations={translations}
      />
    </div>
  );
}
