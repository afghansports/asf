import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TournamentsAdmin, type TournamentRow } from "./tournaments-admin";
import { ModuleToggle } from "../modules/module-toggle";
import { isFeatureEnabled } from "@/lib/features/flags";

export const metadata = { title: "Admin tournaments" };

export default async function AdminTournamentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("tournaments")
    .select(
      "id, slug, name, sport, format, description, start_date, end_date, city, state_province, status, is_published, is_featured, banner_url"
    )
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as TournamentRow[];

  const moduleEnabled = await isFeatureEnabled("module.tournaments");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text">Tournaments</h1>
          <p className="text-sm text-asf-muted mt-1">Create tournaments, upload a banner, publish, feature, or remove.</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
            Show on site
          </span>
          <ModuleToggle flagKey="module.tournaments" initialEnabled={moduleEnabled} />
        </div>
      </div>
      <TournamentsAdmin rows={rows} userId={user.id} />
    </div>
  );
}
