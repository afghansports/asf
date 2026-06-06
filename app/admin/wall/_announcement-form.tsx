"use client";

import { useState, useTransition } from "react";
import { createAnnouncement } from "../_wall-actions";

export function AnnouncementForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createAnnouncement({
        title,
        body,
        link,
        imageUrl: imageUrl.trim() || null,
      });
      if (r.ok) {
        window.location.reload();
      } else {
        window.alert(r.message);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark"
      >
        New announcement
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-asf-border bg-white p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-base text-asf-text">New announcement</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="text-xs text-asf-muted hover:text-asf-text"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="ann-title" className="block text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-muted">
          Title <span aria-hidden className="text-asf-red">*</span>
        </label>
        <input
          id="ann-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          placeholder="Announcement title"
          className="w-full h-9 px-3 rounded-md border border-asf-border bg-asf-off text-sm text-asf-text focus:outline-none focus:ring-1 focus:ring-asf-red disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="ann-body" className="block text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-muted">
          Body (optional)
        </label>
        <textarea
          id="ann-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
          placeholder="Additional details..."
          className="w-full px-3 py-2 rounded-md border border-asf-border bg-asf-off text-sm text-asf-text focus:outline-none focus:ring-1 focus:ring-asf-red disabled:opacity-50 resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="ann-link" className="block text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-muted">
            Link (optional)
          </label>
          <input
            id="ann-link"
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={pending}
            placeholder="/feed or https://..."
            className="w-full h-9 px-3 rounded-md border border-asf-border bg-asf-off text-sm text-asf-text focus:outline-none focus:ring-1 focus:ring-asf-red disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ann-image" className="block text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-muted">
            Image URL (optional)
          </label>
          <input
            id="ann-image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={pending}
            placeholder="https://..."
            className="w-full h-9 px-3 rounded-md border border-asf-border bg-asf-off text-sm text-asf-text focus:outline-none focus:ring-1 focus:ring-asf-red disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 px-5 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark disabled:opacity-50"
        >
          {pending ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
}
