/**
 * Rate limiter. Falls back to in-memory if Upstash isn't configured.
 * Used by public-write endpoints (/api/contact, /api/newsletter, server
 * actions for reels and reel-comments) to throttle abuse from anonymous
 * visitors and unauthenticated bots.
 */

const inMemory = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * Check + increment a counter for `key` in a `windowMs` rolling window.
 * Allows up to `max` hits within that window. After max, returns retryAfter.
 *
 * On Vercel, in-memory state is per-instance — fine for soft throttling but
 * not strict. Wire Upstash Redis here later for shared state across instances.
 */
export function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const entry = inMemory.get(key);

  if (!entry || entry.resetAt < now) {
    inMemory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  return { ok: true };
}

/**
 * Pull a stable client identifier from request headers. Behind Vercel /
 * Cloudflare we get the real IP; locally we use a fallback.
 */
export function clientKey(headers: Headers, fallback = "anon"): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    fallback
  );
}
