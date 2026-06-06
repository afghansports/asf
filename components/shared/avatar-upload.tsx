"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * AvatarUpload (shared). Per ASF_LAUNCH_PRD.md > Reusable Components.
 *
 * Click circle → file picker. Validates max 2MB and JPG/PNG/WebP. Uploads to
 * Supabase Storage at `avatars/<auth.uid()>/avatar.<ext>` (RLS policy in
 * migration 004 lets owner write to their own folder). On success calls
 * `onUploaded` with the public URL so the parent can persist it.
 */

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

type AvatarUploadProps = {
  userId: string;
  initialUrl: string | null;
  fallbackInitial: string;
  onUploaded: (publicUrl: string) => void | Promise<void>;
  size?: number;
  className?: string;
};

export function AvatarUpload({
  userId,
  initialUrl,
  fallbackInitial,
  onUploaded,
  size = 88,
  className,
}: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    setError(null);
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 2 MB.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      setUrl(publicUrl);
      await onUploaded(publicUrl);
    } catch (err) {
      console.error("[avatar] upload failed:", err);
      setError("Upload failed. Try again.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={pickFile}
        disabled={pending}
        aria-label="Change profile photo"
        className="group relative inline-flex rounded-full overflow-hidden bg-asf-navy text-white items-center justify-center font-condensed font-bold tracking-[0.12em] disabled:opacity-70"
        style={{ width: size, height: size }}
      >
        {url ? (
          <Image src={url} alt="" fill className="object-cover" sizes={`${size}px`} unoptimized />
        ) : (
          <span aria-hidden style={{ fontSize: size / 2.5 }}>
            {fallbackInitial}
          </span>
        )}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {pending ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          ) : (
            <Camera className="w-5 h-5" aria-hidden />
          )}
        </span>
      </button>
      <div className="space-y-1">
        <button
          type="button"
          onClick={pickFile}
          disabled={pending}
          className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4 disabled:opacity-50"
        >
          {pending ? "Uploading" : url ? "Change photo" : "Upload photo"}
        </button>
        <p className="text-xs text-asf-muted">JPG, PNG, or WebP. Max 2 MB.</p>
        {error ? (
          <p className="inline-flex items-center gap-1 text-xs text-asf-red">
            <X className="w-3 h-3" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
