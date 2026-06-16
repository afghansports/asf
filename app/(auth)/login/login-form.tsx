"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { GoogleOAuthButton } from "@/components/shared/google-oauth-button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params.get("error");
  const next = params.get("next") ?? "/dashboard";
  // Only offer Google sign-in when it's actually configured in Supabase Auth.
  // Set NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true (and configure the Google provider
  // in Supabase) to show it. Hidden by default so users aren't redirected to a
  // raw "provider is not enabled" error page.
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? decodeURIComponent(errorParam) : null
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    router.push(next);
    router.refresh();
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-asf-red hover:text-asf-red-dark font-medium"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
      >
        {submitting ? <LoadingSpinner size="sm" inline className="text-white" /> : "Sign in"}
      </Button>

      {googleEnabled && (
        <>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-asf-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-asf-muted">Or continue with</span>
            </div>
          </div>

          <GoogleOAuthButton next={next} />
        </>
      )}

      <p className="text-center text-sm text-asf-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-asf-red hover:text-asf-red-dark font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
}
