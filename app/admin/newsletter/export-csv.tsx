"use client";

import { Download } from "lucide-react";

type Row = {
  email: string;
  name: string | null;
  country_code: string | null;
  created_at: string;
};

export function ExportCsvButton({ rows }: { rows: Row[] }) {
  function download() {
    const header = "email,name,country,created_at";
    const body = rows
      .map((r) =>
        [
          escape(r.email),
          escape(r.name ?? ""),
          escape(r.country_code ?? ""),
          new Date(r.created_at).toISOString(),
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asf-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy-light disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5" aria-hidden />
      Export CSV
    </button>
  );
}

function escape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
