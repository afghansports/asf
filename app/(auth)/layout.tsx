import Link from "next/link";

/**
 * Shared layout for /login, /signup, /forgot-password, /reset-password, /verify-email.
 * Centered single-column auth shell with ASF branding and minimal chrome.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col bg-asf-off">
      <header className="px-6 py-5 border-b border-asf-border bg-white">
        <Link href="/" className="inline-flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full bg-asf-navy text-white flex items-center justify-center font-condensed font-bold text-xs tracking-wider"
            aria-hidden
          >
            ASF
          </span>
          <span className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-text">
            Afghan Sports Federation
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <footer className="px-6 py-5 text-center text-xs text-asf-muted">
        <Link href="/" className="hover:text-asf-text">
          Back to home
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-asf-text">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-asf-text">
          Terms
        </Link>
      </footer>
    </main>
  );
}
