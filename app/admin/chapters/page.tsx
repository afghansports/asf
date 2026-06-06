import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChaptersAdmin, type ChapterRow } from "./chapters-admin";

export const metadata = { title: "Admin chapters" };

export default async function AdminChaptersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("chapters")
    .select(
      "id, slug, name, description, country_code, state_province, city, manager_id, founded_year, is_active, member_count, team_count, logo_url, banner_url"
    )
    .order("name");
  const rows = (data ?? []) as ChapterRow[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Chapters</h1>
        <p className="text-sm text-asf-muted mt-1">Add a new chapter, assign a chapter manager, upload a logo + banner, and toggle active status.</p>
      </div>
      <ChaptersAdmin rows={rows} userId={user.id} />
    </div>
  );
}
