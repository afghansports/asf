/**
 * Gallery media helpers.
 *
 * The `gallery_images` table only stores a single URL in `image_url`. To
 * support images, uploaded videos, and YouTube/Vimeo links without a DB
 * migration, we store every media URL in that one column and detect the
 * media kind from the URL at render time.
 *
 * Plain module: no "use client" / "use server" so it is safe to import from
 * both server components (public page) and client components (admin form).
 */

export type MediaKind = "image" | "video" | "youtube";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

// Hosts that serve raw video files (not embeddable players we special-case).
const VIDEO_CDN_HOSTS = [
  "stream.mux.com",
  "videodelivery.net", // Cloudflare Stream
  "player.vimeo.com",
];

const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
];

/**
 * Detect the media kind from a URL.
 * - youtube: host is a YouTube domain
 * - video: path ends in a known video extension, or host is a known video CDN
 * - image: everything else (the default / legacy case)
 */
export function detectMediaKind(url: string): MediaKind {
  if (!url) return "image";

  let host = "";
  let pathname = url;
  try {
    const u = new URL(url);
    host = u.hostname.toLowerCase();
    pathname = u.pathname.toLowerCase();
  } catch {
    // Not an absolute URL; fall back to extension sniffing on the raw string.
    pathname = url.toLowerCase().split("?")[0].split("#")[0];
  }

  if (host && YOUTUBE_HOSTS.includes(host)) return "youtube";
  if (host && VIDEO_CDN_HOSTS.includes(host)) return "video";

  const path = pathname.split("?")[0].split("#")[0];
  if (VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))) return "video";

  return "image";
}

/**
 * Parse a YouTube video id from the common URL shapes and return a canonical
 * embed URL. Returns null if no id can be parsed.
 *
 * Supported: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /v/ID.
 */
export function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.includes(host)) return null;

  let id: string | null = null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    // https://youtu.be/<id>
    id = u.pathname.split("/").filter(Boolean)[0] ?? null;
  } else {
    // youtube.com variants
    const watch = u.searchParams.get("v");
    if (watch) {
      id = watch;
    } else {
      const segments = u.pathname.split("/").filter(Boolean);
      const marker = segments.findIndex((s) =>
        s === "shorts" || s === "embed" || s === "v"
      );
      if (marker !== -1 && segments[marker + 1]) {
        id = segments[marker + 1];
      }
    }
  }

  if (!id) return null;
  // Strip any stray suffix and keep valid id characters only.
  id = id.split("?")[0].split("&")[0].split("/")[0];
  if (!/^[a-zA-Z0-9_-]{6,}$/.test(id)) return null;

  return `https://www.youtube.com/embed/${id}`;
}
