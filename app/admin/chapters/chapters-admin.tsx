"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { StatePicker } from "@/components/shared/state-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { ActionButton } from "../_action-button";
import { AdminToggle } from "../_toggle";
import { saveChapter, deleteChapter } from "../_chapters-actions";

export type ChapterRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
  state_province: string | null;
  city: string | null;
  manager_id: string | null;
  founded_year: number | null;
  is_active: boolean;
  member_count: number | null;
  team_count: number | null;
  logo_url?: string | null;
  banner_url?: string | null;
};

export function ChaptersAdmin({ rows, userId }: { rows: ChapterRow[]; userId: string }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [manager, setManager] = useState("");
  const [founded, setFounded] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "idle"; m: string }>({ kind: "idle", m: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveChapter({
        name,
        description: desc,
        countryCode: country,
        stateProvince: state,
        city,
        managerUsername: manager,
        foundedYear: founded ? Number(founded) : null,
        isActive: true,
        logoUrl,
        bannerUrl,
      });
      if (r.ok) {
        setMsg({ kind: "ok", m: "Saved." });
        setName(""); setDesc(""); setCity(""); setManager(""); setFounded("");
        setLogoUrl(null); setBannerUrl(null);
        window.setTimeout(() => window.location.reload(), 600);
      } else {
        setMsg({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-asf-text">Add chapter</h2>
        {msg.kind === "ok" ? <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{msg.m}</Alert> : null}
        {msg.kind === "err" ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{msg.m}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Chapter name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manager">Manager username</Label>
            <Input id="manager" value={manager} onChange={(e) => setManager(e.target.value)} placeholder="username" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setState(""); }}
              className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
            >
              <option value="US">United States</option>
              <option value="AF">Afghanistan</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
          {country === "US" ? (
            <div className="space-y-1.5">
              <Label>State</Label>
              <StatePicker value={state} onChange={setState} />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="founded">Founded year</Label>
          <Input id="founded" type="number" value={founded} onChange={(e) => setFounded(e.target.value)} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <ImageUpload
              bucket="management"
              pathPrefix={`chapters/${userId}/logo`}
              initialUrl={logoUrl}
              maxBytes={2 * 1024 * 1024}
              aspectRatio="1/1"
              label="Upload logo"
              onUploaded={(u) => setLogoUrl(u)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Banner (optional)</Label>
            <ImageUpload
              bucket="management"
              pathPrefix={`chapters/${userId}/banner`}
              initialUrl={bannerUrl}
              maxBytes={5 * 1024 * 1024}
              aspectRatio="16/6"
              label="Upload banner"
              onUploaded={(u) => setBannerUrl(u)}
            />
          </div>
        </div>

        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : "Add chapter"}
        </Button>
      </form>

      <div className="rounded-lg border border-asf-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border text-start">
            <tr>
              <Th>Name</Th>
              <Th>Location</Th>
              <Th>Members</Th>
              <Th>Active</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <Link href={`/chapters/${r.slug}`} className="text-asf-text font-medium hover:text-asf-red">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-asf-muted">
                  {[r.city, r.state_province, r.country_code].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3 text-asf-muted">
                  {r.member_count ?? 0} . {r.team_count ?? 0} teams
                </td>
                <td className="px-4 py-3">
                  <AdminToggle
                    initial={r.is_active}
                    action={(v) =>
                      saveChapter({
                        id: r.id,
                        name: r.name,
                        description: r.description ?? "",
                        countryCode: r.country_code ?? "US",
                        stateProvince: r.state_province ?? "",
                        city: r.city ?? "",
                        managerUsername: "",
                        foundedYear: r.founded_year ?? null,
                        isActive: v,
                      })
                    }
                    ariaLabel={`Active toggle for ${r.name}`}
                  />
                </td>
                <td className="px-4 py-3 text-end">
                  <ActionButton
                    action={deleteChapter.bind(null, r.id)}
                    label="Delete"
                    variant="danger"
                    confirm={`Delete chapter "${r.name}"?`}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-asf-muted text-sm">No chapters yet.</td>
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
