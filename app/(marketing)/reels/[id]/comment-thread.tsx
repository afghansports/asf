"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { FillImage } from "@/components/shared/optimized-image";
import { postReelComment } from "../actions";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export function CommentThread({
  reelId,
  initialComments,
  currentUser,
}: {
  reelId: string;
  initialComments: Comment[];
  currentUser: { id: string } | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setErr(null);
    start(async () => {
      const r = await postReelComment({ reelId, body });
      if (r.ok) {
        setComments((cs) => [
          {
            id: crypto.randomUUID(),
            body: body.trim(),
            created_at: new Date().toISOString(),
            author: null, // optimistic — will refresh on next page load
          },
          ...cs,
        ]);
        setBody("");
      } else {
        setErr(r.message);
      }
    });
  }

  return (
    <div className="rounded-lg bg-white border border-asf-border overflow-hidden">
      <p className="px-4 py-3 border-b border-asf-border font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-text">
        Comments ({comments.length})
      </p>

      {currentUser ? (
        <form onSubmit={onSubmit} className="p-4 border-b border-asf-border space-y-2">
          {err ? (
            <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red text-xs">{err}</Alert>
          ) : null}
          <Textarea
            rows={2}
            maxLength={500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment"
            disabled={pending}
          />
          <div className="flex items-center justify-between">
            <span
              className={
                body.length > 500
                  ? "text-xs text-asf-red"
                  : "text-xs text-asf-muted"
              }
            >
              {body.length} / 500
            </span>
            <Button
              type="submit"
              disabled={pending || !body.trim()}
              className="bg-asf-red text-white hover:bg-asf-red-dark h-9 px-4"
            >
              <Send className="w-3.5 h-3.5" aria-hidden />
              {pending ? "Posting" : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="p-4 text-sm text-asf-muted border-b border-asf-border">
          <Link href="/login" className="text-asf-red hover:underline">Sign in</Link> to comment.
        </p>
      )}

      <ul className="divide-y divide-asf-border max-h-[60vh] overflow-y-auto">
        {comments.length === 0 ? (
          <li className="p-6 text-center text-sm text-asf-muted">No comments yet.</li>
        ) : null}
        {comments.map((c) => (
          <li key={c.id} className="p-4 flex items-start gap-3">
            <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden shrink-0">
              {c.author?.avatar_url ? (
                <FillImage src={c.author.avatar_url} alt="" className="object-cover" sizes="32px" />
              ) : (
                <span aria-hidden>
                  {(c.author?.full_name ?? c.author?.username ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-asf-muted">
                {c.author?.username ? (
                  <Link href={`/profile/${c.author.username}`} className="text-asf-text font-medium hover:text-asf-red">
                    {c.author.full_name ?? `@${c.author.username}`}
                  </Link>
                ) : (
                  <span className="text-asf-text font-medium">You</span>
                )}
                <span className="ms-2">{relativeTime(c.created_at)}</span>
              </p>
              <p className="text-sm text-asf-text whitespace-pre-line break-words mt-1">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-US");
}
