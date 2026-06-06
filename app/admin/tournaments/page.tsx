import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TournamentsAdmin, type TournamentRow } from "./tournaments-admin";

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Tournaments</h1>
        <p className="text-sm text-asf-muted mt-1">Create tournaments, upload a banner, publish, feature, or remove.</p>
      </div>
      <TournamentsAdmin rows={rows} userId={user.id} />
    </div>
  );
}
