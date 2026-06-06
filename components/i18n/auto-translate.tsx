"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * AutoTranslate — client-side catch-all that translates visible English text to
 * the active Dari/Pashto locale via the cached /api/translate endpoint. Covers
 * the static UI chrome + any content not translated server-side. Defensive:
 *  - only runs for fa-AF / ps; skips /admin (operators keep precise English)
 *  - skips inputs, code, svg, [data-no-translate], already-Arabic, and non-Latin
 *  - tracks done nodes in a WeakSet + re-checks before writing, so setting text
 *    (a characterData mutation that re-fires the observer) can never loop
 *  - debounced + batched + cached (client Map + server DB) — repeat strings free
 * Server-rendered content (news/feed/etc.) is already Arabic, so it's skipped.
 */

const RTL_LOCALES = new Set(["fa-AF", "ps"]);
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE", "SVG", "PATH",
]);
const ARABIC = /[؀-ۿ]/;
const HAS_LATIN = /[A-Za-z]/;

function readLocale(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|; )asf_locale=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "en";
}

export function AutoTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    const locale = readLocale();
    if (!RTL_LOCALES.has(locale)) return;
    if (pathname && pathname.startsWith("/admin")) return; // keep the admin console in English

    const done = new WeakSet<Text>();
    const cache = new Map<string, string>();
    const LS_KEY = `asf_tr_${locale}`;
    // Warm the cache from localStorage so a returning reader sees instant
    // translations with no API round-trip (the DB cache already avoids re-hitting
    // Azure; this avoids even the fetch). Keyed by source text, so edited source
    // simply misses and re-fetches.
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) for (const [k, v] of Object.entries(JSON.parse(saved) as Record<string, string>)) cache.set(k, v);
    } catch {
      /* ignore corrupt/unavailable storage */
    }
    let queue = new Set<Text>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const eligible = (node: Text): boolean => {
      const raw = node.nodeValue;
      if (!raw) return false;
      const v = raw.trim();
      if (v.length < 2 || !HAS_LATIN.test(v) || ARABIC.test(v)) return false;
      if (done.has(node)) return false;
      const p = node.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName)) return false;
      if (p.isContentEditable || p.closest("[data-no-translate]")) return false;
      return true;
    };

    const collect = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        if (eligible(root as Text)) queue.add(root as Text);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) if (eligible(n as Text)) queue.add(n as Text);
    };

    const flush = async () => {
      const nodes = Array.from(queue).filter((n) => n.isConnected && eligible(n));
      queue = new Set();
      if (!nodes.length) return;

      const uniq = Array.from(new Set(nodes.map((n) => n.nodeValue!.trim())));
      const need = uniq.filter((t) => !cache.has(t));
      if (need.length) {
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: need, locale }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { translations: string[] };
          need.forEach((t, i) => cache.set(t, data.translations?.[i] || t));
          // Persist for next visit (cap entries so storage stays small).
          try {
            if (cache.size <= 3000) localStorage.setItem(LS_KEY, JSON.stringify(Object.fromEntries(cache)));
          } catch {
            /* storage full / unavailable — DB cache still covers us */
          }
        } catch {
          return; // transient — a later mutation/scroll will retry
        }
      }

      for (const node of nodes) {
        const key = node.nodeValue?.trim();
        if (!key) continue;
        done.add(node);
        const tr = cache.get(key);
        if (tr && tr !== key) {
          const orig = node.nodeValue || "";
          const lead = orig.match(/^\s*/)?.[0] ?? "";
          const trail = orig.match(/\s*$/)?.[0] ?? "";
          node.nodeValue = lead + tr + trail;
        }
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 200);
    };

    collect(document.body);
    schedule();

    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") collect(m.target);
        else m.addedNodes.forEach((nd) => collect(nd));
      }
      schedule();
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });

    return () => {
      obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
