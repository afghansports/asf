import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  ToggleRight,
  FileEdit,
  Users,
  Shield,
  Flag,
  Gavel,
  Scale,
  Calendar,
  Trophy,
  Newspaper,
  ImageIcon,
  Building,
  Building2,
  Globe,
  HelpCircle,
  Video,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = { title: "Tutorial" };

/**
 * /admin/tutorial — plain-English how-to for every admin workflow.
 * Server component, no state. Designed to be read top-to-bottom on first visit
 * and dipped into later via the table of contents.
 */
export default function AdminTutorialPage() {
  return (
    <section className="space-y-8">
      <header className="flex items-start gap-3">
        <span className="inline-flex w-10 h-10 rounded bg-asf-navy text-white items-center justify-center">
          <BookOpen className="w-5 h-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text leading-none">Admin tutorial</h1>
          <p className="mt-1 text-sm text-asf-muted">
            Simple guides for every admin task. Read once top-to-bottom, then come back here when you forget how to do
            something.
          </p>
        </div>
      </header>

      {/* Table of contents */}
      <nav className="rounded-lg border border-asf-border bg-white p-5">
        <p className="font-condensed font-bold text-[0.7rem] tracking-[0.22em] uppercase text-asf-muted mb-3">
          Table of contents
        </p>
        <ol className="grid gap-1.5 sm:grid-cols-2 text-sm text-asf-text">
          {TOC.map((t, i) => (
            <li key={t.id}>
              <a href={`#${t.id}`} className="inline-flex items-center gap-2 hover:text-asf-red">
                <span className="text-asf-muted font-mono text-xs w-6">{(i + 1).toString().padStart(2, "0")}.</span>
                {t.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1. Getting started */}
      <Card id="getting-started" icon={Lightbulb} title="1. Getting started">
        <Lead>
          The admin console is the back office for the entire site. Everything members see — articles, events, teams,
          rules, switches — is set from here.
        </Lead>
        <Steps>
          <Step>Open <code>/admin</code> in your browser. You must be signed in.</Step>
          <Step>Your account needs the admin flag. To make yourself admin one time, run this in Supabase SQL editor:
            <Code>{`update profiles set is_admin = true where username = 'YOUR_USERNAME';`}</Code>
          </Step>
          <Step>The left sidebar is split into <strong>Content</strong> (what members see) and <strong>Platform</strong> (settings, safety, modules).</Step>
          <Step>Anywhere you see a toggle switch, clicking it saves immediately. There is no Save button.</Step>
        </Steps>
        <Tip>
          If a link in the sidebar shows nothing useful, the module behind it might be disabled. See section 2.
        </Tip>
      </Card>

      {/* 2. Modules */}
      <Card id="modules" icon={ToggleRight} title="2. Turn features on or off — Modules">
        <Lead>
          Every feature on the site can be switched on or off platform-wide. Useful for soft launches, maintenance, or
          disabling something temporarily without removing code.
        </Lead>
        <Steps>
          <Step>
            Go to <Pill href="/admin/modules">Modules</Pill> in the sidebar.
          </Step>
          <Step>Find the feature you want to change. Categories: Core, Social, Content, Trust &amp; safety, Monetization, Integrations.</Step>
          <Step>Click the toggle on the right. Green = on, grey = off. Saves instantly.</Step>
          <Step>If you turn something off, the route still loads but renders a friendly &ldquo;feature unavailable&rdquo; page. Menu links also disappear from the navbar.</Step>
        </Steps>
        <Example>
          To disable comments on reels during a moderation incident, find <strong>module.reels.upload</strong> and toggle off. Members can still watch reels, but no new ones can be posted.
        </Example>
      </Card>

      {/* 3. Edit homepage + hero + Cup banner */}
      <Card id="cms" icon={FileEdit} title="3. Edit homepage, hero, banner, About, contact">
        <Lead>
          All public-facing copy lives in the CMS. No deployments needed — type and save.
        </Lead>
        <Steps>
          <Step>Sidebar → <Pill href="/admin/cms">CMS</Pill>. You will see sub-pages: Hero, Homepage stats, About, Contact, Afghan Cup banner, Footer.</Step>
          <Step>Click the area you want to edit (for example <em>Hero</em>).</Step>
          <Step>Edit any field. Click <strong>Save</strong>.</Step>
          <Step>Reload the public page (<Pill href="/">homepage</Pill>) to see the change.</Step>
        </Steps>
        <Example>
          Change the homepage headline: <em>CMS → Hero → Hero title → &ldquo;Welcome to ASF 2026&rdquo; → Save.</em>
        </Example>
      </Card>

      {/* 4. News */}
      <Card id="news" icon={Newspaper} title="4. Publish a news article">
        <Steps>
          <Step>Sidebar → <Pill href="/admin/news">News</Pill> → <strong>New article</strong>.</Step>
          <Step>Fill in <strong>Title</strong>, <strong>Slug</strong> (URL-friendly id, lowercase with dashes — e.g. <code>spring-cup-recap</code>), <strong>Excerpt</strong> (1–2 sentence summary), and <strong>Body</strong>.</Step>
          <Step>Upload a hero image (JPG/PNG/WebP, max 5 MB).</Step>
          <Step>Toggle <strong>Published</strong> on. Save.</Step>
          <Step>Visit <Pill href="/news">/news</Pill> to see the article live.</Step>
        </Steps>
        <Tip>
          Use a punchy excerpt — it shows on news cards and in social previews.
        </Tip>
      </Card>

      {/* 5. Events */}
      <Card id="events" icon={Calendar} title="5. Create and approve events">
        <Lead>
          Anyone can submit events (if <code>module.events.create</code> is on). They land in your queue for approval before going public.
        </Lead>
        <Steps>
          <Step>Sidebar → <Pill href="/admin/events">Events</Pill>. The list shows pending + published events.</Step>
          <Step>To <strong>approve a submission</strong>: click the event → review details → click <strong>Publish</strong>.</Step>
          <Step>To <strong>create one yourself</strong>: click <strong>New event</strong>, fill in title, type, sport, date, location, banner, then save with <strong>Published</strong> toggled on.</Step>
        </Steps>
        <Example>
          <strong>Type</strong> = tournament / match / camp / community / other. <strong>Date</strong> uses your timezone but is stored in UTC.
        </Example>
      </Card>

      {/* 6. Tournaments + Matches */}
      <Card id="tournaments-matches" icon={Trophy} title="6. Tournaments and matches">
        <Steps>
          <Step><Pill href="/admin/tournaments">Tournaments</Pill> — create the tournament shell (name, sport, format, dates, registration window).</Step>
          <Step><Pill href="/admin/matches">Matches</Pill> — review match results submitted by team captains. The status flow is <em>scheduled → reported → confirmed</em>. If both captains report the same score, it auto-confirms within 48 hours.</Step>
          <Step>Disputed matches show in red. Click into the match, decide a final score, set status to <strong>confirmed</strong>.</Step>
        </Steps>
      </Card>

      {/* 7. Gallery */}
      <Card id="gallery" icon={ImageIcon} title="7. Add gallery photos">
        <Steps>
          <Step>Sidebar → <Pill href="/admin/gallery">Gallery</Pill>.</Step>
          <Step>Click <strong>Add image</strong>. Upload a JPG/PNG/WebP (max 5 MB).</Step>
          <Step>Fill in caption (optional), event name (optional), year (optional), sort order.</Step>
          <Step>Toggle <strong>Published</strong>. Save.</Step>
        </Steps>
        <Tip>
          Lower sort order = appears first. Use 10, 20, 30 so you can squeeze new ones in between later.
        </Tip>
      </Card>

      {/* 8. Sponsors */}
      <Card id="sponsors" icon={Building2} title="8. Add or update a sponsor">
        <Steps>
          <Step>Sidebar → <Pill href="/admin/sponsors">Sponsors</Pill> → <strong>Add sponsor</strong>.</Step>
          <Step>Name, logo URL or upload, website URL, tier (<strong>platinum / gold / silver / partner</strong>), sort order.</Step>
          <Step>Toggle <strong>Active</strong>. Save. They appear on <Pill href="/sponsors">/sponsors</Pill> grouped by tier.</Step>
        </Steps>
      </Card>

      {/* 9. Reels */}
      <Card id="reels" icon={Video} title="9. Moderate reels (videos)">
        <Lead>
          Members post videos to <code>/reels/upload</code> — either by uploading a file (up to 100 MB) or pasting a YouTube link.
          Posts go live immediately. Your job is to remove bad ones, not to approve every good one.
        </Lead>
        <Steps>
          <Step>Sidebar → <Pill href="/admin/reels">Reels</Pill>. Sortable list with thumbnails.</Step>
          <Step>Click <strong>Hide</strong> to take a reel offline without deleting (it disappears from the feed but stays in the DB).</Step>
          <Step>Click <strong>Feature</strong> to promote a reel to the top of the feed.</Step>
          <Step>For repeat offenders, jump to <Pill href="/admin/moderation">Moderation</Pill> and issue a strike against the author (see section 13).</Step>
        </Steps>
      </Card>

      {/* 10. Teams + Chapters + Clubs + Federations */}
      <Card id="hierarchy" icon={Building} title="10. Hierarchy: federation → chapter → club → team">
        <Lead>
          The platform organizes everyone in a tree. <strong>Federation</strong> sits at the top (ASF), national and
          regional <strong>chapters</strong> live under it, <strong>clubs</strong> may operate one or more
          <strong> teams</strong>, and teams have rosters.
        </Lead>
        <Steps>
          <Step><Pill href="/admin/hierarchy">Hierarchy</Pill> — read-only tree view. Click any node to view its public page.</Step>
          <Step><Pill href="/admin/chapters">Chapters</Pill> — add or edit chapters. Assign a manager and deputy from your user list.</Step>
          <Step><Pill href="/admin/teams">Teams</Pill> — view every team. Click into a team to verify, feature, or hide it.</Step>
        </Steps>
        <Example>
          A new chapter: <em>Sidebar → Chapters → New → name &ldquo;ASF Stockholm&rdquo;, country SE, tier regional, parent &ldquo;ASF Germany&rdquo;, save</em>.
        </Example>
      </Card>

      {/* 11. Sports */}
      <Card id="sports" icon={Globe} title="11. Sports catalog">
        <Lead>
          The catalog drives the position picker, stat sheet, and match format options on team and player pages.
          Adding a new sport is a database change, not a code change.
        </Lead>
        <Steps>
          <Step>Sidebar → <Pill href="/admin/sports">Sports</Pill>. Read-only browser of the 13 seeded sports.</Step>
          <Step>To add a new sport, you (or a developer) inserts a row into <code>sports</code>, then matching rows into <code>sport_positions</code>, <code>sport_stats</code>, <code>sport_match_formats</code>, <code>sport_match_event_types</code>.</Step>
          <Step>Once seeded, the new sport appears in the team-creation dropdown automatically.</Step>
        </Steps>
      </Card>

      {/* 12. Users */}
      <Card id="users" icon={Users} title="12. Manage users">
        <Steps>
          <Step>Sidebar → <Pill href="/admin/users">Users</Pill>. Search by name or username.</Step>
          <Step>Click a user → view profile, teams, contact info.</Step>
          <Step><strong>Verify</strong> — gives them a blue checkmark on their public profile. Use for known officials, coaches, well-known community members.</Step>
          <Step><strong>Make admin</strong> — grants full access to this console.</Step>
          <Step><strong>Suspend</strong> — see section 13.</Step>
        </Steps>
      </Card>

      {/* 13. Moderation: strikes & suspensions */}
      <Card id="moderation" icon={Gavel} title="13. Moderation: strikes, suspensions, and bans">
        <Lead>
          ASF uses a three-tier suspension system. Start with a warning, escalate only if needed.
        </Lead>
        <Steps>
          <Step>Sidebar → <Pill href="/admin/moderation">Moderation</Pill>. Search for the user.</Step>
          <Step>Issue a <strong>strike</strong>: open the user → click &ldquo;Add strike&rdquo; → write a short reason (visible to the user) → save. They receive a notification.</Step>
          <Step>Issue a <strong>suspension</strong>: choose tier:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Read-only</strong>: can browse, cannot post or DM.</li>
              <li><strong>Write-restricted</strong>: cannot create teams or events.</li>
              <li><strong>Full</strong>: cannot use the platform at all.</li>
            </ul>
            Set duration (7d / 30d / permanent). Save.
          </Step>
          <Step>To <strong>lift early</strong>: open the user → click the active suspension → <strong>Lift now</strong>.</Step>
        </Steps>
        <Warning>
          Always write a clear reason. The user sees it on their suspended page and uses it when filing an appeal.
        </Warning>
      </Card>

      {/* 14. Reports */}
      <Card id="reports" icon={Flag} title="14. Reports queue">
        <Lead>
          Members can report any post, comment, profile, or message. Reports land here.
        </Lead>
        <Steps>
          <Step>Sidebar → <Pill href="/admin/reports">Reports</Pill>. Newest first.</Step>
          <Step>Each report shows the reporter, reported content, reason, and timestamp.</Step>
          <Step>Click <strong>View content</strong> to open it in a new tab. Click <strong>View reporter</strong> to check their report history.</Step>
          <Step>Decide:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Dismiss</strong> — false alarm. Marks the report as resolved.</li>
              <li><strong>Remove content</strong> — hides the post / comment.</li>
              <li><strong>Escalate</strong> — opens the moderation flow against the author.</li>
            </ul>
            Write a short internal note (only admins see it).
          </Step>
        </Steps>
        <Tip>
          Aim for &lt;24 hour response time on harassment reports. The platform tracks this metric automatically.
        </Tip>
      </Card>

      {/* 15. Appeals */}
      <Card id="appeals" icon={Scale} title="15. Review appeals">
        <Steps>
          <Step>Sidebar → <Pill href="/admin/appeals">Appeals</Pill>. Members who think a strike or suspension was unfair file from their <em>suspended</em> page.</Step>
          <Step>Open each appeal. You see the original moderation reason, the member&rsquo;s response, and links to the content.</Step>
          <Step>Click <strong>Uphold</strong> (sanction stays) or <strong>Overturn</strong> (sanction removed, user notified).</Step>
        </Steps>
        <Warning>
          The reviewer for an appeal must not be the same person who issued the original sanction. The system enforces this — you cannot see appeals on cases you decided.
        </Warning>
      </Card>

      {/* 16. Newsletter + Contact */}
      <Card id="newsletter-contacts" icon={Mail} title="16. Newsletter signups and contact messages">
        <Steps>
          <Step><Pill href="/admin/contacts">Contacts</Pill> — messages submitted through the public <code>/contact</code> form. Mark as read. Reply by email from your own inbox.</Step>
          <Step><Pill href="/admin/newsletter">Newsletter</Pill> — full list of subscribers. Export to CSV for Mailchimp / Resend / Beehiiv import.</Step>
        </Steps>
      </Card>

      {/* 17. Roles + persona switching */}
      <Card id="roles" icon={Shield} title="17. Personas: athlete, coach, manager, parent…">
        <Lead>
          Every account can hold multiple personas. The same person can be a coach, a parent, and a player. They
          switch which persona is &ldquo;active&rdquo; from their profile settings.
        </Lead>
        <Steps>
          <Step>Members manage their own personas at <Pill href="/profile/edit">/profile/edit</Pill> → <em>Personas</em>.</Step>
          <Step>You can grant or revoke any persona for any user from <Pill href="/admin/users">Users</Pill> → user → Personas section.</Step>
        </Steps>
        <Example>
          A youth coach who is also a parent: grant them both <em>coach</em> and <em>parent</em>. Their parent persona unlocks the guardian dashboard for linked minor accounts.
        </Example>
      </Card>

      {/* 18. External sports data */}
      <Card id="external-sports" icon={Send} title="18. External sports data (live scores + news)">
        <Lead>
          The site pulls Premier League / La Liga / NBA / cricket fixtures and ESPN headlines on a schedule. You can
          trigger a sync manually if needed.
        </Lead>
        <Steps>
          <Step>To pause the feed: <Pill href="/admin/modules">Modules</Pill> → toggle <strong>module.external_sports</strong> off.</Step>
          <Step>To run a manual sync: open a terminal and hit:
            <Code>{`curl -H "x-asf-cron-key: <CRON_SECRET>" https://YOUR_DOMAIN/api/cron/sync-sports`}</Code>
          </Step>
          <Step>Production runs this automatically every 30 minutes via Vercel cron.</Step>
        </Steps>
      </Card>

      {/* 19. FAQ + History */}
      <Card id="faq-history" icon={HelpCircle} title="19. Update FAQ and history timeline">
        <Steps>
          <Step><Pill href="/admin/faq">FAQ</Pill> — add a question and answer, choose a category, save. Shows on the public FAQ page.</Step>
          <Step><Pill href="/admin/history">History</Pill> — add a year + event for the about page timeline.</Step>
        </Steps>
      </Card>

      {/* 20. Common workflows */}
      <Card id="common" icon={CheckCircle2} title="20. Common workflows — cheat sheet">
        <Cheat title="Soft-launch the site">
          <li><Pill href="/admin/modules">Modules</Pill> → turn off <em>module.reels</em>, <em>module.polls</em>, <em>module.matches</em>, <em>module.tournaments</em> until you have content.</li>
          <li>Fill in CMS hero + Afghan Cup banner.</li>
          <li>Upload 5–10 real photos to the gallery.</li>
          <li>Add 2–3 news posts.</li>
          <li>Turn modules back on one at a time.</li>
        </Cheat>
        <Cheat title="Spam wave hits">
          <li><Pill href="/admin/settings">Settings</Pill> → toggle <strong>registration_enabled</strong> off temporarily.</li>
          <li><Pill href="/admin/reports">Reports</Pill> → bulk-dismiss obvious spam.</li>
          <li><Pill href="/admin/moderation">Moderation</Pill> → ban offending accounts (full suspension, permanent).</li>
        </Cheat>
        <Cheat title="Add a new chapter">
          <li><Pill href="/admin/chapters">Chapters</Pill> → New → fill name, country, tier (national/regional), parent.</li>
          <li>Assign a chapter manager (their username).</li>
          <li>They can now create teams under that chapter.</li>
        </Cheat>
        <Cheat title="Onboard a new sponsor">
          <li><Pill href="/admin/sponsors">Sponsors</Pill> → New.</li>
          <li>Upload logo, set tier, paste website URL.</li>
          <li>Save with Active = on. Done.</li>
        </Cheat>
        <Cheat title="A user emails asking to delete their account">
          <li>First, tell them: they can do it themselves from <em>/profile/edit → Delete account</em>.</li>
          <li>If they cannot, you do it: <Pill href="/admin/users">Users</Pill> → find them → <em>Soft delete</em>. Their content is hidden, their data is purged after 90 days.</li>
        </Cheat>
      </Card>

      {/* Glossary */}
      <Card id="glossary" icon={BookOpen} title="21. Glossary">
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Term term="Strike">A warning attached to a user&apos;s account. Three strikes typically trigger a suspension.</Term>
          <Term term="Suspension">A timed restriction. Read-only, write-restricted, or full.</Term>
          <Term term="Verify">Marks an account as trusted (blue checkmark). For real coaches, officials, well-known members.</Term>
          <Term term="Feature">Pin content to the top of a feed.</Term>
          <Term term="Soft delete">Account is hidden and inactive but data is kept 90 days, then permanently purged.</Term>
          <Term term="Persona">A role a user can switch to — athlete, coach, manager, parent, etc.</Term>
          <Term term="Module">A feature switch. On or off, platform-wide, from /admin/modules.</Term>
          <Term term="Cron">A scheduled background job (sync sports data, purge old soft-deleted accounts, etc).</Term>
          <Term term="RLS">Row Level Security — database rule that decides who can read/write what. Already configured.</Term>
          <Term term="Slug">URL-safe short id (e.g. <code>afghan-cup-2026</code>). Lowercase, dashes only.</Term>
        </dl>
      </Card>

      <p className="text-xs text-asf-muted text-center">
        Last updated: 2026 · Questions or things to add? Email{" "}
        <a href="mailto:dev@asf.org" className="text-asf-red underline underline-offset-4">dev@asf.org</a>
      </p>
    </section>
  );
}

const TOC: { id: string; title: string }[] = [
  { id: "getting-started", title: "Getting started" },
  { id: "modules", title: "Modules — feature toggles" },
  { id: "cms", title: "Edit homepage + copy" },
  { id: "news", title: "Publish a news article" },
  { id: "events", title: "Create and approve events" },
  { id: "tournaments-matches", title: "Tournaments and matches" },
  { id: "gallery", title: "Gallery photos" },
  { id: "sponsors", title: "Sponsors" },
  { id: "reels", title: "Moderate reels" },
  { id: "hierarchy", title: "Federation → chapter → club → team" },
  { id: "sports", title: "Sports catalog" },
  { id: "users", title: "Manage users" },
  { id: "moderation", title: "Strikes and suspensions" },
  { id: "reports", title: "Reports queue" },
  { id: "appeals", title: "Appeals" },
  { id: "newsletter-contacts", title: "Newsletter and contacts" },
  { id: "roles", title: "Personas" },
  { id: "external-sports", title: "External sports feed" },
  { id: "faq-history", title: "FAQ and history" },
  { id: "common", title: "Common workflow cheat sheet" },
  { id: "glossary", title: "Glossary" },
];

// ---------- small inline UI helpers ----------

function Card({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article id={id} className="scroll-mt-6 rounded-lg border border-asf-border bg-white p-6 sm:p-8 space-y-4">
      <header className="flex items-center gap-3">
        <span className="inline-flex w-8 h-8 rounded bg-asf-off-2 text-asf-navy items-center justify-center">
          <Icon className="w-4 h-4" aria-hidden />
        </span>
        <h2 className="font-display font-bold text-xl text-asf-text">{title}</h2>
      </header>
      <div className="space-y-3 text-sm text-asf-text/90 leading-relaxed">{children}</div>
    </article>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-asf-text/85">{children}</p>;
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-5 space-y-2">{children}</ol>;
}

function Step({ children }: { children: React.ReactNode }) {
  return <li className="pl-1">{children}</li>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-2 rounded-md bg-asf-navy text-white text-[0.75rem] p-3 overflow-x-auto font-mono">
      <code>{children}</code>
    </pre>
  );
}

function Pill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-2 py-0.5 rounded bg-asf-navy text-white text-[0.7rem] font-condensed font-bold tracking-wider uppercase hover:bg-asf-navy-light no-underline"
    >
      {children}
    </Link>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-asf-gold/50 bg-asf-gold-light p-3 text-sm text-asf-text flex items-start gap-2">
      <Lightbulb className="w-4 h-4 mt-0.5 text-asf-gold shrink-0" aria-hidden />
      <span><strong>Tip.</strong> {children}</span>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-asf-red/40 bg-asf-red-light p-3 text-sm text-asf-text flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 mt-0.5 text-asf-red shrink-0" aria-hidden />
      <span><strong>Be careful.</strong> {children}</span>
    </div>
  );
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-asf-border bg-asf-off p-3 text-sm text-asf-text/90">
      <span className="font-condensed font-bold tracking-wider uppercase text-[0.65rem] text-asf-muted mr-2">Example</span>
      {children}
    </div>
  );
}

function Cheat({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-asf-border bg-asf-off p-4">
      <p className="font-condensed font-bold text-[0.7rem] tracking-[0.18em] uppercase text-asf-red mb-2">{title}</p>
      <ol className="list-decimal pl-5 space-y-1 text-sm text-asf-text/90">{children}</ol>
    </div>
  );
}

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-display font-bold text-asf-text">{term}</dt>
      <dd className="text-asf-muted">{children}</dd>
    </div>
  );
}
