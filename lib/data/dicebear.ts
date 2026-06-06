/**
 * DiceBear avatar fallback. Per ASF_CLAUDE_CODE_PROMPT.md > IMAGE FALLBACK RULES:
 * "User avatar missing: use https://api.dicebear.com/7.x/avataaars/svg?seed=[username]"
 *
 * Used as the default `<img>` src whenever a real avatar_url is null.
 * The dicebear hostname is allow-listed in next.config.ts remotePatterns.
 */

export function dicebearUrl(seed: string, style: "avataaars" | "initials" = "avataaars"): string {
  const safe = encodeURIComponent(seed.trim() || "asf");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safe}`;
}

/**
 * Pick avatar URL: real avatar_url if present, else DiceBear by seed.
 */
export function avatarSrc(realUrl: string | null | undefined, seed: string): string {
  if (realUrl && realUrl.trim()) return realUrl;
  return dicebearUrl(seed);
}
