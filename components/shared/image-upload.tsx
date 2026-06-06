"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * ImageUpload (shared). Rectangular variant of AvatarUpload for banners,
 * event images, etc. Per ASF_LAUNCH_PRD.md > Reusable Components.
 *
 * Path: <bucket>/<userId>/<timestamp>-<filename>. RLS allows the owner to
 * write into their own folder for `avatars` (per migration 004); for
 * `team-logos` and other captain/admin buckets, the calling component is
 * expected to be invoked by a captain/admin (RLS still enforces).
 */

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  bucket: "team-logos" | "events" | "news" | "sponsors" | "avatars" | "gallery" | "management";
  pathPrefix: string;
  initialUrl: string | null;
  maxBytes?: number;
  aspectRatio?: string; // e.g. "16/6"
  label?: string;
  onUploaded: (publicUrl: string) => void | Promise<void>;
  className?: string;
};

export function ImageUpload({
  bucket,
  pathPrefix,
  initialUrl,
  maxBytes = 5 * 1024 * 1024,
  aspectRatio = "16/6",
  label = "Upload image",
  onUploaded,
  className,
}: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxBytes) {
      setError(`Image must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
      const path = `${pathPrefix}/${Date.now()}-${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(pub.publicUrl);
      await onUploaded(pub.publicUrl);
    } catch (err) {
      console.error("[image-upload]", err);
      setError("Upload failed. Try again.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="group relative w-full overflow-hidden rounded-lg border border-dashed border-asf-border bg-asf-off hover:bg-asf-off-2 transition-colors disabled:opacity-70"
        style={{ aspectRatio }}
      >
        {url ? (
          <Image src={url} alt="" fill className="object-cover" sizes="100vw" unoptimized />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-asf-muted gap-2 text-sm">
            <Upload className="w-4 h-4" aria-hidden />
            <span>{label}</span>
          </span>
        )}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          {pending ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          ) : (
            <Upload className="w-5 h-5" aria-hidden />
          )}
        </span>
      </button>
      <p className="text-xs text-asf-muted">
        {`JPG, PNG, or WebP. Max ${Math.round(maxBytes / (1024 * 1024))} MB.`}
      </p>
      {error ? (
        <p className="inline-flex items-center gap-1 text-xs text-asf-red">
          <X className="w-3 h-3" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
