import { createClient } from "@/lib/supabase/server";
import { GeoAdmin, type DistrictRow } from "./geo-form";

export const metadata = { title: "Admin geo" };

export default async function AdminGeoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("geo_districts")
    .select("id, country_code, province_code, province_name, code, name, is_active")
    .order("country_code")
    .order("province_name")
    .order("name");
  const rows = (data ?? []) as DistrictRow[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Geo districts</h1>
        <p className="text-sm text-asf-muted mt-1">
          Add, rename, or hide districts. Used by reels, profiles, teams, and events for fine-grained location.
        </p>
      </div>
      <GeoAdmin rows={rows} />
    </div>
  );
}
