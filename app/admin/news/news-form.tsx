"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ImageUpload } from "@/components/shared/image-upload";
import { saveNewsPost } from "../_actions";

type Initial = {
  id?: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function NewsForm({ userId, initial }: { userId: string; initial: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [content, setContent] = useState(initial.content ?? "");
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl ?? null);
  const [isPublished, setIsPublished] = useState(!!initial.isPublished);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const r = await saveNewsPost({
        id: initial.id,
        title,
        slug,
        content,
        excerpt,
        imageUrl,
        isPublished,
      });
      if (r.ok) router.push("/admin/news");
      else setErr(r.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={title} onChange={(e) => onTitleChange(e.target.value)} disabled={pending} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="excerpt">Excerpt</Label>
          <span className={excerpt.length > 160 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {excerpt.length} / 160
          </span>
        </div>
        <Textarea
          id="excerpt"
          rows={2}
          maxLength={160}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          rows={12}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={pending}
          placeholder="Plain text for MVP. HTML rendering disabled to keep things safe."
        />
        <p className="text-xs text-asf-muted">Plain text. Line breaks preserved.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Featured image (optional)</Label>
        <ImageUpload
          bucket="news"
          pathPrefix={`uploads/${userId}`}
          initialUrl={imageUrl}
          maxBytes={5 * 1024 * 1024}
          aspectRatio="16/9"
          label="Upload image"
          onUploaded={(u) => setImageUrl(u)}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <span className="relative inline-flex items-center">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            disabled={pending}
            className="peer sr-only"
          />
          <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
          <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </span>
        <span className="text-sm text-asf-text">Published (visible on /news)</span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : initial.id ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  );
}
