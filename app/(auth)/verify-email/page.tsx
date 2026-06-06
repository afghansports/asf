import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Your Email",
  description: "Confirm your email to finish creating your account.",
};

export default function VerifyEmailPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red">
          One more step
        </p>
        <h1 className="font-display text-3xl font-black text-asf-text">Check your inbox</h1>
      </div>

      <div className="space-y-6 bg-white border border-asf-border p-6 sm:p-8 rounded-md shadow-sm text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-asf-navy-pale text-asf-navy flex items-center justify-center">
          <Mail className="h-7 w-7" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-asf-text leading-relaxed">
            We sent a confirmation link to your email address.
          </p>
          <p className="text-sm text-asf-muted leading-relaxed">
            Click the link in the email to verify your account and finish signing in.
            The link expires in 24 hours.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <p className="text-xs text-asf-muted">
            Did not get the email? Check your spam folder, or sign up again.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm">
            <Link
              href="/signup"
              className="text-asf-red hover:text-asf-red-dark font-medium"
            >
              Try a different email
            </Link>
            <span className="text-asf-border">|</span>
            <Link
              href="/login"
              className="text-asf-red hover:text-asf-red-dark font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
