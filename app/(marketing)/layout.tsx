import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { BottomNav } from "@/components/layout/bottom-nav";

/**
 * Marketing layout. Wraps all public-facing pages with the global Navbar,
 * Footer, CookieBanner, and (on mobile) the BottomNav.
 *
 * The `pb-16 md:pb-0` on <main> reserves room for the bottom nav on
 * mobile so the last paragraph of any page isn't clipped by it.
 *
 * Auth (/login, /signup, etc.), /onboarding, /dashboard, and /admin/* have
 * their own self-contained shells and do NOT use this layout.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0 motion-safe:animate-fade-in">{children}</main>
      <Footer />
      <CookieBanner />
      <BottomNav />
    </div>
  );
}
