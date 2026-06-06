"use client";

import { useEffect, useState, useTransition } from "react";
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
import { createTeam, checkSlug } from "./actions";

function slugifyClient(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function CreateTeamForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [sport, setSport] = useState<SportCode | "">("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  // Auto-derive slug from name unless user typed their own
  useEffect(() => {
    if (!slugTouched) setSlug(slugifyClient(name));
  }, [name, slugTouched]);

  // Check slug availability
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const id = window.setTimeout(async () => {
      const r = await checkSlug(slug);
      setSlugStatus(r.available ? "ok" : "taken");
    }, 350);
    return () => window.clearTimeout(id);
  }, [slug]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const result = await createTeam({
        name,
        slug,
        sport: sport || "",
        state,
        city,
        description,
        logoUrl,
        bannerUrl,
        isLookingForPlayers: looking,
      });
      if (result.ok) {
        toast.success("Team created");
        router.push(`/teams/${result.slug}`);
      } else {
        setErr(result.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {err ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="team_name">Team name</Label>
          <Input
            id="team_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            placeholder="Houston Wolves"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="team_slug">URL slug</Label>
            <span
              className={
                slugStatus === "ok"
                  ? "text-xs text-asf-green"
                  : slugStatus === "taken"
                  ? "text-xs text-asf-red"
                  : "text-xs text-asf-muted"
              }
            >
              {slugStatus === "ok" && "Available"}
              {slugStatus === "taken" && "Taken"}
              {slugStatus === "checking" && "Checking..."}
            </span>
          </div>
          <div className="flex items-stretch h-10 rounded-md border border-asf-border bg-white">
            <span className="inline-flex items-center px-3 text-asf-muted text-xs border-r border-asf-border">/teams/</span>
            <input
              id="team_slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugifyClient(e.target.value));
              }}
              disabled={pending}
              className="flex-1 bg-transparent px-3 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sport">Sport</Label>
          <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={pending}
          placeholder="Houston"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className={description.length > 500 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {description.length} / 500
          </span>
        </div>
        <Textarea
          id="description"
          rows={4}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
          placeholder="What is the team about?"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Logo</Label>
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
        <div className="space-y-1.5">
          <Label>Banner (optional)</Label>
          <ImageUpload
            bucket="team-logos"
            pathPrefix={`pending/${userId}/banner`}
            initialUrl={bannerUrl}
            maxBytes={5 * 1024 * 1024}
            aspectRatio="16/6"
            label="Upload banner"
            onUploaded={(u) => setBannerUrl(u)}
          />
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <span className="relative mt-0.5 inline-flex items-center">
          <input
            type="checkbox"
            checked={looking}
            onChange={(e) => setLooking(e.target.checked)}
            disabled={pending}
            className="peer sr-only"
          />
          <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
          <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </span>
        <span>
          <span className="block text-sm font-medium text-asf-text">Looking for players</span>
          <span className="block text-xs text-asf-muted leading-relaxed mt-0.5">
            Show a green badge so members know you are recruiting.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending || slugStatus === "taken" || slugStatus === "checking"}
          className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
        >
          {pending ? "Creating" : "Create team"}
        </Button>
      </div>
    </form>
  );
}
