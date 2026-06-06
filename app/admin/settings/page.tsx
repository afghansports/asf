import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Admin settings" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("setting_key, setting_value, setting_type, label, group_name")
    .order("group_name", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <header className="mb-8">
        <h1 className="font-display font-black text-3xl text-asf-text">Site settings</h1>
        <p className="text-sm text-asf-muted mt-1">
          Toggles and structured config. Each group saves independently.
        </p>
      </header>
      <SettingsForm initial={(data ?? []) as Parameters<typeof SettingsForm>[0]["initial"]} />
    </div>
  );
}
