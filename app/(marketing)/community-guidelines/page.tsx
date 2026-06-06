import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "How we keep the Afghan Sports Federation community safe, respectful, and inclusive.",
};

/**
 * /community-guidelines — referenced from signup, every report dialog, every
 * suspension notice. Plain English. Not legal language. Linked to from
 * /privacy and /terms; see those for legal copy.
 */
export default function CommunityGuidelinesPage() {
  return (
    <>
      <PageHero
        eyebrow="Community Guidelines"
        title="How ASF keeps the community safe."
        subtitle="Plain rules in plain language. By using the platform you agree to follow these."
      />

      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-10 text-asf-text/90 leading-relaxed">
          <p className="text-asf-muted">
            ASF is built around sport, community, and respect. These rules apply to everything
            you do on the platform: posts, comments, reels, profile, team pages, events,
            messages, and reports. Breaking a rule can result in your content being removed,
            your account being suspended, or, for the worst violations, a permanent ban.
          </p>

          <article className="space-y-3">
            <SectionLabel>1. Be respectful</SectionLabel>
            <ul className="list-disc ps-5 space-y-1">
              <li>No personal attacks, slurs, or insults toward another user.</li>
              <li>No harassment, stalking, or repeated unwanted contact.</li>
              <li>Disagree about the game, not the person.</li>
            </ul>
          </article>

          <article className="space-y-3">
            <SectionLabel>2. No hate speech</SectionLabel>
            <p>
              We do not allow attacks based on ethnicity, tribe, religion, gender, sexuality,
              disability, or nationality. Afghanistan is a diverse community and ASF is open to
              everyone in it. We take this seriously: hate speech is one strike to a permanent
              ban depending on severity.
            </p>
          </article>

          <article className="space-y-3">
            <SectionLabel>3. No threats or violence</SectionLabel>
            <p>
              Direct threats to harm a person, team, or group result in an immediate permanent ban.
              This includes encouraging others to harm someone. We may report serious threats to
              law enforcement.
            </p>
          </article>

          <article className="space-y-3">
            <SectionLabel>4. Be honest</SectionLabel>
            <ul className="list-disc ps-5 space-y-1">
              <li>Do not impersonate other people, teams, or ASF staff.</li>
              <li>Do not submit false match results.</li>
              <li>Do not file false reports against others.</li>
              <li>Repeatedly filing reports that are determined to be false will limit your reporting ability.</li>
            </ul>
          </article>

          <article className="space-y-3">
            <SectionLabel>5. Keep it appropriate</SectionLabel>
            <ul className="list-disc ps-5 space-y-1">
              <li>No nudity or sexual content.</li>
              <li>No graphic violence or gore.</li>
              <li>Profile photos should show your face, not be misleading.</li>
              <li>This is a community space accessible to all ages, including teens.</li>
            </ul>
          </article>

          <article className="space-y-3">
            <SectionLabel>6. No spam</SectionLabel>
            <ul className="list-disc ps-5 space-y-1">
              <li>Do not post the same content repeatedly.</li>
              <li>Do not run unsolicited commercial promotions.</li>
              <li>Do not mass-follow or mass-message users you do not know.</li>
              <li>Do not buy, sell, or trade ASF accounts.</li>
            </ul>
          </article>

          <article className="space-y-3">
            <SectionLabel>7. Respect copyright</SectionLabel>
            <p>
              Only post content you created or have permission to share. Do not upload
              copyrighted music, broadcast footage, or other media you do not own. We respond to
              valid DMCA takedown requests at{" "}
              <a className="text-asf-red underline" href="mailto:dmca@afghansportsfederation.com">
                dmca@afghansportsfederation.com
              </a>
              . Repeat infringers are permanently banned.
            </p>
          </article>

          <article className="space-y-3">
            <SectionLabel>8. Protect young people</SectionLabel>
            <ul className="list-disc ps-5 space-y-1">
              <li>You must be at least 13 to use ASF.</li>
              <li>Users under 16 require a parent or guardian to confirm their account by email.</li>
              <li>Teams with players under 18 must list a safeguarding contact.</li>
              <li>Adults messaging or following minors in inappropriate ways will be permanently banned and reported to authorities.</li>
            </ul>
          </article>

          <article className="space-y-3">
            <SectionLabel>9. How we enforce</SectionLabel>
            <p>
              When you break a rule, the action depends on severity. Most violations follow a
              progressive system: warning → posting suspension → full suspension → permanent ban.
              Severe violations skip steps. You can appeal a suspension by replying to the
              suspension notice. We aim to review appeals within 7 days.
            </p>
          </article>

          <article className="space-y-3">
            <SectionLabel>10. How to report</SectionLabel>
            <p>
              On every post, reel, comment, profile, and message there is a Report button. Pick a
              category, optionally add details, and submit. Your identity is never shared with
              the reported person. You can also email{" "}
              <a className="text-asf-red underline" href="mailto:safety@afghansportsfederation.com">
                safety@afghansportsfederation.com
              </a>{" "}
              for urgent matters.
            </p>
          </article>

          <p className="text-xs text-asf-muted">
            Last updated: 2026. We may update these guidelines as the community grows. Material
            changes will be announced.
          </p>
        </div>
      </section>
    </>
  );
}
