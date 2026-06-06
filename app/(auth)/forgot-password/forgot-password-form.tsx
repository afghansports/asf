"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="space-y-6 bg-white border border-asf-border p-6 sm:p-8 rounded-md shadow-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-asf-green-light text-asf-green flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-black text-asf-text">Check your inbox</h2>
          <p className="text-sm text-asf-muted">
            If an account exists for <strong className="text-asf-text">{email}</strong>,
            you will receive a reset link shortly.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm text-asf-red hover:text-asf-red-dark font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 bg-white border border-asf-border p-6 sm:p-8 rounded-md shadow-sm">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
      >
        {submitting ? <LoadingSpinner size="sm" inline className="text-white" /> : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-asf-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-asf-red hover:text-asf-red-dark font-medium">
          Back to sign in
        </Link>
      </p>
      <p className="text-center text-xs text-asf-muted">
        Lost access to your email?{" "}
        <Link href="/recover-account" className="text-asf-red hover:text-asf-red-dark font-medium">
          Recover your account
        </Link>
      </p>
    </form>
  );
}
