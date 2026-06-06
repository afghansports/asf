"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ImageUpload } from "@/components/shared/image-upload";
import { saveSponsor } from "../_actions";

type Initial = {
  id?: string;
  name?: string;
  logo_url?: string | null;
  website_url?: string | null;
  tier?: string;
  sort_order?: number;
  is_active?: boolean;
};

export function SponsorForm({ userId, initial }: { userId: string; initial: Initial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url ?? null);
  const [websiteUrl, setWebsiteUrl] = useState(initial.website_url ?? "");
  const [tier, setTier] = useState(initial.tier ?? "general");
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order ?? 0));
  const [isActive, setIsActive] = useState(initial.is_active ?? true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await saveSponsor({
        id: initial.id,
        name,
        logoUrl,
        websiteUrl,
        tier,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      if (r.ok) router.push("/admin/sponsors");
      else setErr(r.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="sp_name">Sponsor name</Label>
        <Input id="sp_name" required value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
      </div>

      <div className="space-y-1.5">
        <Label>Logo</Label>
        <ImageUpload
          bucket="sponsors"
          pathPrefix={`uploads/${userId}`}
          initialUrl={logoUrl}
          maxBytes={2 * 1024 * 1024}
          aspectRatio="3/2"
          label="Upload logo"
          onUploaded={(u) => setLogoUrl(u)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sp_url">Website URL</Label>
        <Input id="sp_url" type="url" placeholder="https://..." value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={pending} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sp_tier">Tier</Label>
          <select id="sp_tier" value={tier} onChange={(e) => setTier(e.target.value)} className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm">
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="general">Community partner</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp_sort">Sort order</Label>
          <Input id="sp_sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label>Active</Label>
          <label className="inline-flex items-center gap-2 h-10">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-asf-text">Show on /sponsors</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : initial.id ? "Save changes" : "Add sponsor"}
        </Button>
      </div>
    </form>
  );
}
