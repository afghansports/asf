import { createClient } from "@/lib/supabase/server";

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
