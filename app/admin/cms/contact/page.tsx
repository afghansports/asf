import { CmsEditor, type CmsField } from "@/components/admin/cms-editor";
import { readAllContent, readFieldTranslations } from "../_helpers";

export const metadata = { title: "Admin: Contact" };

const FIELDS: CmsField[] = [
  { key: "contact_address", label: "Office address", type: "textarea", rows: 2 },
  { key: "contact_email", label: "Contact email", type: "text", placeholder: "agdcvakbl@gmail.com" },
  { key: "contact_phone", label: "Contact phone (optional)", type: "text" },
  { key: "contact_facebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/..." },
  { key: "contact_instagram", label: "Instagram URL", type: "url" },
  { key: "contact_twitter", label: "Twitter / X URL", type: "url" },
  { key: "contact_youtube", label: "YouTube URL", type: "url" },
];

export default async function ContactCmsPage() {
  const initial = await readAllContent();
  const translations = await readFieldTranslations(FIELDS.map((f) => f.key), initial);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <CmsEditor
        title="Contact Info"
        description="Address, email, phone, and social links shown in the footer and on /contact."
        fields={FIELDS}
        initial={initial}
        translations={translations}
      />
    </div>
  );
}
