import { Lock } from "lucide-react";
import Link from "next/link";

/**
 * Friendly placeholder shown when an admin disables a module from /admin/modules.
 * Lets the user know the route still exists but the feature is off.
 */
export function ModuleDisabled({ name }: { name: string }) {
  return (
    <section className="min-h-[60vh] w-full bg-asf-off flex items-center">
      <div className="max-w-xl mx-auto px-4 sm:px-8 py-16 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-asf-off-2 text-asf-muted items-center justify-center mb-5">
          <Lock className="w-6 h-6" aria-hidden />
        </span>
        <h1 className="font-display font-black text-3xl text-asf-text mb-3">
          {name} is currently unavailable
        </h1>
        <p className="text-asf-muted">
          An administrator has temporarily disabled this section. Check back soon.
        </p>
        <Link
          href="/"
          className="inline-flex mt-6 h-10 px-5 items-center rounded-md bg-asf-navy text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-navy-light"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
