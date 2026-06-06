"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { sendMessage } from "../actions";
import { cn } from "@/lib/utils";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export function ThreadView({
  conversationId,
  currentUserId,
  initialMessages,
  othersReadThrough,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Msg[];
  othersReadThrough: string | null;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setErr(null);
    const draft = body.trim();
    start(async () => {
      const r = await sendMessage({ conversationId, body: draft });
      if (r.ok) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            sender_id: currentUserId,
            body: draft,
            created_at: new Date().toISOString(),
          },
        ]);
        setBody("");
      } else {
        setErr(r.message);
      }
    });
  }

  return (
    <div className="rounded-b-lg bg-white border border-asf-border flex flex-col h-[60vh]">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-asf-muted text-sm py-8">No messages yet. Say hello.</p>
        ) : null}
        {(() => {
          // Find the index of my last sent message (for the read indicator).
          let lastMineIdx = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender_id === currentUserId) {
              lastMineIdx = i;
              break;
            }
          }
          const myLastReadByOthers =
            lastMineIdx >= 0 &&
            othersReadThrough &&
            new Date(messages[lastMineIdx].created_at).getTime() <= new Date(othersReadThrough).getTime();

          return messages.map((m, i) => {
            const mine = m.sender_id === currentUserId;
            const showTime =
              i === 0 ||
              new Date(m.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000;
            const showReadIndicator = mine && i === lastMineIdx;
            return (
              <div key={m.id}>
                {showTime ? (
                  <p className="text-center text-[0.65rem] text-asf-muted my-2">
                    {new Date(m.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                ) : null}
                <div
                  className={cn(
                    "max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line break-words",
                    mine
                      ? "ml-auto bg-asf-red text-white rounded-br-sm"
                      : "mr-auto bg-asf-off-2 text-asf-text rounded-bl-sm",
                  )}
                >
                  {m.body}
                </div>
                {showReadIndicator ? (
                  <p className="text-right text-[0.65rem] text-asf-muted mt-0.5 pr-1">
                    {myLastReadByOthers ? "Read" : "Sent"}
                  </p>
                ) : null}
              </div>
            );
          });
        })()}
      </div>

      <form onSubmit={onSubmit} className="border-t border-asf-border p-3 space-y-2">
        {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red text-xs">{err}</Alert> : null}
        <div className="flex items-end gap-2">
          <Textarea
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Write a message... (Enter to send, Shift+Enter for newline)"
            maxLength={4000}
            className="resize-none"
            disabled={pending}
          />
          <Button
            type="submit"
            disabled={pending || !body.trim()}
            className="h-10 px-4 bg-asf-red text-white hover:bg-asf-red-dark"
          >
            <Send className="w-4 h-4" aria-hidden />
            {pending ? "Sending" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
