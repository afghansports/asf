"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ImageUpload } from "@/components/shared/image-upload";
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

export function GalleryAdmin({ items, userId }: { items: Item[]; userId: string }) {
  const [pendingForm, startForm] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [eventName, setEventName] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({ kind: "idle", msg: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      setStatus({ kind: "err", msg: "Upload an image first." });
      return;
    }
    startForm(async () => {
      const r = await addGalleryImage({
        imageUrl,
        caption,
        eventName,
        year: year ? Number(year) : null,
      });
      if (r.ok) {
        setStatus({ kind: "ok", msg: "Added." });
        setImageUrl(null);
        setCaption("");
        setEventName("");
        window.setTimeout(() => window.location.reload(), 800);
      } else {
        setStatus({ kind: "err", msg: r.message });
      }
    });
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this image?")) return;
    const r = await deleteGalleryImage(id);
    if (!r.ok) {
      window.alert(r.message);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-asf-text">Add image</h2>
        {status.kind === "ok" ? (
          <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.msg}</Alert>
        ) : null}
        {status.kind === "err" ? (
          <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.msg}</Alert>
        ) : null}

        <ImageUpload
          bucket="gallery"
          pathPrefix={`uploads/${userId}`}
          initialUrl={imageUrl}
          maxBytes={10 * 1024 * 1024}
          aspectRatio="4/3"
          label="Upload image"
          onUploaded={(u) => setImageUrl(u)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={pendingForm} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event_name">Event name</Label>
            <Input id="event_name" value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={pendingForm} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={pendingForm}
            />
          </div>
        </div>

        <Button type="submit" disabled={pendingForm} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pendingForm ? "Adding" : "Add to gallery"}
        </Button>
      </form>

      <div>
        <h2 className="font-display font-bold text-lg text-asf-text mb-4">Current images ({items.length})</h2>
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <GalleryAdminItem key={it.id} item={it} onDelete={onDelete} />
          ))}
          {items.length === 0 ? (
            <li className="col-span-full rounded-lg p-10 border border-dashed border-asf-border bg-white text-center text-asf-muted text-sm">
              No images yet.
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
      {it.image_url ? (
        <div className="relative w-full h-48 bg-asf-off-2">
          <Image src={it.image_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" unoptimized />
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
