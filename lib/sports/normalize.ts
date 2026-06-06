/**
 * Headline normalisation for cross-source de-duplication.
 *
 * The same story often arrives from more than one feed (e.g. a Google News
 * item "Afghanistan beat Zimbabwe in 2nd T20 - ESPNcricinfo" and the ESPN
 * Cricinfo feed's own "Afghanistan beat Zimbabwe in 2nd T20"). Reducing both
 * to the same `contentKey` lets the wall projection collapse them to one post.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "in", "on", "at", "for", "and", "or", "vs",
  "v", "with", "as", "is", "are", "be", "by", "from", "after", "over", "into",
]);

/**
 * A stable fingerprint of a headline: lowercase, drop a trailing
 * " - Publisher" segment (Google News appends one), strip diacritics and
 * punctuation, remove stopwords, and keep the first 10 significant tokens.
 */
export function contentKey(title: string): string {
  let t = title.toLowerCase();
  // Google News appends " - <publisher>" — remove the last such segment.
  t = t.replace(/\s+[-–|]\s+[^-–|]+$/, "");
  // Strip diacritics (Afغان etc. transliterations differ across feeds).
  t = t.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  // Non-alphanumerics → spaces.
  t = t.replace(/[^a-z0-9\s]/g, " ");
  const tokens = t.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));
  return tokens.slice(0, 10).join("-");
}
