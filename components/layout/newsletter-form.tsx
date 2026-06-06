"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "./newsletter-actions";

/**
 * NewsletterForm. Inline email + Subscribe button. Posts via server action.
 * Per ASF_LAUNCH_PRD.md > STEP 4 > Footer > Newsletter signup.
 *
 * Three states (loading / error / success) per PRD reminder #9 (no silent failure).
 */
export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "section" }) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    startTransition(async () => {
      const result = await subscribeNewsletter(email);
      if (result.ok) {
        setStatus({ kind: "ok", message: result.message });
        setEmail("");
      } else {
        setStatus({ kind: "err", message: result.message });
      }
    });
  }

  const isFooter = variant === "footer";

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <div className="flex items-stretch gap-2">
        <Input
          type="email"
          required
          autoComplete="email"
          aria-label="Email address"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          className={
            isFooter
              ? "h-9 flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              : "h-10 flex-1"
          }
        />
        <Button
          type="submit"
          disabled={pending}
          className={
            isFooter
              ? "h-9 px-3 bg-asf-red hover:bg-asf-red-dark text-white"
              : "h-10 px-4 bg-asf-red hover:bg-asf-red-dark text-white"
          }
        >
          <Send className="w-3.5 h-3.5" aria-hidden />
          <span>{pending ? "Sending" : "Subscribe"}</span>
        </Button>
      </div>
      {status.kind === "ok" ? (
        <p
          role="status"
          className={
            isFooter
              ? "text-xs text-asf-green-light"
              : "text-sm text-asf-green"
          }
        >
          {status.message}
        </p>
      ) : null}
      {status.kind === "err" ? (
        <p
          role="alert"
          className={
            isFooter
              ? "text-xs text-asf-red-light"
              : "text-sm text-asf-red"
          }
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
