/**
 * Manual translation overrides for terms Azure Translator gets wrong in ASF's
 * context. Exact, case-sensitive match on the trimmed English source.
 *
 * Applied inside translateMany() where they win over BOTH the live Azure result
 * AND the content_translations cache — so a single entry fixes every render
 * path at once: server components (tObject / translateText / the /about/team
 * roster) and the client-side AutoTranslate layer.
 *
 * Why these:
 *  - "President" / "Vice President": Azure emits رئیس جمهور = head of STATE
 *    (president of a country). ASF's president is an organisation chairman,
 *    which is simply رئیس.
 *  - "ASF Team": keep "ASF" intact and disambiguate the leadership menu item
 *    from the sports "Teams" directory.
 */
const GLOSSARY: Record<string, Partial<Record<string, string>>> = {
  President: { "fa-AF": "رئیس", ps: "رئیس" },
  "Vice President": { "fa-AF": "معاون رئیس", ps: "مرستیال رئیس" },
  "ASF Team": { "fa-AF": "تیم ASF", ps: "تیم ASF" },
};

/** Returns the manual override for `text` in `locale`, or null when none applies. */
export function glossaryOverride(text: string | null | undefined, locale: string): string | null {
  if (!text) return null;
  return GLOSSARY[text.trim()]?.[locale] ?? null;
}
