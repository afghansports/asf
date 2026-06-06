"use client";

import { useState } from "react";
import { Link2, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ShareButtons. Per ASF_LAUNCH_PRD.md > Reusable Components.
 * WhatsApp + Copy Link, "Copied!" feedback for 2s.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard might be unavailable; ignore */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={wa}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-asf-green text-white font-condensed font-bold text-xs tracking-[0.16em] uppercase hover:bg-asf-green/90"
      >
        <Send className="w-3.5 h-3.5" aria-hidden />
        WhatsApp
      </a>
      <Button
        type="button"
        onClick={copy}
        className={
          copied
            ? "h-9 bg-asf-navy text-white hover:bg-asf-navy-light"
            : "h-9 bg-white text-asf-navy border border-asf-border hover:bg-asf-off-2"
        }
      >
        {copied ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Link2 className="w-3.5 h-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
