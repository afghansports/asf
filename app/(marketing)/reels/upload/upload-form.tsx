"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Video, Loader2, X, CheckCircle2, Link as LinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { parseYoutubeId, youtubeThumbUrl } from "@/lib/video/youtube";
import { CountryPicker } from "@/components/shared/country-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { FillImage } from "@/components/shared/optimized-image";
import { DistrictPicker } from "@/components/shared/district-picker";
import { SportPicker } from "@/components/shared/sport-picker";
import { createClient } from "@/lib/supabase/client";
import { type SportCode } from "@/lib/data/sports";
import { createReel, createMuxReelUpload, createYoutubeReel } from "./actions";

const ACCEPT = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

type Mode = "file" | "youtube";

export function UploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("file");
  const [duration, setDuration] = useState<number | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const parsedYoutubeId = mode === "youtube" ? parseYoutubeId(youtubeUrl) : null;

  const [caption, setCaption] = useState("");
  const [sport, setSport] = useState<SportCode | "">("");
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [afProvince, setAfProvince] = useState("");
  const [afDistrict, setAfDistrict] = useState("");

  const [pendingPost, startPost] = useTransition();
  const [postErr, setPostErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr(null);

    if (!ACCEPT.includes(file.type)) {
      setUploadErr("Use MP4, MOV, or WebM.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadErr("Video must be under 100 MB.");
      return;
    }

    // Local preview + duration
    const localUrl = URL.createObjectURL(file);
    setPreviewSrc(localUrl);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = localUrl;
    probe.onloadedmetadata = () => {
      setDuration(Math.round(probe.duration));
    };

    // Defer the actual upload until Post — that way we know caption/sport
    // before creating the Mux upload row, and we don't waste bandwidth on
    // abandoned drafts.
    setPendingFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  // Plain Supabase Storage path (used when Mux is not configured server-side).
  async function uploadToSupabase(file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("reels")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("reels").getPublicUrl(path);
    return pub.publicUrl;
  }

  // Mux direct-upload path. Returns the reel id directly (row was already
  // created by the server action; webhook will publish it).
  async function uploadToMux(file: File): Promise<string> {
    const stateValue =
      country === "AF" ? afProvince : country === "US" ? state : null;
    const districtValue = country === "AF" ? afDistrict : null;
    const r = await createMuxReelUpload({
      caption,
      sport: sport || null,
      countryCode: country,
      stateProvince: stateValue,
      districtCode: districtValue,
    });
    if (!r.ok) throw new Error(r.message);
    const put = await fetch(r.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error(`Upload to Mux failed: ${put.status}`);
    return r.reelId;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPostErr(null);

    // YouTube branch — no upload, just save the link.
    if (mode === "youtube") {
      if (!parsedYoutubeId) {
        setPostErr("Paste a valid YouTube link.");
        return;
      }
      startPost(async () => {
        const stateValue =
          country === "AF" ? afProvince : country === "US" ? state : null;
        const districtValue = country === "AF" ? afDistrict : null;
        const result = await createYoutubeReel({
          youtubeUrl: youtubeUrl,
          caption,
          sport: sport || null,
          countryCode: country,
          stateProvince: stateValue,
          districtCode: districtValue,
        });
        if (!result.ok) {
          setPostErr(result.message);
          return;
        }
        toast.success("Reel posted");
        setDone(true);
        window.setTimeout(() => router.push("/reels"), 1200);
      });
      return;
    }

    // File branch
    if (!pendingFile) {
      setPostErr("Choose a video first.");
      return;
    }
    startPost(async () => {
      try {
        setUploading(true);
        // Try Mux first (server action returns ok=false with "mux not configured"
        // if the env vars aren't set). Fall back to direct Supabase Storage.
        try {
          await uploadToMux(pendingFile);
          toast.success("Reel posted");
          setDone(true);
          window.setTimeout(() => router.push("/reels"), 1500);
          return;
        } catch (muxErr) {
          const msg = muxErr instanceof Error ? muxErr.message : "";
          if (!msg.includes("mux not configured")) {
            throw muxErr;
          }
        }

        const url = await uploadToSupabase(pendingFile);
        const stateValue =
          country === "AF" ? afProvince : country === "US" ? state : null;
        const districtValue = country === "AF" ? afDistrict : null;
        const result = await createReel({
          videoUrl: url,
          thumbnailUrl: null,
          caption,
          sport: sport || null,
          countryCode: country,
          stateProvince: stateValue,
          districtCode: districtValue,
          durationSeconds: duration,
        });
        if (!result.ok) throw new Error(result.message);
        toast.success("Reel posted");
        setDone(true);
        window.setTimeout(() => router.push("/reels"), 1200);
      } catch (err) {
        console.error("[reels/upload]", err);
        const message = err instanceof Error ? err.message : "Upload failed. Try again.";
        setPostErr(message);
        toast.error(message);
      } finally {
        setUploading(false);
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-lg p-8 bg-white border border-asf-border text-center space-y-4">
        <span className="inline-flex w-12 h-12 rounded-full bg-asf-green-light text-asf-green items-center justify-center">
          <CheckCircle2 className="w-6 h-6" aria-hidden />
        </span>
        <h2 className="font-display font-bold text-2xl text-asf-text">Reel posted.</h2>
        <p className="text-asf-muted">Redirecting to the feed…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Mode switcher: upload file vs paste YouTube link */}
      <div role="tablist" aria-label="Video source" className="inline-flex p-1 rounded-md bg-asf-off-2 border border-asf-border">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "file"}
          onClick={() => setMode("file")}
          className={cn(
            "px-3 h-8 inline-flex items-center gap-1.5 rounded text-xs font-condensed font-bold tracking-[0.18em] uppercase",
            mode === "file" ? "bg-white text-asf-text shadow-sm" : "text-asf-muted hover:text-asf-text",
          )}
        >
          <Upload className="w-3.5 h-3.5" aria-hidden />
          Upload file
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "youtube"}
          onClick={() => setMode("youtube")}
          className={cn(
            "px-3 h-8 inline-flex items-center gap-1.5 rounded text-xs font-condensed font-bold tracking-[0.18em] uppercase",
            mode === "youtube" ? "bg-white text-asf-text shadow-sm" : "text-asf-muted hover:text-asf-text",
          )}
        >
          <Play className="w-3.5 h-3.5" aria-hidden />
          YouTube link
        </button>
      </div>

      {mode === "file" ? (
        <div className="space-y-2">
          <Label>Video</Label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative w-full overflow-hidden rounded-lg border border-dashed border-asf-border bg-asf-off hover:bg-asf-off-2 aspect-[9/12] sm:aspect-video"
            disabled={uploading}
          >
            {previewSrc ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={previewSrc} className="w-full h-full object-cover bg-black" muted playsInline />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-asf-muted text-sm">
                <Video className="w-8 h-8" aria-hidden />
                <span>Tap to choose a video</span>
                <span className="text-xs">MP4, MOV, or WebM. Max 100 MB.</span>
              </span>
            )}
            {uploading ? (
              <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
              </span>
            ) : null}
            {pendingFile && !uploading ? (
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-asf-green text-white text-[0.65rem] font-condensed font-bold tracking-wider uppercase">
                <CheckCircle2 className="w-3 h-3" aria-hidden />
                Ready to post
              </span>
            ) : null}
          </button>
          {uploadErr ? (
            <p className="inline-flex items-center gap-1 text-xs text-asf-red">
              <X className="w-3 h-3" aria-hidden /> {uploadErr}
            </p>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT.join(",")}
            onChange={onPickFile}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="yt-url">YouTube URL</Label>
          <div className="relative">
            <LinkIcon
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-asf-muted"
              aria-hidden
            />
            <Input
              id="yt-url"
              type="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=…"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="ps-9"
            />
          </div>
          <p className="text-xs text-asf-muted">
            Paste a regular YouTube, youtu.be, or Shorts link. The video will be embedded; viewers stay on ASF.
          </p>
          {parsedYoutubeId ? (
            <div className="relative w-full overflow-hidden rounded-lg border border-asf-border bg-black aspect-video">
              <FillImage src={youtubeThumbUrl(parsedYoutubeId, "hq")} alt="" className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-asf-red text-white text-[0.65rem] font-condensed font-bold tracking-wider uppercase">
                <Play className="w-3 h-3" aria-hidden />
                YouTube
              </span>
            </div>
          ) : youtubeUrl.length > 0 ? (
            <p className="inline-flex items-center gap-1 text-xs text-asf-red">
              <X className="w-3 h-3" aria-hidden /> Not a valid YouTube link.
            </p>
          ) : null}
        </div>
      )}

      {/* Caption */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="caption">Caption</Label>
          <span className={caption.length > 500 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {caption.length} / 500
          </span>
        </div>
        <Textarea
          id="caption"
          rows={3}
          maxLength={500}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's the moment?"
        />
      </div>

      {/* Sport */}
      <div className="space-y-1.5">
        <Label>Sport (optional)</Label>
        <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} />
      </div>

      {/* Country / region */}
      <div className="space-y-1.5">
        <Label>Country</Label>
        <CountryPicker
          value={country}
          onChange={(c) => {
            setCountry(c);
            setState("");
            setAfProvince("");
            setAfDistrict("");
          }}
        />
      </div>
      {country === "US" ? (
        <div className="space-y-1.5">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
      ) : null}
      {country === "AF" ? (
        <div className="space-y-1.5">
          <Label>Province + district</Label>
          <DistrictPicker
            countryCode={country}
            province={afProvince}
            district={afDistrict}
            onProvinceChange={setAfProvince}
            onDistrictChange={setAfDistrict}
          />
        </div>
      ) : null}

      {postErr ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{postErr}</Alert>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={pendingPost || (mode === "file" ? !pendingFile : !parsedYoutubeId)}
          className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
        >
          <Upload className="w-4 h-4" aria-hidden />
          {pendingPost ? "Posting" : "Post reel"}
        </Button>
      </div>
    </form>
  );
}
