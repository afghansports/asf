import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Afghan Sports Federation collects, uses, and protects your personal information.",
};

/**
 * /privacy. Plain-language privacy policy describing what we collect, why,
 * what rights members have, and how to exercise them. Reviewed against GDPR
 * and CCPA. Not legal advice — for binding interpretation, retain counsel.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <article className="space-y-8 text-asf-text/90 leading-relaxed">
            <p className="text-sm text-asf-muted">Last updated: May 2026. Effective: May 2026.</p>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Summary</h2>
              <p>
                Afghan Sports Federation (ASF) runs this platform to connect Afghan athletes,
                teams, coaches, and fans across the world. We collect only what we need to run
                the service, never sell your data, and give you tools to download or delete your
                information at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Who we are</h2>
              <p>
                Afghan Sports Federation is a non-profit community organization. The data
                controller is the ASF Board, contactable at{" "}
                <a href="mailto:privacy@afghansportsfederation.com" className="text-asf-red underline underline-offset-4">
                  privacy@afghansportsfederation.com
                </a>
                . The platform is operated from Northern Virginia, USA.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">What we collect</h2>
              <p className="font-medium">Information you give us:</p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Account: email, password (stored hashed via Supabase Auth), date of birth for age verification.</li>
                <li>Profile: full name, username, bio, photo, country, state or province, city, sport, position, free-agent status.</li>
                <li>Optional: phone number, links to your other social accounts.</li>
                <li>Content you create: reels, comments, polls, match results, messages, team or event pages.</li>
                <li>Parental consent records, when applicable, for members aged 13 to 15.</li>
              </ul>
              <p className="font-medium pt-2">Information collected automatically:</p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Standard server logs: IP address, user agent, requested URL, timestamp. Retained 90 days.</li>
                <li>Aggregate usage metrics via Plausible Analytics (cookieless, no cross-site tracking).</li>
                <li>If you opt in: web push subscription endpoint, used only to deliver notifications you asked for.</li>
              </ul>
              <p className="font-medium pt-2">We do not collect:</p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Government IDs, social security numbers, or passport numbers.</li>
                <li>Financial account information. Payments, when offered, are handled by third-party processors.</li>
                <li>Precise GPS location. Country and city are entered by you.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Why we use it</h2>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Run the service: profile pages, teams, events, tournaments, reels, messaging.</li>
                <li>Notify you about activity you opted in to (mentions, follows, match updates).</li>
                <li>Moderate content and enforce community standards (see Trust &amp; Safety below).</li>
                <li>Comply with legal obligations and respond to lawful requests.</li>
                <li>Improve the platform via anonymous, aggregate analytics.</li>
              </ul>
              <p>We do not use your data for advertising or sell it to third parties.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Legal bases (GDPR)</h2>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Contract: to provide the service you signed up for.</li>
                <li>Consent: marketing emails, web push notifications, optional profile fields.</li>
                <li>Legitimate interest: security, abuse prevention, basic analytics.</li>
                <li>Legal obligation: responding to lawful requests, age and consent recordkeeping.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Service providers</h2>
              <ul className="list-disc ps-5 space-y-1.5">
                <li><strong>Supabase</strong> — database, authentication, file storage. EU and US regions.</li>
                <li><strong>Vercel</strong> — application hosting and edge delivery.</li>
                <li><strong>Resend</strong> — transactional email delivery.</li>
                <li><strong>Mux</strong> — video ingest and streaming, when reels are uploaded.</li>
                <li><strong>Cloudflare</strong> — content delivery network and DDoS protection.</li>
                <li><strong>Plausible</strong> — privacy-respecting analytics.</li>
                <li><strong>Sentry</strong> — error tracking; we strip personal data before transmission.</li>
              </ul>
              <p>
                Each provider is contractually bound to handle your data only for purposes we
                authorize. International transfers are covered by Standard Contractual Clauses.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Your rights</h2>
              <p>You can:</p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Access and download all your data from <em>Profile &gt; Edit profile &gt; Data export</em>.</li>
                <li>Correct inaccurate information directly in your profile settings.</li>
                <li>Delete your account from <em>Profile &gt; Edit profile &gt; Delete account</em>. Deletion is soft for 90 days, then permanent.</li>
                <li>Restrict processing or object to specific uses by emailing privacy@afghansportsfederation.com.</li>
                <li>Withdraw consent for marketing emails or web push at any time.</li>
                <li>Lodge a complaint with your local data protection authority.</li>
              </ul>
              <p>We respond to verified requests within 30 days.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Children and youth</h2>
              <p>
                The platform is not intended for children under 13. Members aged 13 to 15 must
                provide a parent or guardian email at signup; we email the guardian a consent link
                that must be confirmed before the account becomes active. Guardians can revoke
                consent at any time by emailing safeguarding@afghansportsfederation.com and the account will be
                deactivated immediately.
              </p>
              <p>
                For members under 18 we additionally:
              </p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Default privacy settings to the most restrictive option.</li>
                <li>Disable direct messages from non-followed adults.</li>
                <li>Apply enhanced moderation to content involving minors.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Trust &amp; Safety</h2>
              <p>
                We log moderation actions (reports, strikes, suspensions, appeals) for safety and
                accountability. Records of harassment, abuse, or safeguarding violations are
                retained even if you delete your account, in line with our duty to protect the
                community.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Cookies</h2>
              <p>
                We use strictly necessary cookies for sign-in, language preference, and security.
                Analytics is cookieless. We do not run third-party advertising trackers. You can
                manage preferences from the Cookie settings link in the footer.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Retention</h2>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Active account data: kept while your account is active.</li>
                <li>Server logs: 90 days.</li>
                <li>Soft-deleted accounts: 90 days, then permanent purge.</li>
                <li>Safeguarding records: minimum 7 years, longer if required by law.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Changes to this policy</h2>
              <p>
                If we materially change this policy, we will notify active members at least 30
                days in advance via email and an in-app banner. The current version date is at the
                top of the page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">Contact</h2>
              <p>
                Privacy questions:{" "}
                <a href="mailto:privacy@afghansportsfederation.com" className="text-asf-red underline underline-offset-4">privacy@afghansportsfederation.com</a>
                <br />
                Safeguarding:{" "}
                <a href="mailto:safeguarding@afghansportsfederation.com" className="text-asf-red underline underline-offset-4">safeguarding@afghansportsfederation.com</a>
                <br />
                Data protection requests:{" "}
                <a href="mailto:dpo@afghansportsfederation.com" className="text-asf-red underline underline-offset-4">dpo@afghansportsfederation.com</a>
              </p>
            </section>
          </article>
        </div>
      </section>
    </>
  );
}
