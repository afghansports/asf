"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SportPicker } from "@/components/shared/sport-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { type SportCode } from "@/lib/data/sports";
import { createAdminTeam } from "../_actions";

export function TeamForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [captainUsername, setCaptainUsername] = useState("");
  const [sport, setSport] = useState<SportCode | "">("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await createAdminTeam({
        name,
        captainUsername,
        sport: sport || "",
        state,
        city,
        description,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        contactEmail,
        contactPhone,
        logoUrl,
        isAffiliate,
        isActive,
      });
      if (r.ok) {
        toast.success("Team created");
        router.push("/admin/teams");
      } else {
        setErr(r.message);
        toast.error(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="team_name">Team name</Label>
          <Input id="team_name" required value={name} onChange={(e) => setName(e.target.value)} disabled={pending} placeholder="Houston Wolves" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team_captain">Captain (@username)</Label>
          <Input
            id="team_captain"
            required
            value={captainUsername}
            onChange={(e) => setCaptainUsername(e.target.value)}
            disabled={pending}
            placeholder="username"
          />
          <p className="text-xs text-asf-muted">Must be an existing account. They become the team captain.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Sport</Label>
          <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team_city">City</Label>
          <Input id="team_city" value={city} onChange={(e) => setCity(e.target.value)} disabled={pending} placeholder="Houston" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="team_desc">Description</Label>
          <span className={description.length > 500 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {description.length} / 500
          </span>
        </div>
        <Textarea id="team_desc" rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} placeholder="What is the team about?" />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="team_founded">Founded year</Label>
          <Input id="team_founded" type="number" inputMode="numeric" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} disabled={pending} placeholder="2018" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team_email">Contact email</Label>
          <Input id="team_email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team_phone">Contact phone</Label>
          <Input id="team_phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={pending} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Logo</Label>
        <div className="max-w-[12rem]">
          <ImageUpload
            bucket="team-logos"
            pathPrefix={`pending/${userId}`}
            initialUrl={logoUrl}
            maxBytes={2 * 1024 * 1024}
            aspectRatio="1/1"
            label="Upload logo"
            onUploaded={(u) => setLogoUrl(u)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isAffiliate} onChange={(e) => setIsAffiliate(e.target.checked)} disabled={pending} /> ASF affiliate
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={pending} /> Active (visible on site)
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Creating" : "Create team"}
        </Button>
      </div>
    </form>
  );
}
