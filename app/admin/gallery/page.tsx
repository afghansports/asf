import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GalleryAdmin } from "./gallery-admin";

export const metadata = { title: "Admin gallery" };

export default async function AdminGalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("gallery_images")
    .select("id, image_url, caption, event_name, year, sort_order, is_published")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display font-black text-3xl text-asf-text mb-6">Gallery</h1>
      <GalleryAdmin items={rows ?? []} userId={user.id} />
    </div>
  );
}
