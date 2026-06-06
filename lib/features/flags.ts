/**
 * Feature flag reader. Backed by the `feature_flags` table — admin-toggleable
 * from /admin/modules. Cached for 60s per request via React's `cache()` to
 * avoid hammering Postgres on every component render.
 *
 * Usage (server component):
 *   const enabled = await isFeatureEnabled("module.reels");
 *   if (!enabled) return <ModuleDisabled name="Reels" />;
 *
 *   // or fetch many at once
 *   const flags = await getFlags(["module.reels", "module.polls"]);
 *   if (!flags["module.reels"]) ...
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type FeatureFlag = {
  key: string;
  label: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  default_value: boolean;
  rollout_percent: number;
};

/** Read every flag once per request. */
export const getAllFlags = cache(async (): Promise<Record<string, FeatureFlag>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, label, description, category, is_enabled, default_value, rollout_percent");
    if (error || !data) return {};
    return Object.fromEntries(data.map((f) => [f.key, f as FeatureFlag]));
  } catch {
    return {};
  }
});

/** Resolve a single flag. Defaults to `true` if the row is missing — modules
 *  ship enabled unless the admin opts out. */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getAllFlags();
  const f = flags[key];
  if (!f) return true;
  return f.is_enabled;
}

/** Resolve many at once. */
export async function getFlags(keys: string[]): Promise<Record<string, boolean>> {
  const flags = await getAllFlags();
  return Object.fromEntries(
    keys.map((k) => [k, flags[k] ? flags[k].is_enabled : true]),
  );
}
