import Image from "next/image";

/**
 * Seasonal July 4th 2026 promo — the July 4th ABF (Afghan Basketball Federation)
 * Tournament, in collaboration with ASF. Renders directly under the Afghan Cup
 * banner on the homepage. Safe to remove after the event weekend (July 3–5, 2026):
 * delete this file + its <July4Tournament /> line in app/(marketing)/page.tsx.
 */

const DETAILS_IMG =
  "https://uixvnlgtzjngdaacscfp.supabase.co/storage/v1/object/public/events/july4-abf/details.jpeg";
const FOOD_IMG =
  "https://uixvnlgtzjngdaacscfp.supabase.co/storage/v1/object/public/events/july4-abf/food.jpeg";

const FLYERS = [
  {
    src: DETAILS_IMG,
    alt: "July 4th ABF Tournament — July 3–5, 2026 at Bethel Academy, Manassas VA. Free event, 14 Afghan teams across North America.",
  },
  {
    src: FOOD_IMG,
    alt: "July 4th ABF Tournament — food, specialty coffee, matcha, ice cream truck, and vendors.",
  },
];

export function July4Tournament() {
  return (
    <section
      aria-label="July 4th ABF Tournament"
      className="w-full bg-asf-off border-b border-asf-border"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <p className="text-center font-condensed font-bold text-[0.7rem] sm:text-xs tracking-[0.24em] uppercase text-asf-red">
          In collaboration with ASF · Independence Day Weekend
        </p>

        <div className="mt-4 max-w-2xl mx-auto text-center space-y-4">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight text-balance">
            Happy 4th of July
          </h2>
          <p className="text-asf-muted leading-relaxed">
            From all of us at the Afghan Sports Federation, we wish our community a joyful
            Independence Day. Freedom, family, and community are what this day is about — and what
            every court and field we play on is built on. Celebrate the long weekend with us at the{" "}
            <strong className="text-asf-text">July 4th ABF Tournament</strong>: 14 of the best Afghan
            teams across North America, great food, and good company.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {FLYERS.map((f) => (
            <div
              key={f.src}
              className="relative h-[400px] sm:h-[470px] rounded-xl overflow-hidden border border-asf-border bg-white shadow-sm"
            >
              <Image
                src={f.src}
                alt={f.alt}
                fill
                unoptimized
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-contain p-4"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
