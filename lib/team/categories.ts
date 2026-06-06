import { createClient } from "@/lib/supabase/server";

/**
 * ASF Team categories. The list is admin-editable (Admin → Settings →
 * "ASF Team categories"), stored in `site_settings` under the
 * `team_categories` key as a comma-separated string in display order.
 *
 * Nothing here hardcodes a fixed enum: if the setting is missing, empty, or
 * the read fails, everything falls back to ['management', 'alumni'].
 */

const FALLBACK_CATEGORIES = ["management", "alumni"] as const;

export async function getTeamCategories(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "team_categories")
      .maybeSingle();

    if (error || !data) return [...FALLBACK_CATEGORIES];

    const raw = (data as { setting_value: string | null }).setting_value ?? "";
    const parsed = raw
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    return parsed.length > 0 ? parsed : [...FALLBACK_CATEGORIES];
  } catch {
    return [...FALLBACK_CATEGORIES];
  }
}

export function labelForCategory(c: string): string {
  if (!c) return "";
  return c
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
