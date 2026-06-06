"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ImageUpload } from "@/components/shared/image-upload";
import { saveTeamMember } from "../_actions";

type Initial = {
  id?: string;
  name?: string;
  role?: string;
  bio?: string;
  photo_url?: string | null;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
};

function labelForCategory(c: string): string {
  return c
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function TeamMemberForm({
  userId,
  initial,
  categories,
}: {
  userId: string;
  initial: Initial;
  categories: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? "");
  const [role, setRole] = useState(initial.role ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photo_url ?? null);
  const [category, setCategory] = useState(initial.category ?? categories[0] ?? "management");
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order ?? 0));
  const [isActive, setIsActive] = useState(initial.is_active ?? true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await saveTeamMember({
        id: initial.id,
        name,
        role,
        bio,
        photoUrl,
        category,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      if (r.ok) router.push("/admin/team-members");
      else setErr(r.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tm_name">Name</Label>
          <Input id="tm_name" required value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tm_role">Role</Label>
          <Input id="tm_role" required value={role} onChange={(e) => setRole(e.target.value)} disabled={pending} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tm_bio">Bio</Label>
        <Textarea id="tm_bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} disabled={pending} />
      </div>

      <div className="space-y-1.5">
        <Label>Photo</Label>
        <div className="max-w-[12rem]">
          <ImageUpload
            bucket="management"
            pathPrefix={`uploads/${userId}`}
            initialUrl={photoUrl}
            maxBytes={5 * 1024 * 1024}
            aspectRatio="1/1"
            label="Upload photo"
            onUploaded={(u) => setPhotoUrl(u)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="tm_category">Category</Label>
          <select
            id="tm_category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {labelForCategory(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tm_sort">Sort order</Label>
          <Input id="tm_sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label>Active</Label>
          <label className="inline-flex items-center gap-2 h-10">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-asf-text">Show on /about/team</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : initial.id ? "Save changes" : "Add member"}
        </Button>
      </div>
    </form>
  );
}
