/**
 * Cloudflare image CDN adapter.
 *
 * Pattern: route all image URLs through `https://cdn.<domain>/<path>` which
 * Cloudflare proxies to the underlying Supabase Storage URL. With Polish +
 * WebP enabled on Cloudflare, this slashes egress + speeds up first paint
 * globally.
 *
 * Activate by setting NEXT_PUBLIC_CDN_BASE in env. Fall back to the original
 * Supabase URL when unset.
 */

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE ?? "";

export function cdnUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return "";
  if (!CDN_BASE) return originalUrl;
  // If the URL is already on the CDN, return as is.
  if (originalUrl.startsWith(CDN_BASE)) return originalUrl;
  // If it's a Supabase Storage URL, swap the host portion.
  // e.g. https://pyhdnfwdmibhnfyyozsw.supabase.co/storage/v1/object/public/avatars/foo.png
  //   →  https://cdn.afghansportsfederation.com/storage/v1/object/public/avatars/foo.png
  try {
    const u = new URL(originalUrl);
    if (u.hostname.endsWith(".supabase.co")) {
      return `${CDN_BASE.replace(/\/$/, "")}${u.pathname}${u.search}`;
    }
  } catch {
    // Not a parseable URL; return original.
  }
  return originalUrl;
}
