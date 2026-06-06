import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";

/**
 * Global 404. Per ASF_LAUNCH_PRD.md > STEP 10 > 404 page.
 * Lives at app/not-found.tsx (root) so it covers ALL unmatched routes.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-asf-navy text-white flex items-center justify-center px-6 py-20">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)",
        }}
        aria-hidden
      />
      <div className="relative max-w-xl text-center space-y-6">
        <Logo size={72} href={null} />
        <p className="font-condensed font-bold text-sm tracking-[0.32em] uppercase text-asf-gold">
          404
        </p>
        <h1 className="font-display font-black text-5xl sm:text-6xl leading-tight">
          Page not found.
        </h1>
        <p className="text-white/75 leading-relaxed max-w-md mx-auto">
          The page you are looking for does not exist or has been moved. Try the homepage or browse
          events.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Go to homepage
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md border border-white/30 text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-white/10 transition-colors"
          >
            Browse events
          </Link>
        </div>
      </div>
    </main>
  );
}
