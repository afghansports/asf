"use client";

import { useState } from "react";
import Image from "next/image";
import { avatarSrc } from "@/lib/data/dicebear";

/**
 * Public ASF Team directory with category filter pills (All / Management /
 * Alumni / …). Categories come from the admin-editable list (passed in from the
 * server). Single responsive grid — capped at 2 columns on desktop, 1 on mobile.
 */

type Member = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  category: string;
};

// Local (client-safe) label helper — mirrors lib/team/categories.labelForCategory
// without importing the server module across the client boundary.
function labelFor(c: string): string {
  return c
    .split(/[-_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function TeamDirectory({
  members,
  categories,
}: {
  members: Member[];
  categories: string[];
}) {
  const [active, setActive] = useState<string>("all");

  // Only offer pills for categories that actually have members.
  const present = categories.filter((c) => members.some((m) => m.category === c));
  const pills = ["all", ...present];
  const filtered = active === "all" ? members : members.filter((m) => m.category === active);

  return (
    <div className="space-y-8">
      {pills.length > 2 ? (
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => {
            const isActive = active === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActive(p)}
                aria-pressed={isActive}
                className={`h-9 px-4 rounded-md border text-xs font-condensed font-bold tracking-[0.16em] uppercase transition-colors ${
                  isActive
                    ? "bg-asf-red text-white border-asf-red"
                    : "bg-white text-asf-text border-asf-border hover:border-asf-red hover:text-asf-red"
                }`}
              >
                {p === "all" ? "All" : labelFor(p)}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {filtered.map((m) => (
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
            </article>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-asf-muted text-sm py-8 text-center">No team members in this category.</p>
      ) : null}
    </div>
  );
}
