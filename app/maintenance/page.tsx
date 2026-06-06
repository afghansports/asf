import { Wrench } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export const metadata = {
  title: "Site under maintenance",
  description: "The Afghan Sports Federation site is briefly unavailable.",
};

/**
 * Maintenance landing page. Shown to non-admin visitors when
 * site_settings.maintenance_mode = "true". Admins bypass via middleware.
 */
export default function MaintenancePage() {
  return (
    <main className="min-h-screen w-full bg-asf-navy text-white flex items-center justify-center px-6 py-20">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)",
        }}
        aria-hidden
      />
      <div className="relative max-w-xl text-center space-y-6">
        <Logo size={88} href={null} />
        <span className="inline-flex w-12 h-12 rounded-full bg-asf-gold/20 ring-1 ring-asf-gold/40 items-center justify-center text-asf-gold">
          <Wrench className="w-5 h-5" aria-hidden />
        </span>
        <p className="font-condensed font-bold text-xs sm:text-sm tracking-[0.32em] uppercase text-asf-gold">
          Under maintenance
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">
          We will be back shortly.
        </h1>
        <p className="text-white/75 leading-relaxed max-w-md mx-auto">
          The Afghan Sports Federation site is briefly unavailable while we make
          updates. Thanks for your patience.
        </p>
      </div>
    </main>
  );
}
