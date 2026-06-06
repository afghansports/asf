import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { GalleryGrid, type GalleryItem } from "./gallery-grid";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Afghan Sports Federation events, tournaments, and community days.",
};

export default async function GalleryPage() {
  if (!(await isFeatureEnabled("module.gallery"))) return <ModuleDisabled name="Gallery" />;
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_images")
    .select("id, image_url, caption, event_name, year")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  const items = (data ?? []) as GalleryItem[];

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="ASF photo gallery."
        subtitle="Highlights from past tournaments and community events. Click any image to open the lightbox."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <GalleryGrid items={items} />
        </div>
      </section>
    </>
  );
}
