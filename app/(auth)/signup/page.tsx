import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join the Afghan Sports Federation community.",
};

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red">
          Join the community
        </p>
        <h1 className="font-display text-3xl font-black text-asf-text">Create your account</h1>
        <p className="text-sm text-asf-muted">
          One federation, every Afghan community.
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
