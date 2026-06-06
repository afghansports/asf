import Link from "next/link";

/**
 * Onboarding shell. Same chrome as the auth shell, with a 3-step progress bar.
 * Per ASF_LAUNCH_PRD.md > STEP 3.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

      <div className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </main>
  );
}
