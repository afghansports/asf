/**
 * Mux adapter — server-only helpers for direct uploads, asset queries, and
 * playback URL signing. Used once reels traffic outgrows Supabase Storage
 * egress costs.
 *
 * Activates when MUX_TOKEN_ID + MUX_TOKEN_SECRET are set in env. Otherwise
 * the helpers return `{ ok: false, message: "mux not configured" }` so the
 * caller can fall back to the existing Supabase Storage upload path.
 */

const MUX_API = "https://api.mux.com";

function muxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

function authHeader(): string {
  const token = Buffer.from(
    `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`,
  ).toString("base64");
  return `Basic ${token}`;
}

export type MuxResult<T> = { ok: true; data: T } | { ok: false; message: string };

/**
 * Create a direct-upload URL the browser can PUT a file to. Mux ingests +
 * transcodes; we get a webhook back when an asset is ready (set up the
 * webhook in Mux dashboard pointing at /api/mux/webhook).
 */
export async function createDirectUpload(opts: {
  corsOrigin?: string;
  newAssetSettings?: Record<string, unknown>;
}): Promise<MuxResult<{ id: string; url: string }>> {
  if (!muxConfigured()) return { ok: false, message: "mux not configured" };
  try {
    const res = await fetch(`${MUX_API}/video/v1/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        cors_origin: opts.corsOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "*",
        new_asset_settings: opts.newAssetSettings ?? {
          playback_policy: ["public"],
          encoding_tier: "smart",
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `mux upload create failed: ${text}` };
    }
    const json = await res.json();
    return { ok: true, data: { id: json.data.id, url: json.data.url } };
  } catch (e) {
    console.error("[mux/createDirectUpload]", e);
    return { ok: false, message: "mux unreachable" };
  }
}

export function muxPlaybackUrl(playbackId: string, opts: { quality?: "high" | "low" } = {}): string {
  const tier = opts.quality === "low" ? "low" : "";
  return `https://stream.mux.com/${playbackId}.m3u8${tier ? `?max_resolution=${tier}` : ""}`;
}

export function muxThumbUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}
