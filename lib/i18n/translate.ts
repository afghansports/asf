import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Server-side AI translation for user/admin content via Azure Translator
 * (Text Translation API v3), with a Postgres cache (content_translations).
 *
 * Pattern: translate-on-read. A Dari/Pashto reader's first view of a string
 * calls Azure and caches the result keyed by sha256(source) + locale; later
 * views (anyone) hit the cache. Editing the source changes the hash, so it
 * re-translates automatically. English (or any unconfigured locale) and any
 * failure fall back to the original text — translation never breaks a page.
 *
 * `import "server-only"` guarantees the API key never reaches the client bundle.
 */

const ENDPOINT = (
  process.env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com"
).replace(/\/$/, "");
const KEY = process.env.AZURE_TRANSLATOR_KEY;
const REGION = process.env.AZURE_TRANSLATOR_REGION;

/** App locale code -> Azure Translator code. `en` is the source (untranslated). */
const AZURE_CODE: Record<string, string> = { "fa-AF": "prs", ps: "ps" };

export const LOCALE_COOKIE = "asf_locale";
const MAX_BATCH = 90; // Azure caps at 1000 items / 50k chars per request; stay well under.

/** Active locale from the `asf_locale` cookie (server-side). */
export async function getLocale(): Promise<string> {
  try {
    const c = await cookies();
    return c.get(LOCALE_COOKIE)?.value || "en";
  } catch {
    return "en";
  }
}

/** True if the locale is one we machine-translate into. */
export function isTranslatable(locale: string): boolean {
  return !!AZURE_CODE[locale];
}

function sha(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function azureTranslateBatch(texts: string[], to: string): Promise<string[]> {
  if (!KEY || !REGION) throw new Error("Azure Translator not configured (missing key/region).");
  const url = `${ENDPOINT}/translate?api-version=3.0&to=${to}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": KEY,
      "Ocp-Apim-Subscription-Region": REGION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(texts.map((Text) => ({ Text }))),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Azure translate HTTP ${res.status}`);
  const data = (await res.json()) as { translations: { text: string }[] }[];
  return data.map((d) => d.translations?.[0]?.text ?? "");
}

/**
 * Translate many strings into `locale`, using the content_translations cache.
 * Returns an array aligned 1:1 with the input. Never throws — on any problem it
 * returns the original strings.
 */
export async function translateMany(texts: (string | null | undefined)[], locale: string): Promise<string[]> {
  const cleaned = texts.map((t) => (typeof t === "string" ? t : ""));
  const code = AZURE_CODE[locale];
  if (!code) return cleaned;
  if (!cleaned.some((t) => t.trim())) return cleaned;

  try {
    const sb = createServiceClient();
    const hashes = cleaned.map((t) => (t.trim() ? sha(t) : ""));
    const uniqueHashes = Array.from(new Set(hashes.filter(Boolean)));

    const { data: cached } = await sb
      .from("content_translations")
      .select("source_hash, translated_text")
      .eq("target_locale", locale)
      .in("source_hash", uniqueHashes);
    const map = new Map<string, string>(
      (cached ?? []).map((r) => [r.source_hash as string, r.translated_text as string]),
    );

    // Unique source texts still needing translation.
    const missByHash = new Map<string, string>();
    cleaned.forEach((t, i) => {
      if (t.trim() && !map.has(hashes[i])) missByHash.set(hashes[i], t);
    });

    if (missByHash.size) {
      const missHashes = Array.from(missByHash.keys());
      for (let i = 0; i < missHashes.length; i += MAX_BATCH) {
        const chunkHashes = missHashes.slice(i, i + MAX_BATCH);
        const chunkTexts = chunkHashes.map((h) => missByHash.get(h)!);
        const translated = await azureTranslateBatch(chunkTexts, code);
        const rows = chunkHashes.map((h, k) => ({
          source_hash: h,
          target_locale: locale,
          source_text: chunkTexts[k],
          translated_text: translated[k] || chunkTexts[k],
        }));
        await sb.from("content_translations").upsert(rows, { onConflict: "source_hash,target_locale" });
        rows.forEach((r) => map.set(r.source_hash, r.translated_text));
      }
    }

    return cleaned.map((t, i) => (t.trim() ? map.get(hashes[i]) ?? t : t));
  } catch (e) {
    console.error("[i18n/translate] falling back to source:", (e as Error).message);
    return cleaned;
  }
}

/** Translate a single string into `locale` (cached). Falls back to the input. */
export async function translateText(text: string | null | undefined, locale: string): Promise<string> {
  if (!text || !text.trim() || !AZURE_CODE[locale]) return text ?? "";
  const [out] = await translateMany([text], locale);
  return out;
}

/**
 * Translate every string value of an object for the active locale (cached),
 * returning a same-shaped object. Reads the cookie if `locale` is omitted.
 * Convenient for server components: `const c = await tObject({ title, body })`.
 */
export async function tObject<T extends Record<string, string>>(obj: T, locale?: string): Promise<T> {
  const loc = locale ?? (await getLocale());
  if (!isTranslatable(loc)) return obj;
  const keys = Object.keys(obj);
  const tx = await translateMany(keys.map((k) => obj[k]), loc);
  return Object.fromEntries(keys.map((k, i) => [k, tx[i] || obj[k]])) as T;
}
