"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { createPoll } from "../actions";

export function NewPollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [days, setDays] = useState(7);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function addOption() {
    if (options.length >= 4) return;
    setOptions((o) => [...o, ""]);
  }
  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions((o) => o.filter((_, i) => i !== idx));
  }
  function updateOption(idx: number, v: string) {
    setOptions((o) => o.map((x, i) => (i === idx ? v : x)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await createPoll({ question, options, closesInDays: days });
      if (r.ok && r.id) {
        toast.success("Poll created");
        router.push(`/polls/${r.id}`);
      } else if (!r.ok) {
        toast.error(r.message);
        setErr(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-6 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="question">Question</Label>
          <span className={question.length > 280 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {question.length} / 280
          </span>
        </div>
        <Textarea
          id="question"
          required
          rows={2}
          maxLength={280}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Who wins Afghan Cup 2026?"
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <ul className="space-y-2">
          {options.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                value={o}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                maxLength={80}
              />
              {options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${i + 1}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md text-asf-muted hover:bg-asf-red-light hover:text-asf-red"
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {options.length < 4 ? (
          <Button
            type="button"
            onClick={addOption}
            className="h-9 bg-asf-off-2 text-asf-text hover:bg-asf-navy hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Add option
          </Button>
        ) : null}
      </div>

      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="days">Closes in (days)</Label>
        <Input
          id="days"
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 1)}
        />
        <p className="text-xs text-asf-muted">Min 1, max 30 days.</p>
      </div>

      <Button
        type="submit"
        disabled={pending || question.length < 5 || options.filter((o) => o.trim()).length < 2}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
      >
        {pending ? "Creating" : "Create poll"}
      </Button>
    </form>
  );
}
