"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { saveFaqItem } from "../_actions";

type Initial = {
  id?: string;
  question?: string;
  answer?: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
};

export function FaqForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [question, setQuestion] = useState(initial.question ?? "");
  const [answer, setAnswer] = useState(initial.answer ?? "");
  const [category, setCategory] = useState(initial.category ?? "general");
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order ?? 0));
  const [isActive, setIsActive] = useState(initial.is_active ?? true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await saveFaqItem({
        id: initial.id,
        question,
        answer,
        category,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      if (r.ok) router.push("/admin/faq");
      else setErr(r.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}
      <div className="space-y-1.5">
        <Label htmlFor="fq_q">Question</Label>
        <Input id="fq_q" required value={question} onChange={(e) => setQuestion(e.target.value)} disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fq_a">Answer</Label>
        <Textarea id="fq_a" required rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={pending} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="fq_cat">Category</Label>
          <select id="fq_cat" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm">
            <option value="general">General</option>
            <option value="registration">Registration</option>
            <option value="teams">Teams</option>
            <option value="events">Events</option>
            <option value="afghan_cup">Afghan Cup</option>
            <option value="volunteering">Volunteering</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fq_sort">Sort order</Label>
          <Input id="fq_sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label>Active</Label>
          <label className="inline-flex items-center gap-2 h-10">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-asf-text">Show on /faq</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-asf-border">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : initial.id ? "Save changes" : "Add question"}
        </Button>
      </div>
    </form>
  );
}
