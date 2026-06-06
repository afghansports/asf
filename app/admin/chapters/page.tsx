import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChaptersAdmin, type ChapterRow } from "./chapters-admin";
import { ModuleToggle } from "../modules/module-toggle";
import { isFeatureEnabled } from "@/lib/features/flags";

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

  const moduleEnabled = await isFeatureEnabled("module.chapters");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text">Chapters</h1>
          <p className="text-sm text-asf-muted mt-1">Add a new chapter, assign a chapter manager, upload a logo + banner, and toggle active status.</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
            Show on site
          </span>
          <ModuleToggle flagKey="module.chapters" initialEnabled={moduleEnabled} />
        </div>
      </div>
      <ChaptersAdmin rows={rows} userId={user.id} />
    </div>
  );
}
