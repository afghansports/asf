"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SportPicker } from "@/components/shared/sport-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { type SportCode } from "@/lib/data/sports";
import { createEvent } from "./actions";

type CaptainTeam = { id: string; name: string };

const TYPES = [
  { code: "tournament", label: "Tournament" },
  { code: "match", label: "Match" },
  { code: "camp", label: "Camp" },
  { code: "community", label: "Community" },
  { code: "other", label: "Other" },
];

export function CreateEventForm({ userId, captainTeams }: { userId: string; captainTeams: CaptainTeam[] }) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [sport, setSport] = useState<SportCode | "">("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [regLink, setRegLink] = useState("");
  const [orgTeam, setOrgTeam] = useState<string | "">("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const result = await createEvent({
        title,
        eventType,
        sport: sport || null,
        description,
        bannerUrl,
        startDate,
        startTime,
        endDate: endDate || null,
        endTime: endTime || null,
        state,
        city,
        venueName,
        address,
        isFree,
        registrationLink: regLink,
        organizerTeamId: orgTeam || null,
      });
      if (result.ok) {
        toast.success("Event submitted for review");
        setDone(true);
      } else setErr(result.message);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg p-8 bg-white border border-asf-border text-center space-y-4">
        <span className="inline-flex w-12 h-12 rounded-full bg-asf-green-light text-asf-green items-center justify-center">
          <CheckCircle2 className="w-6 h-6" aria-hidden />
        </span>
        <h2 className="font-display font-bold text-2xl text-asf-text">Submitted for review.</h2>
        <p className="text-asf-muted max-w-md mx-auto leading-relaxed">
          Your event is in the queue. ASF reviews submissions within 24 hours. You will see it on
          /events once approved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/events"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-navy-light"
          >
            Back to events
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-asf-border text-asf-text text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-off-2"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Event title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="event_type">Event type</Label>
          <select
            id="event_type"
            required
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
          >
            <option value="">Select type</option>
            {TYPES.map((t) => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sport">Sport (optional)</Label>
          <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className="text-xs text-asf-muted">Optional</span>
        </div>
        <Textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Banner image (optional)</Label>
        <ImageUpload
          bucket="events"
          pathPrefix={`pending/${userId}`}
          initialUrl={bannerUrl}
          maxBytes={5 * 1024 * 1024}
          aspectRatio="16/6"
          label="Upload banner"
          onUploaded={(u) => setBannerUrl(u)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start_time">Start time</Label>
          <Input id="start_time" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date (optional)</Label>
          <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_time">End time (optional)</Label>
          <Input id="end_time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={pending} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venue_name">Venue (optional)</Label>
          <Input id="venue_name" value={venueName} onChange={(e) => setVenueName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={pending} />
        </div>
      </div>

      <Toggle
        label="This is a free event"
        description="If unchecked, paste a registration link below."
        checked={isFree}
        onChange={setIsFree}
        disabled={pending}
      />

      {!isFree ? (
        <div className="space-y-1.5">
          <Label htmlFor="reg_link">Registration link</Label>
          <Input
            id="reg_link"
            type="url"
            placeholder="https://..."
            value={regLink}
            onChange={(e) => setRegLink(e.target.value)}
            disabled={pending}
          />
        </div>
      ) : null}

      {captainTeams.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="org_team">Hosting team (optional)</Label>
          <select
            id="org_team"
            value={orgTeam}
            onChange={(e) => setOrgTeam(e.target.value)}
            className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
          >
            <option value="">No team (personal event)</option>
            {captainTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6">
          {pending ? "Submitting" : "Submit for review"}
        </Button>
        <p className="text-xs text-asf-muted">ASF reviews submissions within 24 hours.</p>
      </div>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <span className="relative mt-0.5 inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span>
        <span className="block text-sm font-medium text-asf-text">{label}</span>
        {description ? (
          <span className="block text-xs text-asf-muted leading-relaxed mt-0.5">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
