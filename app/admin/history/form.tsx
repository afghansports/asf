"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { saveHistoryEntry } from "../_actions";

type Initial = {
  id?: string;
  year?: number;
  title?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};

export function HistoryForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [year, setYear] = useState(String(initial.year ?? new Date().getFullYear()));
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order ?? 0));
  const [isActive, setIsActive] = useState(initial.is_active ?? true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await saveHistoryEntry({
        id: initial.id,
        year: Number(year) || new Date().getFullYear(),
        title,
        description,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      if (r.ok) router.push("/admin/history");
      else setErr(r.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="hi_year">Year</Label>
          <Input id="hi_year" type="number" required value={year} onChange={(e) => setYear(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="hi_title">Title</Label>
          <Input id="hi_title" required value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hi_desc">Description</Label>
        <Textarea id="hi_desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hi_sort">Sort order</Label>
          <Input id="hi_sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label>Active</Label>
          <label className="inline-flex items-center gap-2 h-10">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-asf-text">Show on /about/history</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : initial.id ? "Save changes" : "Add entry"}
        </Button>
      </div>
    </form>
  );
}
