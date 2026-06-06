import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Afghan Sports Federation account.",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red">
          Welcome back
        </p>
        <h1 className="font-display text-3xl font-black text-asf-text">Sign in</h1>
        <p className="text-sm text-asf-muted">
          Access your dashboard, teams, and events.
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
