import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { readAllContent } from "../_helpers";

export const metadata = { title: "Admin: Footer" };

const FIELDS: CmsField[] = [
  { key: "footer_description", label: "Footer description", type: "textarea", rows: 4 },
  { key: "footer_copyright", label: "Footer copyright", type: "text", placeholder: "2026 Afghan Sports Federation. All rights reserved." },
];

export default async function FooterCmsPage() {
  const initial = await readAllContent();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <CmsEditor
        title="Footer"
        description="Description and copyright text in the site footer. Social and email come from Contact Info."
        fields={FIELDS}
        initial={initial}
      />
    </div>
  );
}
