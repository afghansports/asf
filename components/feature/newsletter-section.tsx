import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { getContentBatch } from "@/lib/cms/site-content";

/**
 * NewsletterSection. CMS keys: newsletter_title, newsletter_subtitle.
 */
export async function NewsletterSection() {
  const c = await getContentBatch({
    newsletter_title: "Stay Connected with Afghan Sports",
    newsletter_subtitle:
      "Get updates on events, match results, and community news delivered to your inbox.",
  });

  return (
    <section className="w-full bg-asf-navy text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center flex flex-col items-center gap-5">
        <span className="inline-flex w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 items-center justify-center">
          <Mail className="w-5 h-5" aria-hidden />
        </span>
        <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight text-balance">
          {c.newsletter_title}
        </h2>
        <p className="text-white/75 leading-relaxed max-w-xl">
          {c.newsletter_subtitle}
        </p>
        <div className="w-full max-w-md mt-2">
          <NewsletterForm variant="section" />
        </div>
      </div>
    </section>
  );
}
