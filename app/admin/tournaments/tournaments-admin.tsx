"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { StatePicker } from "@/components/shared/state-picker";
import { SportPicker } from "@/components/shared/sport-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { ActionButton } from "../_action-button";
import { AdminToggle } from "../_toggle";
import { saveTournament, deleteTournament } from "../_chapters-actions";
import { type SportCode } from "@/lib/data/sports";

export type TournamentRow = {
  id: string;
  slug: string;
  name: string;
  sport: string;
  format: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state_province: string | null;
  status: string;
  is_published: boolean;
  is_featured: boolean;
  banner_url?: string | null;
};

const FORMATS = [
  { code: "single_elim", label: "Single elimination" },
  { code: "round_robin", label: "Round robin" },
];

const STATUSES = [
  { code: "announced", label: "Announced" },
  { code: "registration", label: "Registration open" },
  { code: "in_progress", label: "In progress" },
  { code: "completed", label: "Completed" },
  { code: "cancelled", label: "Cancelled" },
];

export function TournamentsAdmin({ rows, userId }: { rows: TournamentRow[]; userId: string }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState<SportCode | "">("");
  const [format, setFormat] = useState("single_elim");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState("announced");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [pending, startTx] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "idle"; m: string }>({ kind: "idle", m: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sport) { setMsg({ kind: "err", m: "Sport is required." }); return; }
    startTx(async () => {
      const r = await saveTournament({
        name,
        sport,
        format,
        description: desc,
        startDate: start || null,
        endDate: end || null,
        city,
        stateProvince: state,
        status,
        isPublished: false,
        isFeatured: false,
        bannerUrl,
      });
      if (r.ok) {
        setMsg({ kind: "ok", m: "Created." });
        window.setTimeout(() => window.location.reload(), 600);
      } else {
        setMsg({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-asf-text">Create tournament</h2>
        {msg.kind === "ok" ? <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{msg.m}</Alert> : null}
        {msg.kind === "err" ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{msg.m}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sport</Label>
            <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="format">Format</Label>
            <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm">
              {FORMATS.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">End date</Label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <StatePicker value={state} onChange={setState} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm">
              {STATUSES.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Banner (optional)</Label>
          <ImageUpload
            bucket="events"
            pathPrefix={`tournaments/${userId}/banner`}
            initialUrl={bannerUrl}
            maxBytes={5 * 1024 * 1024}
            aspectRatio="16/6"
            label="Upload banner"
            onUploaded={(u) => setBannerUrl(u)}
          />
        </div>
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : "Create"}
        </Button>
      </form>

      <div className="rounded-lg border border-asf-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border text-left">
            <tr>
              <Th>Name</Th>
              <Th>Sport</Th>
              <Th>Status</Th>
              <Th>Pub</Th>
              <Th>Feat</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <Link href={`/tournaments/${t.slug}`} className="text-asf-text font-medium hover:text-asf-red">
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-asf-muted">{t.sport.replace("_", " ")}</td>
                <td className="px-4 py-3 capitalize text-asf-muted">{t.status.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <AdminToggle
                    initial={t.is_published}
                    action={(v) => saveTournament({
                      id: t.id, name: t.name, sport: t.sport, format: t.format,
                      description: t.description ?? "",
                      startDate: t.start_date, endDate: t.end_date,
                      city: t.city ?? "", stateProvince: t.state_province ?? "",
                      status: t.status, isPublished: v, isFeatured: t.is_featured,
                    })}
                    ariaLabel="Publish toggle"
                  />
                </td>
                <td className="px-4 py-3">
                  <AdminToggle
                    initial={t.is_featured}
                    action={(v) => saveTournament({
                      id: t.id, name: t.name, sport: t.sport, format: t.format,
                      description: t.description ?? "",
                      startDate: t.start_date, endDate: t.end_date,
                      city: t.city ?? "", stateProvince: t.state_province ?? "",
                      status: t.status, isPublished: t.is_published, isFeatured: v,
                    })}
                    ariaLabel="Feature toggle"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButton
                    action={deleteTournament.bind(null, t.id)}
                    label="Delete"
                    variant="danger"
                    confirm={`Delete tournament "${t.name}"?`}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-asf-muted text-sm">No tournaments yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
      {children}
    </th>
  );
}
