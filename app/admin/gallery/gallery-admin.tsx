"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Image as ImageIcon, Trash2, Play, Film, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ImageUpload } from "@/components/shared/image-upload";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { detectMediaKind } from "@/lib/gallery/media";
import { addGalleryImage, deleteGalleryImage, updateGalleryImage } from "../_actions";

type Item = {
  id: string;
  image_url: string | null;
  caption: string | null;
  event_name: string | null;
  year: number | null;
  sort_order: number | null;
  is_published: boolean | null;
};

type Mode = "upload-image" | "upload-video" | "image-link" | "video-link";

const MODES: { value: Mode; label: string }[] = [
  { value: "upload-image", label: "Upload image" },
  { value: "upload-video", label: "Upload video" },
  { value: "image-link", label: "Image link" },
  { value: "video-link", label: "Video / YouTube link" },
];

const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // ~50MB

function isLikelyUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function GalleryAdmin({ items, userId }: { items: Item[]; userId: string }) {
  const [pendingForm, startForm] = useTransition();
  const [mode, setMode] = useState<Mode>("upload-image");

  // Resolved media URL for upload modes (image / video file upload).
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  // Raw text for the two link modes.
  const [linkUrl, setLinkUrl] = useState("");

  const [caption, setCaption] = useState("");
  const [eventName, setEventName] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({ kind: "idle", msg: "" });

  // Video file upload state.
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoPending, setVideoPending] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const isLinkMode = mode === "image-link" || mode === "video-link";

  // The single resolved value passed to the action.
  function resolveMediaUrl(): string {
    return isLinkMode ? linkUrl.trim() : uploadedUrl ?? "";
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStatus({ kind: "idle", msg: "" });
    setVideoError(null);
  }

  function resetForm() {
    setUploadedUrl(null);
    setLinkUrl("");
    setCaption("");
    setEventName("");
    setVideoError(null);
  }

  async function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setVideoError("Choose a video file.");
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      setVideoError("Video must be under 50 MB. Use a YouTube link for larger files.");
      return;
    }
    setVideoError(null);
    setVideoPending(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
      const path = `uploads/${userId}/${Date.now()}-${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from("gallery")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
      setUploadedUrl(pub.publicUrl);
    } catch (err) {
      console.error("[gallery-video-upload]", err);
      setVideoError("Upload failed. Try again.");
    } finally {
      setVideoPending(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mediaUrl = resolveMediaUrl();
    if (!mediaUrl) {
      setStatus({
        kind: "err",
        msg: isLinkMode ? "Paste a link first." : "Upload a file first.",
      });
      return;
    }
    if (isLinkMode && !isLikelyUrl(mediaUrl)) {
      setStatus({ kind: "err", msg: "Enter a valid http(s) URL." });
      return;
    }
    startForm(async () => {
      const r = await addGalleryImage({
        imageUrl: mediaUrl,
        caption,
        eventName,
        year: year ? Number(year) : null,
      });
      if (r.ok) {
        setStatus({ kind: "ok", msg: "Added." });
        resetForm();
        window.setTimeout(() => window.location.reload(), 800);
      } else {
        setStatus({ kind: "err", msg: r.message });
      }
    });
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this item?")) return;
    const r = await deleteGalleryImage(id);
    if (!r.ok) {
      window.alert(r.message);
      return;
    }
    window.location.reload();
  }

  const busy = pendingForm || videoPending;

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-asf-text">Add to gallery</h2>
        {status.kind === "ok" ? (
          <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.msg}</Alert>
        ) : null}
        {status.kind === "err" ? (
          <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.msg}</Alert>
        ) : null}

        {/* Mode selector */}
        <div
          role="tablist"
          aria-label="Media type"
          className="inline-flex flex-wrap gap-1 rounded-lg border border-asf-border bg-asf-off p-1"
        >
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchMode(m.value)}
                disabled={busy}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-condensed font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50",
                  active ? "bg-asf-navy text-white" : "text-asf-muted hover:text-asf-text hover:bg-asf-off-2"
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Mode-specific input. Resolved value is always a single mediaUrl. */}
        <div>
          {mode === "upload-image" ? (
            <div className="max-w-xs">
              <ImageUpload
                bucket="gallery"
                pathPrefix={`uploads/${userId}`}
                initialUrl={uploadedUrl}
                maxBytes={10 * 1024 * 1024}
                aspectRatio="16/9"
                label="Upload image"
                onUploaded={(u) => setUploadedUrl(u)}
              />
            </div>
          ) : null}

          {mode === "upload-video" ? (
            <div className="max-w-xs space-y-2">
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={videoPending}
                className="group relative w-full overflow-hidden rounded-lg border border-dashed border-asf-border bg-asf-off hover:bg-asf-off-2 transition-colors disabled:opacity-70"
                style={{ aspectRatio: "16/9" }}
              >
                {uploadedUrl && detectMediaKind(uploadedUrl) === "video" ? (
                  <video
                    src={uploadedUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-asf-muted">
                    {videoPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Film className="h-4 w-4" aria-hidden />
                    )}
                    <span>{videoPending ? "Uploading" : "Upload video"}</span>
                  </span>
                )}
              </button>
              <p className="text-xs text-asf-muted">MP4, WebM, or MOV. Max 50 MB.</p>
              {videoError ? (
                <p className="inline-flex items-center gap-1 text-xs text-asf-red">
                  <X className="h-3 w-3" aria-hidden />
                  <span>{videoError}</span>
                </p>
              ) : null}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={onVideoChange}
                className="hidden"
              />
            </div>
          ) : null}

          {mode === "image-link" ? (
            <div className="space-y-1.5">
              <Label htmlFor="image_link">Image URL</Label>
              <Input
                id="image_link"
                type="url"
                inputMode="url"
                placeholder="https://example.com/photo.jpg"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={busy}
              />
              <p className="text-xs text-asf-muted">Direct link to a JPG, PNG, or WebP image.</p>
            </div>
          ) : null}

          {mode === "video-link" ? (
            <div className="space-y-1.5">
              <Label htmlFor="video_link">Video or YouTube URL</Label>
              <Input
                id="video_link"
                type="url"
                inputMode="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={busy}
              />
              <p className="text-xs text-asf-muted">YouTube, Vimeo, or a direct .mp4 / .webm link.</p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event_name">Event name</Label>
            <Input id="event_name" value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <Button type="submit" disabled={busy} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pendingForm ? "Adding" : "Add to gallery"}
        </Button>
      </form>

      <div>
        <h2 className="font-display font-bold text-lg text-asf-text mb-4">Current items ({items.length})</h2>
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <GalleryAdminItem key={it.id} item={it} onDelete={onDelete} />
          ))}
          {items.length === 0 ? (
            <li className="col-span-full rounded-lg p-10 border border-dashed border-asf-border bg-white text-center text-asf-muted text-sm">
              No items yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function GalleryAdminItem({ item: it, onDelete }: { item: Item; onDelete: (id: string) => void }) {
  const [pending, start] = useTransition();
  const [caption, setCaption] = useState(it.caption ?? "");
  const [eventName, setEventName] = useState(it.event_name ?? "");
  const [year, setYear] = useState(String(it.year ?? ""));
  const [sortOrder, setSortOrder] = useState(String(it.sort_order ?? 0));
  const [published, setPublished] = useState(it.is_published ?? true);

  const kind = it.image_url ? detectMediaKind(it.image_url) : "image";

  function save() {
    start(async () => {
      const r = await updateGalleryImage({
        id: it.id,
        caption,
        eventName,
        year: year ? Number(year) : null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isPublished: published,
      });
      if (!r.ok) window.alert(r.message);
    });
  }

  return (
    <li className="rounded-lg border border-asf-border bg-white overflow-hidden flex flex-col">
      {it.image_url && kind === "image" ? (
        <div className="relative w-full h-48 bg-asf-off-2">
          <Image src={it.image_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" unoptimized />
        </div>
      ) : it.image_url ? (
        // Video / YouTube: placeholder tile with a play badge + the URL, so a
        // non-image URL never renders as a broken <Image>.
        <div className="relative w-full h-48 bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy text-white flex flex-col items-center justify-center gap-2 p-3 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <Play className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.16em] font-condensed font-bold text-white/70">
            {kind === "youtube" ? "YouTube" : "Video"}
          </span>
          <span className="line-clamp-2 break-all text-[0.65rem] text-white/60">{it.image_url}</span>
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy text-white/60 flex items-center justify-center">
          <ImageIcon className="w-10 h-10" aria-hidden />
        </div>
      )}
      <div className="p-3 text-xs text-asf-muted space-y-2">
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" />
        <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event name" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" inputMode="numeric" />
          <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Sort" inputMode="numeric" />
        </div>
        <label className="flex items-center gap-2 text-asf-text">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>
      </div>
      <div className="m-3 mt-auto flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center h-8 px-3 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy-light disabled:opacity-50"
        >
          {pending ? "Saving" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(it.id)}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-asf-red-light text-asf-red text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden />
          Delete
        </button>
      </div>
    </li>
  );
}
