import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { readAllContent } from "../_helpers";

export const metadata = { title: "Admin: Afghan Cup" };

const FIELDS: CmsField[] = [
  { key: "cup_banner_title", label: "Cup banner title", type: "text", placeholder: "Afghan Cup 2026" },
  { key: "cup_banner_cta", label: "Cup banner CTA button", type: "text", placeholder: "Register Your Team" },
  {
    key: "cup_date",
    label: "Cup date (ISO timestamp)",
    type: "text",
    placeholder: "2026-07-02T09:00:00Z",
    hint: "Used by the homepage countdown. Format: YYYY-MM-DDTHH:mm:ssZ (UTC).",
  },
  { key: "cup_location", label: "Cup location", type: "text", placeholder: "Northern Virginia" },
  { key: "cup_registration_opens", label: "Registration opens", type: "text", placeholder: "April 1, 2026" },
  { key: "cup_registration_closes", label: "Registration closes", type: "text", placeholder: "June 15, 2026" },
  { key: "cup_eligibility", label: "Eligibility rules", type: "textarea", rows: 5 },
];

export default async function AfghanCupCmsPage() {
  const initial = await readAllContent();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <CmsEditor
        title="Afghan Cup Settings"
        description="Banner, date, location, and registration window. The homepage countdown reads cup_date."
        fields={FIELDS}
        initial={initial}
      />
    </div>
  );
}
