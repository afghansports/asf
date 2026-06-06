"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postDiscussionReply } from "./actions";

export function ReplyForm({ discussionId }: { discussionId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setErr(null);
    start(async () => {
      const r = await postDiscussionReply(discussionId, body.trim());
      if (!r.ok) {
        setErr(r.message);
        toast.error(r.message);
        return;
      }
      setBody("");
      toast.success("Reply posted");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-md bg-white border border-asf-border p-4 space-y-3">
      <Textarea
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        maxLength={4000}
        required
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-asf-muted">{body.length} / 4000</span>
        <Button
          type="submit"
          disabled={pending || body.trim().length === 0}
          className="bg-asf-red text-white hover:bg-asf-red-dark inline-flex items-center gap-1.5 h-9 px-4"
        >
          <Send className="w-3.5 h-3.5" />
          {pending ? "Posting" : "Reply"}
        </Button>
      </div>
      {err ? <p className="text-xs text-asf-red">{err}</p> : null}
    </form>
  );
}
