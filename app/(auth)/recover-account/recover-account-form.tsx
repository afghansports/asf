"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { submitRecoveryRequest } from "./actions";

export function RecoverAccountForm() {
  const [claimedUsername, setClaimedUsername] = useState("");
  const [claimedEmail, setClaimedEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await submitRecoveryRequest({ claimedUsername, claimedEmail, fullName, newEmail, details });

    if (!res.ok) {
      setError(res.message);
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
          <h2 className="font-display text-xl font-black text-asf-text">Request received</h2>
          <p className="text-sm text-asf-muted">
            Our team will review your request and verify your identity. If approved, we will move your
            account to <strong className="text-asf-text">{newEmail}</strong> and send a link to set a new
            password. This is reviewed by a person, so it can take a few days.
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

      <p className="text-sm text-asf-muted">
        Use this only if you can no longer receive email at the address on your account. A team member
        will verify your identity before making any change.
      </p>

      <div className="space-y-2">
        <Label htmlFor="claimedUsername">Your username</Label>
        <Input
          id="claimedUsername"
          autoComplete="username"
          value={claimedUsername}
          onChange={(e) => setClaimedUsername(e.target.value)}
          placeholder="e.g. ahmad_k"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="claimedEmail">Old email on the account (if you remember it)</Label>
        <Input
          id="claimedEmail"
          type="email"
          value={claimedEmail}
          onChange={(e) => setClaimedEmail(e.target.value)}
          placeholder="old@example.com"
        />
        <p className="text-xs text-asf-muted">Provide your username or your old email (or both).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name on the account</Label>
        <Input
          id="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newEmail">New email you can access *</Label>
        <Input
          id="newEmail"
          type="email"
          autoComplete="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">How can we verify it&apos;s your account? *</Label>
        <Textarea
          id="details"
          required
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g. teams you manage, recent activity, your city, or anything that proves the account is yours."
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
      >
        {submitting ? <LoadingSpinner size="sm" inline className="text-white" /> : "Submit recovery request"}
      </Button>

      <p className="text-center text-sm text-asf-muted">
        Still have your email?{" "}
        <Link href="/forgot-password" className="text-asf-red hover:text-asf-red-dark font-medium">
          Reset your password instead
        </Link>
      </p>
    </form>
  );
}
