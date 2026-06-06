"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle, Check } from "lucide-react";
import { SPORTS } from "@/lib/data/sports";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { saveOnboardingSports } from "../actions";
import { cn } from "@/lib/utils";

interface Props {
  defaultSelected: string[];
}

export function SportsForm({ defaultSelected }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSelected ?? [])
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function onSubmit() {
    if (selected.size === 0) {
      setError("Pick at least one sport.");
      return;
    }
    setError(null);

    const fd = new FormData();
    Array.from(selected).forEach((s) => fd.append("sports", s));

    startTransition(async () => {
      const res = await saveOnboardingSports(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="bg-white border border-asf-border rounded-md shadow-sm p-6 sm:p-8 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SPORTS.map((sport) => {
          const Icon = sport.icon;
          const isSelected = selected.has(sport.code);
          return (
            <button
              key={sport.code}
              type="button"
              onClick={() => toggle(sport.code)}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 p-5 rounded-md border-2 transition-all text-center",
                isSelected
                  ? "border-asf-red bg-asf-red-light text-asf-red shadow-sm"
                  : "border-asf-border bg-white text-asf-text hover:border-asf-navy hover:bg-asf-navy-pale"
              )}
            >
              {isSelected && (
                <span className="absolute top-2 end-2 w-5 h-5 rounded-full bg-asf-red text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <Icon className="h-7 w-7" aria-hidden />
              <span className="font-condensed font-bold text-sm tracking-[0.1em] uppercase">
                {sport.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-asf-muted">
        {selected.size === 0
          ? "Select at least one sport."
          : `${selected.size} selected`}
      </p>

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/onboarding"
          className="font-condensed font-bold text-xs tracking-[0.14em] uppercase text-asf-muted hover:text-asf-text px-4 h-11 inline-flex items-center"
        >
          Back
        </Link>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={pending || selected.size === 0}
          className="flex-1 bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
        >
          {pending ? (
            <LoadingSpinner size="sm" inline className="text-white" />
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
