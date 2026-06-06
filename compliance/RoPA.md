# Records of Processing Activities (RoPA)

**Maintained under GDPR Article 30.**

**Controller:** Afghan Sports Federation (ASF) — _[FILL IN: legal entity, registered address]_
**Representative (if applicable):** _[FILL IN]_
**DPO / contact:** _[FILL IN: email]_
**Version:** 1.0 · **Date:** 2026-06-06 · **Next review:** 2027-06-06

> Retention periods marked _[CONFIRM]_ are proposed defaults and must be ratified by the
> controller. International transfers arise because sub-processors (Supabase, Vercel,
> etc.) host in the **US**; the safeguard is **Standard Contractual Clauses (SCCs)** in
> each sub-processor's DPA — _[CONFIRM each DPA is signed]_.

---

## A. Processing activities

### 1. Account management & authentication
- **Purpose:** create and secure member accounts.
- **Lawful basis:** contract; legitimate interest (security).
- **Data subjects:** members (13+).
- **Personal data:** email, hashed password & sessions (Supabase Auth), username.
- **Recipients / processors:** Supabase (auth, DB), Vercel (hosting).
- **Transfers:** US (SCCs).
- **Retention:** life of account; on deletion, purged after the recovery window _[CONFIRM: e.g. 30 days]_.
- **Security:** RLS, TLS, hashed credentials, service-role keys server-side only.

### 2. Public profiles & athlete data
- **Purpose:** member discovery, athlete profiles, sporting stats.
- **Lawful basis:** contract.
- **Data subjects:** members.
- **Personal data:** full name, avatar, bio, country/region/city, sport, position, `is_player`, `is_free_agent`, follower count, player stats, achievements.
- **Recipients:** public (profile is public by default); Supabase.
- **Retention:** life of account.
- **Security:** RLS; user-controlled visibility (`show_email`, `show_phone`, `privacy_settings`).

### 3. Children's data & parental consent
- **Purpose:** enforce 13+ minimum age and obtain parental consent for under-16s (Art. 8).
- **Lawful basis:** legal obligation (age assurance); consent (parental).
- **Data subjects:** minors (13–15), parents/guardians.
- **Personal data:** `date_of_birth`, `parental_consent_email`, `parental_consent_confirmed_at`.
- **Recipients:** Supabase; Resend (consent email).
- **Retention:** life of account; consent evidence retained while account active _[CONFIRM]_.
- **Security:** RLS; minimised; see DPIA R-2/R-10.

### 4. User-generated content (reels, gallery, discussions, polls, comments)
- **Purpose:** community content sharing.
- **Lawful basis:** contract; consent (publishing).
- **Data subjects:** members; incidentally, third parties appearing in media.
- **Personal data:** video, images, text, metadata, author id.
- **Recipients:** public; Mux (video hosting/streaming), Supabase Storage, (planned) Cloudflare CDN.
- **Transfers:** US (SCCs).
- **Retention:** until deleted by user or moderation.
- **Security:** RLS; reporting + moderation; **CSAM scanning = OPEN action (DPIA R-1)**.

### 5. Direct messaging
- **Purpose:** private member-to-member communication (1:1 and group).
- **Lawful basis:** contract.
- **Data subjects:** members.
- **Personal data:** message content, participants, timestamps.
- **Recipients:** intended recipients only; Supabase.
- **Retention:** until deleted by user / account deletion _[CONFIRM]_.
- **Security:** RLS (participants only); minor-contact controls = OPEN (DPIA R-2).

### 6. Trust & safety / moderation
- **Purpose:** keep the community safe; enforce rules.
- **Lawful basis:** legitimate interest (LIA recorded); legal obligation (illegal content).
- **Data subjects:** reported users, reporters, members.
- **Personal data:** strikes, suspensions, reports, appeals, blocks, shadow-ban flags, reasons, reviewer id.
- **Recipients:** ASF admins/moderators; Supabase.
- **Retention:** _[CONFIRM: e.g. 2 years after resolution]_ for accountability/appeals.
- **Security:** admin-gated; RLS; service-role server-side; audit logging = recommended (DPIA R-6).

### 7. Notifications & web push
- **Purpose:** service and engagement notifications.
- **Lawful basis:** contract (service); consent (push, marketing).
- **Personal data:** notification records, per-type preferences, push subscription endpoints/keys.
- **Recipients:** browser push services (e.g. FCM/APNs via Web Push), Supabase.
- **Retention:** until unsubscribed / subscription expires.
- **Security:** RLS; VAPID keys server-side.

