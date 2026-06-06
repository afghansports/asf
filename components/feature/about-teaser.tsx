import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SectionLabel } from "@/components/shared/section-label";
import { Logo } from "@/components/shared/logo";
import { getContentBatch } from "@/lib/cms/site-content";

/**
 * AboutTeaser. CMS keys: about_teaser_title, about_teaser_body,
 * about_teaser_bullet_1/2/3. Editable via /admin/cms/homepage.
 */
export async function AboutTeaser() {
  const c = await getContentBatch({
    about_teaser_title: "More Than Just Sports",
    about_teaser_body:
      "The Afghan Sports Federation has been building community through athletic excellence since 1998. We create pathways for Afghan Americans and Afghans worldwide to compete, connect, and celebrate their heritage through sport.",
    about_teaser_bullet_1: "Non-profit mission committed to the Afghan community",
    about_teaser_bullet_2: "Inclusive programs across five sports for all ages",
    about_teaser_bullet_3: "Connecting Afghan communities across the United States",
  });

  const bullets = [
    c.about_teaser_bullet_1,
    c.about_teaser_bullet_2,
    c.about_teaser_bullet_3,
  ].filter(Boolean);

  return (
    <section className="w-full bg-asf-off">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5 flex flex-col items-start gap-6">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-asf-red/10 blur-xl" aria-hidden />
            <Logo size={140} href={null} className="relative" />
          </div>
          <div className="hidden lg:block pt-4">
            <p className="font-condensed font-bold text-[0.7rem] tracking-[0.28em] uppercase text-asf-muted">
              Founded
            </p>
            <p className="font-display font-black text-3xl text-asf-text mt-1">1998</p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <SectionLabel>About ASF</SectionLabel>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight text-balance">
            {c.about_teaser_title}
          </h2>
          <p className="text-asf-text/85 leading-relaxed whitespace-pre-line">
            {c.about_teaser_body}
          </p>

          <ul className="grid gap-3 pt-2">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg bg-white border border-asf-border"
              >
                <span className="inline-flex w-7 h-7 rounded-full bg-asf-red/10 items-center justify-center text-asf-red shrink-0 mt-0.5">
                  <Check className="w-4 h-4" aria-hidden />
                </span>
                <span className="text-sm text-asf-text leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 font-condensed font-bold text-sm tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
            >
              Learn more about ASF
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
