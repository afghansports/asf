import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * site_content is the CMS key/value store. Every visible string on the public
 * site reads from here, with a hardcoded fallback so a missing key never
 * breaks rendering.
 *
 * `cache()` dedupes per request: many components on one page can call
 * `getContentMap()` and only one DB query fires.
 */

export const getContentMap = cache(async (): Promise<Map<string, string>> => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("content_key, content_value");
    if (error) {
      console.warn("[cms/site-content] read failed:", error.message);
      return new Map();
    }
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const key = (row as { content_key: string }).content_key;
      const value = (row as { content_value: string | null }).content_value;
      if (key) map.set(key, value ?? "");
    }
    return map;
  } catch (e) {
    console.warn("[cms/site-content] unexpected:", e);
    return new Map();
  }
});

/**
 * Fetch a single content key with a hardcoded fallback. Use this anywhere a
 * component renders a string from the CMS.
 *
 * @example
 *   const title = await getContent("hero_title", "Afghan Sports Federation");
 */
export async function getContent(key: string, fallback: string): Promise<string> {
  const map = await getContentMap();
  const v = map.get(key);
  return v && v.trim() ? v : fallback;
}

/**
 * Fetch many keys at once and return a Record. Each entry uses the fallback
 * if the key is missing or blank.
 *
 * @example
 *   const c = await getContentBatch({
 *     hero_title: "Afghan Sports Federation",
 *     hero_subtitle: "Building community since 1998",
 *   });
 *   // c.hero_title, c.hero_subtitle
 */
export async function getContentBatch<T extends Record<string, string>>(
  defaults: T
): Promise<T> {
  const map = await getContentMap();
  const out = { ...defaults } as Record<string, string>;
  for (const k of Object.keys(defaults)) {
    const v = map.get(k);
    if (v && v.trim()) out[k] = v;
  }
  return out as T;
}
