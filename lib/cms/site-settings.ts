import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * site_settings is structured config (toggles, dates, group-keyed). Same
 * cached read pattern as site-content.
 */

export const getSettingsMap = cache(async (): Promise<Map<string, string>> => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_key, setting_value");
    if (error) {
      console.warn("[cms/site-settings] read failed:", error.message);
      return new Map();
    }
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const key = (row as { setting_key: string }).setting_key;
      const value = (row as { setting_value: string | null }).setting_value;
      if (key) map.set(key, value ?? "");
    }
    return map;
  } catch (e) {
    console.warn("[cms/site-settings] unexpected:", e);
    return new Map();
  }
});

export async function getSetting(key: string, fallback: string): Promise<string> {
  const map = await getSettingsMap();
  const v = map.get(key);
  return v && v.trim() ? v : fallback;
}

export async function getSettingBool(key: string, fallback = false): Promise<boolean> {
  const v = (await getSettingsMap()).get(key);
  if (v === undefined) return fallback;
  return v === "true" || v === "1" || v === "on";
}
