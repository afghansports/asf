"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveAdminEvent } from "../_actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SportPicker } from "@/components/shared/sport-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import type { SportCode } from "@/lib/data/sports";

type EventRow = {
  id: string;
  title: string;
  event_type: string;
  sport: string | null;
  city: string | null;
  state_province: string | null;
  start_datetime: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  banner_url?: string | null;
};

/** Handles both create (no `event`) and edit (with `event`). */
export function EventEditForm({ event, userId }: { event?: EventRow; userId: string }) {
  const router = useRouter();
  const isNew = !event;
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState(event?.event_type ?? "community");
  const [sport, setSport] = useState<SportCode | "">((event?.sport as SportCode) ?? "");
  const [city, setCity] = useState(event?.city ?? "");
  const [state, setState] = useState(event?.state_province ?? "");
  const [startDatetime, setStartDatetime] = useState(event?.start_datetime?.slice(0, 16) ?? "");
  const [published, setPublished] = useState(isNew ? true : !!event?.is_published);
  const [featured, setFeatured] = useState(!!event?.is_featured);
  const [bannerUrl, setBannerUrl] = useState<string | null>(event?.banner_url ?? null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    start(async () => {
      const r = await saveAdminEvent({
        id: event?.id,
        title,
        eventType,
        sport: sport || null,
        city,
        state,
        startDatetime: startDatetime ? new Date(startDatetime).toISOString() : null,
        isPublished: published,
        isFeatured: featured,
        bannerUrl,
      });
      if (r.ok) {
        toast.success(isNew ? "Event created" : "Event saved");
        if (isNew) router.push("/admin/events");
        else setMessage("Saved.");
      } else {
        setMessage(r.message);
        toast.error(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-4">
      {message ? <Alert>{message}</Alert> : null}
      <div className="space-y-1.5">
        <Label htmlFor="admin_event_title">Title</Label>
        <Input id="admin_event_title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admin_event_type">Type</Label>
          <select id="admin_event_type" value={eventType} onChange={(e) => setEventType(e.target.value)} className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm">
            {["tournament", "match", "camp", "community", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Sport</Label>
          <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin_event_city">City</Label>
          <Input id="admin_event_city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin_event_start">Start{isNew ? "" : " (optional)"}</Label>
          <Input id="admin_event_start" type="datetime-local" required={isNew} value={startDatetime} onChange={(e) => setStartDatetime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Banner</Label>
        <ImageUpload
          bucket="events"
          pathPrefix={`events/${userId}/banner`}
          initialUrl={bannerUrl}
          maxBytes={5 * 1024 * 1024}
          aspectRatio="16/6"
          label="Upload banner"
          onUploaded={(u) => setBannerUrl(u)}
        />
      </div>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
      </div>
      <Button disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark">
        {pending ? "Saving" : isNew ? "Create event" : "Save event"}
      </Button>
    </form>
  );
}
