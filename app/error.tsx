"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Global error boundary. Per ASF_LAUNCH_PRD.md > STEP 12 > Error boundaries.
 * Catches uncaught exceptions in any route subtree and shows a friendly UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen w-full bg-asf-off flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center space-y-5">
        <span className="inline-flex w-12 h-12 rounded-full bg-asf-red-light text-asf-red items-center justify-center">
          <AlertTriangle className="w-6 h-6" aria-hidden />
        </span>
        <h1 className="font-display font-black text-3xl text-asf-text">Something went wrong.</h1>
        <p className="text-asf-muted leading-relaxed">
          An unexpected error happened while loading this page. Try again, or head back to the
          homepage.
        </p>
        {error.digest ? (
          <p className="text-xs text-asf-muted">Reference: {error.digest}</p>
        ) : null}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-red-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-asf-border text-asf-text text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-off-2"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
