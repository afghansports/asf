"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { avatarSrc } from "@/lib/data/dicebear";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  category: string; // 'board' | 'volunteer' | other
};

type Filter = "all" | "board" | "volunteer";

const FILTERS: { code: Filter; label: string }[] = [
  { code: "all", label: "All" },
  { code: "board", label: "Board" },
  { code: "volunteer", label: "Volunteers" },
];

export function TeamFilterPills({ members }: { members: TeamMember[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = members.filter((m) => filter === "all" || m.category === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Team filter">
        {FILTERS.map((f) => {
          const isActive = filter === f.code;
          return (
            <button
              key={f.code}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(f.code)}
              className={cn(
                "h-9 px-4 rounded-full font-condensed font-bold text-xs tracking-[0.18em] uppercase transition-colors",
                isActive
                  ? "bg-asf-red text-white"
                  : "bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-asf-muted text-sm py-8 text-center">No team members in this category yet.</p>
      ) : (
        <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <li key={m.id}>
              <article className="flex flex-col h-full p-6 rounded-lg bg-white border border-asf-border">
                <span className="relative inline-flex w-16 h-16 rounded-full overflow-hidden bg-asf-off-2 mb-4">
                  <Image
                    src={avatarSrc(m.photo_url, m.name)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                </span>
                <h3 className="font-display font-bold text-lg text-asf-text">{m.name}</h3>
                <p className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red mt-1">
                  {m.role}
                </p>
                {m.bio ? (
                  <p className="text-sm text-asf-muted leading-relaxed mt-3 whitespace-pre-line">
                    {m.bio}
                  </p>
                ) : null}
                <span
                  className={cn(
                    "mt-4 self-start inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase",
                    m.category === "board"
                      ? "bg-asf-gold-light text-asf-text"
                      : "bg-asf-navy/10 text-asf-navy"
                  )}
                >
                  {m.category === "board" ? "Board" : "Volunteer"}
                </span>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
