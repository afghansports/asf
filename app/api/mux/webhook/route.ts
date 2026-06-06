/**
 * Mux webhook endpoint. Configure in Mux dashboard:
 *   Settings > Webhooks > Add endpoint > {APP_URL}/api/mux/webhook
 *
 * Handled events:
 *   - video.upload.asset_created  -> link the upload to its asset
 *   - video.asset.ready           -> save playback id, flip processing_state, publish
 *   - video.asset.errored         -> mark errored
 *   - video.upload.cancelled      -> mark errored
 *
 * Verifies Mux-Signature header against MUX_WEBHOOK_SECRET if set.
 */

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { muxPlaybackUrl, muxThumbUrl } from "@/lib/video/mux";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured — accept (dev mode)
  if (!header) return false;
  // Mux sends `t=<unix>,v1=<hex>`
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v ?? "").trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const payload = `${t}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("mux-signature");
  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ ok: false, message: "bad signature" }, { status: 401 });
  }

  let body: { type?: string; data?: Record<string, unknown> };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, message: "bad body" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const type = body.type ?? "";
  const data = (body.data ?? {}) as {
    id?: string;
    upload_id?: string;
    playback_ids?: { id: string; policy: string }[];
    duration?: number;
  };

  try {
    if (type === "video.upload.asset_created" && data.id && data.upload_id) {
      // Link upload -> asset
      await supabase
        .from("reels")
        .update({ mux_asset_id: data.id, processing_state: "processing" })
        .eq("mux_upload_id", data.upload_id);
    } else if (type === "video.asset.ready" && data.id) {
      const playbackId =
        (data.playback_ids ?? []).find((p) => p.policy === "public")?.id ??
        data.playback_ids?.[0]?.id ??
        null;
      if (playbackId) {
        await supabase
          .from("reels")
          .update({
            mux_playback_id: playbackId,
            video_url: muxPlaybackUrl(playbackId),
            thumbnail_url: muxThumbUrl(playbackId, 0),
            duration_seconds: data.duration ? Math.round(data.duration) : null,
            processing_state: "ready",
            is_published: true,
          })
          .eq("mux_asset_id", data.id);
      }
    } else if (type === "video.asset.errored" && data.id) {
      await supabase
        .from("reels")
        .update({ processing_state: "errored" })
        .eq("mux_asset_id", data.id);
    } else if (type === "video.upload.cancelled" && data.id) {
      await supabase
        .from("reels")
        .update({ processing_state: "errored" })
        .eq("mux_upload_id", data.id);
    }
  } catch (e) {
    console.error("[mux/webhook]", e);
    return NextResponse.json({ ok: false, message: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