### 8. Transactional & marketing email
- **Purpose:** verification, password reset, recovery, newsletter.
- **Lawful basis:** contract (transactional); consent (newsletter).
- **Data subjects:** members, newsletter subscribers.
- **Personal data:** email, name, message content.
- **Recipients / processor:** **Resend**.
- **Transfers:** US (SCCs).
- **Retention:** newsletter until unsubscribe; transactional per sending logs _[CONFIRM]_.

### 9. Account recovery (lost email access)
- **Purpose:** restore access for users who lost their email, without self-service takeover risk.
- **Lawful basis:** legitimate interest (account integrity); contract.
- **Data subjects:** locked-out members (or claimants).
- **Personal data:** `account_recovery_requests` — claimed username/email, full name, new email, free-text identity evidence, admin review notes, reviewer id, timestamps.
- **Recipients:** ASF admins; Supabase; Resend (reset link on approval).
- **Retention:** _[CONFIRM: e.g. 12 months]_ then purge; deny/cancel records kept for abuse detection.
- **Security:** no anon RLS (service-role writes); admin-only read/mutate; manual identity verification required (DPIA R-3).

### 10. Contact form & volunteer/team applications
- **Purpose:** respond to enquiries and applications.
- **Lawful basis:** legitimate interest; consent.
- **Personal data:** name, email, message; application details.
- **Recipients:** ASF admins; Supabase.
- **Retention:** _[CONFIRM: e.g. 12 months after resolution]_.

### 11. Error monitoring & logs
- **Purpose:** reliability, security, debugging.
- **Lawful basis:** legitimate interest.
- **Personal data:** should be **none/minimised** — IP, user-agent, error context (DPIA R-5: scrub PII).
- **Recipients / processor:** Sentry; Vercel; Supabase (logs).
- **Retention:** per provider defaults _[CONFIRM]_.

### 12. External sports data
- **Purpose:** display fixtures/results/standings.
- **Lawful basis:** legitimate interest.
- **Personal data:** generally none (public sports data); cached server-side.
- **Recipients / source:** football-data.org (and other sport sources).

---

## B. Sub-processor register

| Sub-processor | Service | Data | Location | Safeguard | DPA |
|---|---|---|---|---|---|
| Supabase | Database, Auth, Storage | All account & content data | US _[CONFIRM region]_ | SCCs | _[CONFIRM signed]_ |
| Vercel | Hosting, edge, logs | Request data, logs | US/global edge | SCCs | _[CONFIRM]_ |
| Resend | Transactional & marketing email | Email, name, content | US | SCCs | _[CONFIRM]_ |
| Mux | Video hosting/streaming | Reel video + metadata | US | SCCs | _[CONFIRM]_ |
| Sentry | Error monitoring | Telemetry (PII to be scrubbed) | US/EU _[CONFIRM]_ | SCCs | _[CONFIRM]_ |
| Cloudflare _(planned)_ | CDN / media | Media, IP | Global edge | SCCs | _[CONFIRM before enabling]_ |
| football-data.org | Sports data source | None (public data) | EU | n/a | n/a |

> This register is the source for the **public sub-processor list** referenced in the
> privacy policy. Publish a user-facing version at `/privacy/subprocessors` (or similar)
> and keep it in sync.

---

## C. Data subject rights — how they are met
- **Access / portability:** export account data on request _[CONFIRM mechanism]_.
- **Rectification:** profile edit; admin-assisted for email (account recovery).
- **Erasure:** account deletion with recovery window (migration 012).
- **Objection / restriction:** marketing opt-out; notification preferences.
- **Children:** parental rights honoured; consent withdrawal supported _[CONFIRM]_.
- **Response time:** within one month (GDPR), extendable for complexity.

## D. Open compliance actions (link to DPIA §5)
1. Sign/collect all sub-processor **DPAs**; publish the **public sub-processor list**.
2. Confirm and document **retention periods** marked _[CONFIRM]_.
3. Record the **legitimate-interests assessments (LIAs)** for activities 6, 9, 10, 11.
4. Add **CCPA "Do Not Sell/Share"** handling for US users (no sale of data — confirm and state).
5. Decide **EU data residency** / document transfer reliance (DPIA R-7).
