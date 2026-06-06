import { createClient } from "@/lib/supabase/server";
import { getCachedTranslations } from "@/lib/i18n/translate";

/**
 * Server helper for admin CMS pages: fetch every site_content row and return
 * a key -> value map. Each page passes the keys it needs to CmsEditor.
 */
export async function readAllContent(): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_content")
      .select("content_key, content_value");
    const out: Record<string, string> = {};
    for (const row of data ?? []) {
      const k = (row as { content_key: string }).content_key;
      const v = (row as { content_value: string | null }).content_value;
      if (k) out[k] = v ?? "";
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Existing Dari + Pashto translations for a set of CMS fields, keyed by field
 * key, for pre-filling the CmsEditor's language tabs. Cache-only (no Azure):
 * shows manual overrides / already-cached machine translations, blank otherwise.
 */
export async function readFieldTranslations(
  keys: string[],
  initial: Record<string, string>,
): Promise<{ "fa-AF": Record<string, string>; ps: Record<string, string> }> {
  const texts = keys.map((k) => initial[k] ?? "").filter(Boolean);
  const [fa, ps] = await Promise.all([
    getCachedTranslations(texts, "fa-AF"),
    getCachedTranslations(texts, "ps"),
  ]);
  const out = { "fa-AF": {} as Record<string, string>, ps: {} as Record<string, string> };
  for (const k of keys) {
    const src = initial[k] ?? "";
    out["fa-AF"][k] = src ? fa[src] ?? "" : "";
    out.ps[k] = src ? ps[src] ?? "" : "";
  }
  return out;
}
