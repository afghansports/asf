"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { FillImage } from "@/components/shared/optimized-image";
import { startGroupConversation } from "../group-actions";
import { openConversation } from "../actions";

type Person = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export function NewGroupForm({ suggestions }: { suggestions: Person[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Debounced search.
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const supabase = createClient();
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .eq("is_active", true)
        .limit(10);
      setResults((data ?? []) as Person[]);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function add(p: Person) {
    if (picked.find((x) => x.id === p.id)) return;
    if (picked.length >= 30) {
      setErr("Max 30 participants.");
      return;
    }
    setPicked((s) => [...s, p]);
    setSearch("");
    setResults([]);
  }
  function remove(id: string) {
    setPicked((s) => s.filter((x) => x.id !== id));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (picked.length === 0) {
      setErr("Add at least one recipient.");
      return;
    }
    start(async () => {
      if (picked.length === 1) {
        const r = await openConversation({ recipientId: picked[0].id, firstMessage: body });
        if (!r.ok) {
          setErr(r.message);
          return;
        }
        const data = (r as { ok: true; data?: { kind: string; id?: string } }).data;
        if (data?.kind === "conversation" && data.id) {
          router.push(`/messages/${data.id}`);
        } else {
          router.push("/messages?tab=requests");
        }
        return;
      }
      const r = await startGroupConversation({
        memberIds: picked.map((p) => p.id),
        title: title.trim() || null,
        firstMessage: body,
      });
      if (r.ok && r.id) router.push(`/messages/${r.id}`);
      else if (!r.ok) setErr(r.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-6 space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      {/* Picked chips */}
      {picked.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {picked.map((p) => (
            <li key={p.id} className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full bg-asf-off-2 text-xs">
              <span className="relative inline-flex w-6 h-6 rounded-full bg-asf-navy text-white items-center justify-center font-bold text-[0.6rem] overflow-hidden">
                {p.avatar_url ? (
                  <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="24px" />
                ) : (
                  <span aria-hidden>{(p.full_name ?? p.username ?? "?").charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span>{p.full_name ?? `@${p.username}`}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.username}`}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-asf-red-light hover:text-asf-red"
              >
                <X className="w-3 h-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Search */}
      <div className="space-y-1.5">
        <Label htmlFor="search">Search by name or @username</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-asf-muted" aria-hidden />
          <Input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search"
            className="pl-9"
          />
        </div>
        {results.length > 0 ? (
          <ul className="rounded-md border border-asf-border bg-white max-h-64 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => add(p)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-asf-off-2 text-left"
                >
                  <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-bold text-[0.65rem] overflow-hidden">
                    {p.avatar_url ? (
                      <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="32px" />
                    ) : (
                      <span aria-hidden>{(p.full_name ?? p.username ?? "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-asf-text truncate">{p.full_name ?? p.username}</span>
                    <span className="block text-xs text-asf-muted">@{p.username}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {suggestions.length > 0 && results.length === 0 && search.length === 0 ? (
          <div className="space-y-2 mt-3">
            <p className="text-xs text-asf-muted font-condensed font-bold tracking-[0.18em] uppercase">
              People you follow
            </p>
            <ul className="grid gap-1.5">
              {suggestions.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => add(p)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-asf-off-2 text-left"
                  >
                    <span className="relative inline-flex w-7 h-7 rounded-full bg-asf-navy text-white items-center justify-center font-bold text-[0.65rem] overflow-hidden">
                      {p.avatar_url ? (
                        <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="28px" />
                      ) : (
                        <span aria-hidden>{(p.full_name ?? p.username ?? "?").charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-asf-text truncate">{p.full_name ?? p.username}</span>
                      <span className="block text-xs text-asf-muted">@{p.username}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {picked.length > 1 ? (
        <div className="space-y-1.5">
          <Label htmlFor="title">Group name (optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. NoVA Eagles captains"
            maxLength={80}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="body">First message (optional)</Label>
        <Textarea id="body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} />
      </div>

      <Button
        type="submit"
        disabled={pending || picked.length === 0}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
      >
        {picked.length > 1 ? <Users className="w-4 h-4" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
        {pending ? "Starting" : picked.length > 1 ? `Start group of ${picked.length + 1}` : "Send"}
      </Button>
      <p className="text-xs text-asf-muted">
        You will be added automatically. Group max 31 people total.
      </p>
    </form>
  );
}
