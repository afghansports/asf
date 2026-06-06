"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react";
import { cdnUrl } from "@/lib/cdn/cloudflare";

export type GalleryItem = {
  id: string;
  image_url: string | null;
  caption: string | null;
  event_name: string | null;
  year: number | null;
};

type Props = { items: GalleryItem[] };

export function GalleryGrid({ items }: Props) {
  const [year, setYear] = useState<number | "all">("all");
  const [eventName, setEventName] = useState<string>("");
  const [open, setOpen] = useState<number | null>(null);

  const years = useMemo(() => {
    const ys = Array.from(
      new Set(items.map((i) => i.year).filter((y): y is number => typeof y === "number"))
    ).sort((a, b) => b - a);
    return ys;
  }, [items]);

  const eventNames = useMemo(() => {
    const ns = Array.from(
      new Set(items.map((i) => i.event_name).filter((n): n is string => !!n))
    ).sort();
    return ns;
  }, [items]);

  const visible = useMemo(
    () =>
      items.filter((it) => {
        if (year !== "all" && it.year !== year) return false;
        if (eventName && it.event_name !== eventName) return false;
        return true;
      }),
    [items, year, eventName]
  );

  // Keyboard nav for lightbox
  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((v) => (v === null ? null : Math.min(v + 1, visible.length - 1)));
      if (e.key === "ArrowLeft") setOpen((v) => (v === null ? null : Math.max(v - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, visible.length]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select
          value={year === "all" ? "" : String(year)}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "all")}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
          aria-label="Year"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
          aria-label="Event"
        >
          <option value="">All events</option>
          {eventNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-xs text-asf-muted ml-auto">
          {visible.length} {visible.length === 1 ? "image" : "images"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-asf-border bg-white p-12 text-center">
          <ImageIcon className="w-6 h-6 text-asf-muted mx-auto mb-3" aria-hidden />
          <p className="text-asf-muted text-sm">No images match those filters.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {visible.map((it, idx) => (
            <button
              type="button"
              key={it.id}
              onClick={() => setOpen(idx)}
              className="block w-full mb-4 break-inside-avoid overflow-hidden rounded-lg border border-asf-border bg-asf-off text-left hover:ring-2 hover:ring-asf-red/30 transition"
            >
              {it.image_url ? (
                <div className="relative w-full h-64">
                  <Image
                    src={cdnUrl(it.image_url)}
                    alt={it.caption ?? ""}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="w-full bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy text-white/60 flex items-center justify-center"
                  style={{ height: 220 + ((idx * 41) % 110) }}
                  aria-hidden
                >
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
              {it.caption ? (
                <p className="p-3 text-xs text-asf-muted">
                  <span className="text-asf-text font-medium">{it.caption}</span>
                  {it.event_name || it.year ? (
                    <span className="block text-[0.7rem] mt-0.5">
                      {[it.event_name, it.year].filter(Boolean).join(" . ")}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {open !== null && visible[open] ? (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute inset-0 cursor-default"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => (v === null ? null : Math.max(v - 1, 0)));
            }}
            aria-label="Previous image"
            disabled={open === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => (v === null ? null : Math.min(v + 1, visible.length - 1)));
            }}
            aria-label="Next image"
            disabled={open === visible.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>

          <figure className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {visible[open].image_url ? (
              <Image
                src={cdnUrl(visible[open].image_url)}
                alt={visible[open].caption ?? ""}
                width={1200}
                height={800}
                className="w-full max-h-[80vh] object-contain"
                unoptimized
              />
            ) : (
              <div
                className="w-full bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy text-white/60 flex items-center justify-center"
                style={{ height: "60vh" }}
                aria-hidden
              >
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
            <figcaption className="mt-3 text-center text-white/80 text-sm">
              {visible[open].caption}
              {visible[open].event_name || visible[open].year ? (
                <span className="block text-xs text-white/60 mt-1">
                  {[visible[open].event_name, visible[open].year].filter(Boolean).join(" . ")}
                </span>
              ) : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
