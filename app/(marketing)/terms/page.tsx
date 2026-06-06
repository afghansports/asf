import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Afghan Sports Federation platform.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" />
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <article className="space-y-8 text-asf-text/90 leading-relaxed">
            <p className="text-sm text-asf-muted">Last updated: May 2026. Effective: May 2026.</p>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">1. Agreement</h2>
              <p>
                These Terms of Service form a binding agreement between you and Afghan Sports
                Federation (&ldquo;ASF,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;) governing your access to and use of the
                website, mobile platform, and related services (the &ldquo;Service&rdquo;). By creating an
                account or using the Service you agree to these Terms and our Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">2. Eligibility</h2>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>You must be at least 13 years old.</li>
                <li>If you are 13 to 15, your parent or legal guardian must provide verifiable consent.</li>
                <li>You must provide accurate registration information and keep it up to date.</li>
                <li>You must not be barred from using the Service under applicable law.</li>
                <li>If you are using the Service on behalf of a team, club, or chapter, you confirm that you have authority to bind that organization.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">3. Your account</h2>
              <p>
                You are responsible for any activity on your account. Keep your password secure
                and notify us immediately at security@asf.org if you suspect unauthorized access.
                We strongly recommend enabling two-factor authentication from your profile settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">4. Acceptable use</h2>
              <p>You will not:</p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>Harass, threaten, or abuse other members.</li>
                <li>Post content that is hateful, sexually explicit, or inciting violence.</li>
                <li>Share private information about another person without their consent.</li>
                <li>Impersonate another person, team, official, or chapter.</li>
                <li>Use automated tools to scrape, mass-message, or otherwise exploit the Service.</li>
                <li>Upload malware, attempt to circumvent security, or probe for vulnerabilities without authorization.</li>
                <li>Use the Service for commercial advertising without prior written agreement.</li>
                <li>Violate the intellectual property rights of others.</li>
              </ul>
              <p>
                Conduct that endangers minors will result in immediate permanent termination and,
                where appropriate, referral to law enforcement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">5. Your content</h2>
              <p>
                You retain ownership of content you post (text, photos, video, comments). By
                posting, you grant ASF a worldwide, non-exclusive, royalty-free license to host,
                display, distribute, and adapt that content as needed to operate and promote the
                Service. This license ends when you delete the content, except for backups
                retained for a reasonable period and for moderation records as described in our
                Privacy Policy.
              </p>
              <p>
                You confirm that you have the rights to everything you post and that it does not
                infringe on anyone else&apos;s rights or violate any law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">6. Moderation, strikes, and suspensions</h2>
              <p>
                We may remove content, restrict features, or suspend accounts that violate these
                Terms or our Community Guidelines. The general progression is:
              </p>
              <ul className="list-disc ps-5 space-y-1.5">
                <li><strong>Strike:</strong> minor violation. Content removed; warning issued.</li>
                <li><strong>Read-only suspension:</strong> repeated minor violations. You can browse but cannot post for a defined period.</li>
                <li><strong>Full suspension:</strong> serious or repeated violations. You cannot access the Service.</li>
                <li><strong>Permanent termination:</strong> egregious violations, particularly involving safety of minors or repeated abuse.</li>
              </ul>
              <p>
                You can appeal any moderation action from your suspension page or by emailing
                appeals@asf.org. Appeals are reviewed by a moderator who was not involved in the
                original decision.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">7. Tournaments, events, and matches</h2>
              <p>
                Tournament rules, eligibility criteria, fees, and refund policies are set by the
                organizing committee for each event and posted on the relevant tournament page.
                ASF reserves the right to disqualify teams or players who violate event rules,
                falsify rosters, or engage in misconduct.
              </p>
              <p>
                Match results submitted on the platform are provisional until confirmed by both
                participating teams or by an ASF official. Disputed results are reviewed by the
                relevant chapter committee.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">8. Fees and payments</h2>
              <p>
                The core platform is free. Specific tournaments, camps, and clinics may charge an
                entry fee. Payments are handled by third-party processors and subject to their
                terms. Refund policies are set by the event organizer. Fee waivers for financial
                hardship are available on request.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">9. Intellectual property</h2>
              <p>
                The ASF name, logo, and the Service&apos;s design, code, and aggregated content are
                owned by Afghan Sports Federation. You may not use them without our written
                permission, except as needed to use the Service in line with these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">10. Third-party services</h2>
              <p>
                The Service relies on third-party providers including Supabase, Vercel, Resend,
                Mux, Cloudflare, and Plausible. Their terms apply to the portions of the Service
                they provide. We are not responsible for third-party websites or apps you reach
                through links posted on the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">11. Termination</h2>
              <p>
                You can delete your account at any time from <em>Profile &gt; Edit profile &gt;
                Delete account</em>. Deletion is soft for 90 days, after which it is permanent.
                We may suspend or terminate your access if you violate these Terms or if doing so
                is required to protect the Service or its users.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">12. Disclaimers</h2>
              <p>
                The Service is provided &ldquo;as is.&rdquo; We do our best to keep it secure, accurate, and
                available, but we make no warranty that it will be uninterrupted, error-free, or
                meet your specific requirements. We do not endorse user-generated content and are
                not responsible for the conduct of any user, on or off the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">13. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, ASF and its officers, directors,
                volunteers, and contractors are not liable for indirect, incidental, special,
                consequential, or punitive damages, or for loss of profits, data, or goodwill,
                arising out of or relating to your use of the Service. Our total liability for
                any claim arising under these Terms is limited to one hundred US dollars or the
                fees you paid us in the previous 12 months, whichever is greater.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">14. Indemnity</h2>
              <p>
                You agree to defend, indemnify, and hold harmless ASF from any claims, damages,
                losses, or expenses arising from content you post, your use of the Service, or
                your breach of these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">15. Governing law and disputes</h2>
              <p>
                These Terms are governed by the laws of the Commonwealth of Virginia, USA,
                without regard to its conflict-of-laws rules. Disputes will be resolved in the
                state or federal courts located in Fairfax County, Virginia, except where
                applicable consumer-protection law gives you additional rights.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">16. Changes</h2>
              <p>
                We may update these Terms from time to time. Material changes will be announced
                in advance via email and an in-app notice. Continued use after the effective date
                of an update constitutes acceptance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl text-asf-text">17. Contact</h2>
              <p>
                General:{" "}
                <a href="mailto:hello@asf.org" className="text-asf-red underline underline-offset-4">hello@asf.org</a>
                <br />
                Legal:{" "}
                <a href="mailto:legal@asf.org" className="text-asf-red underline underline-offset-4">legal@asf.org</a>
                <br />
                Appeals:{" "}
                <a href="mailto:appeals@asf.org" className="text-asf-red underline underline-offset-4">appeals@asf.org</a>
              </p>
            </section>
          </article>
        </div>
      </section>
    </>
  );
}
