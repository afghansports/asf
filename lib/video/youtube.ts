/**
 * YouTube helpers — parse a URL or raw id, build embed + thumbnail URLs.
 *
 * Accepts every common YouTube URL shape:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/embed/ID
 *   https://m.youtube.com/watch?v=ID
 *   ID                                    (already 11-char)
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYoutubeId(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  if (ID_RE.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return ID_RE.test(id) ? id : null;
    }
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && ID_RE.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/<id>, /embed/<id>, /v/<id>, /live/<id>
      if (parts.length >= 2 && ["shorts", "embed", "v", "live"].includes(parts[0])) {
        return ID_RE.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbUrl(id: string, quality: "default" | "hq" | "max" = "hq"): string {
  const map = { default: "default", hq: "hqdefault", max: "maxresdefault" } as const;
  return `https://i.ytimg.com/vi/${id}/${map[quality]}.jpg`;
}
