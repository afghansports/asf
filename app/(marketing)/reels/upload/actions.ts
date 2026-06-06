"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDirectUpload } from "@/lib/video/mux";
import { parseYoutubeId, youtubeWatchUrl, youtubeThumbUrl } from "@/lib/video/youtube";

export type UploadReelResult = { ok: true; id: string } | { ok: false; message: string };

/**
 * Create a Mux direct-upload URL + a placeholder reel row in `pending` state.
 * Client PUTs the file to `uploadUrl`. Webhook flips the row to `ready` once
 * Mux finishes ingest. Returns { ok: false } if Mux is not configured — the
 * caller should fall back to direct-to-Supabase-Storage upload.
 */
export async function createMuxReelUpload(input: {
  caption: string;
  sport: string | null;
  countryCode: string;
  stateProvince: string | null;
  districtCode: string | null;
}): Promise<
  | { ok: true; reelId: string; uploadUrl: string; uploadId: string }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const mux = await createDirectUpload({});
    if (!mux.ok) return { ok: false, message: mux.message };

    const { data, error } = await supabase
      .from("reels")
      .insert({
        author_id: user.id,
        // Placeholder until webhook fills in the playback URL.
        video_url: "",
        thumbnail_url: null,
        caption: input.caption.trim().slice(0, 500) || null,
        sport: input.sport,
        country_code: input.countryCode || "US",
        state_province: input.stateProvince,
        district_code: input.districtCode,
        is_published: false,
        processing_state: "pending",
        mux_upload_id: mux.data.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[reels/upload/mux]", error);
      return { ok: false, message: "Could not create reel. Try again." };
    }
    return { ok: true, reelId: data.id, uploadUrl: mux.data.url, uploadId: mux.data.id };
  } catch (e) {
    console.error("[reels/upload/mux] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function createReel(input: {
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string;
  sport: string | null;
  countryCode: string;
  stateProvince: string | null;
  districtCode: string | null;
  durationSeconds: number | null;
}): Promise<UploadReelResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    if (!input.videoUrl) return { ok: false, message: "Upload a video first." };

    const { data, error } = await supabase
      .from("reels")
      .insert({
        author_id: user.id,
        video_url: input.videoUrl,
        thumbnail_url: input.thumbnailUrl,
        caption: input.caption.trim().slice(0, 500) || null,
        sport: input.sport,
        country_code: input.countryCode || "US",
        state_province: input.stateProvince,
        district_code: input.districtCode,
        duration_seconds: input.durationSeconds,
        is_published: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[reels/upload]", error);
      return { ok: false, message: "Could not post reel. Try again." };
    }
    revalidatePath("/reels");
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[reels/upload] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

/**
 * Post a reel that points at an external YouTube video. Accepts any common
 * YouTube URL shape or a raw 11-char id. No file is uploaded — the video is
 * embedded via iframe on the reels page.
 */
export async function createYoutubeReel(input: {
  youtubeUrl: string;
  caption: string;
  sport: string | null;
  countryCode: string;
  stateProvince: string | null;
  districtCode: string | null;
}): Promise<UploadReelResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const youtubeId = parseYoutubeId(input.youtubeUrl);
    if (!youtubeId) {
      return {
        ok: false,
        message: "That doesn't look like a valid YouTube link. Paste the URL from your browser.",
      };
    }

    const { data, error } = await supabase
      .from("reels")
      .insert({
        author_id: user.id,
        video_url: youtubeWatchUrl(youtubeId),
        thumbnail_url: youtubeThumbUrl(youtubeId, "hq"),
        youtube_id: youtubeId,
        video_kind: "youtube",
        caption: input.caption.trim().slice(0, 500) || null,
        sport: input.sport,
        country_code: input.countryCode || "US",
        state_province: input.stateProvince,
        district_code: input.districtCode,
        is_published: true,
        processing_state: "ready",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[reels/upload/youtube]", error);
      return { ok: false, message: "Could not post reel. Try again." };
    }
    revalidatePath("/reels");
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[reels/upload/youtube] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}
