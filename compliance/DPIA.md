# Data Protection Impact Assessment (DPIA)

**Platform:** Afghan Sports Federation (ASF) community & sports platform
**Controller:** Afghan Sports Federation — _[FILL IN: registered legal entity, address]_
**DPO / data protection contact:** _[FILL IN: name, email]_
**Document owner:** _[FILL IN]_
**Version:** 1.0
**Date:** 2026-06-06
**Next review:** 2027-06-06 (or sooner on material change to processing)

> A DPIA is mandatory under **UK/EU GDPR Art. 35** because this platform (a) processes
> **children's data** at scale, (b) hosts **user-generated content including photos/video**,
> (c) operates **public profiles and social features** (large-scale monitoring of a
> publicly accessible space), and (d) performs **direct messaging**. This document is
> a living record and must be revisited before launching any new high-risk feature
> (e.g. live streaming, payments, background checks).

---

## 1. Description of the processing

### 1.1 Nature
ASF is a community and sports platform. It stores account data in **Supabase
(PostgreSQL + Auth + Storage)**, serves the app from **Vercel**, sends transactional
email via **Resend**, hosts/streams video via **Mux**, and captures errors via **Sentry**.
Processing includes account creation, public profiles, posting reels/photos/discussions,
direct messaging, polls, event/tournament participation, moderation, and notifications
(including web push).

### 1.2 Scope
- **Volume:** unbounded public sign-up; expected audience is the Afghan sporting
  diaspora worldwide plus athletes inside Afghanistan.
- **Geography:** global users, including the EU/UK and US. Data is currently stored in
  a **single US Supabase region** (see Risk R-7).
- **Special considerations:** the user base includes **minors** (sign-up permitted from
  age 13; parental-consent flow for under-16s) and individuals who may be at elevated
  personal risk given the Afghan political context (see Risk R-8).

### 1.3 Context
The platform is consumer-facing, public by default for profiles and content, with
private direct messaging. Users have a reasonable expectation that profile content is
public but that messages, contact details, and youth-safeguarding data are protected.

### 1.4 Purposes
Provide a sports community; enable discovery of teams/clubs/events; support athlete
profiles and stats; enable communication; maintain trust & safety (moderation); send
service and (opt-in) marketing communications.

---

## 2. Categories of data and data subjects

**Data subjects:** registered members (adults and minors 13+), parents/guardians
(consent contact), event/tournament participants, newsletter subscribers, contact-form
submitters, recovery requesters.

**Personal data processed (from the live schema):**

| Category | Fields / source | Notes |
|---|---|---|
| Identity | `profiles.full_name`, `username`, `avatar_url`, `bio` | Public by default |
| Contact | auth email; `profiles.phone`, `phone_country_code` | Email held in Supabase Auth; phone optional |
| Location | `country_code`, `state_province`, `city` | Coarse; user-supplied |
| Account/credentials | Supabase Auth (hashed password, session tokens) | Managed by Supabase |
| **Children's data** | `date_of_birth`, `parental_consent_email`, `parental_consent_confirmed_at` | Triggers age gating; **special care** |
| Sporting data | `is_player`, `sport`, `position`, `player_stats`, achievements | |
| User-generated content | reels (video), gallery photos, discussions, polls, comments | **Media = abuse/CSAM vector (R-1)** |
| Communications | direct messages (1:1 and group), notifications, push subscriptions | Private |
| Trust & safety | strikes, suspensions, reports, appeals, blocks | Includes allegations about others |
| Account recovery | `account_recovery_requests` (claimed identity, new email, free-text evidence) | New; manually reviewed |
| Preferences | `privacy_settings`, `email_notifications`, `show_email`, `show_phone` | |
| Telemetry | error events (Sentry), request logs (Vercel/Supabase) | Should exclude PII (R-5) |

**Special category data (Art. 9):** not intentionally collected. However, free-text
fields (bio, discussions, DMs, recovery evidence) and photos **may incidentally reveal**
religion, political opinion, or health. Treated as a residual risk (R-4), not a designed
processing purpose.

---

## 3. Necessity & proportionality

- **Lawful bases (Art. 6):**
  - *Contract* — account, profile, core platform features.
  - *Consent* — marketing/newsletter (opt-in), web push, non-essential cookies, and
    **parental consent for under-16s (Art. 8)**.
  - *Legitimate interests* — trust & safety / moderation, fraud and abuse prevention,
    service security (balanced against user rights; LIA to be recorded in RoPA).
  - *Legal obligation* — responding to lawful CSAM/illegal-content obligations.
- **Data minimisation:** phone, DOB precision, and location are user-supplied and
  optional beyond the age gate. Avatar/bio are optional.
- **Retention:** account data kept for the life of the account; a **deletion/recovery
  window** exists for account deletion (migration 012). Define explicit retention for
  logs, moderation records, and recovery requests in the RoPA.
- **Proportionality of the age gate:** date of birth is collected solely to enforce the
  13+ minimum and the under-16 parental-consent requirement — the least-intrusive way to
  meet the legal obligation.

---

## 4. Risk assessment

Scoring: Likelihood (L) and Severity (S) each 1–5; Risk = L×S. Status reflects controls
**as currently implemented in code**.

| # | Risk | L | S | Risk | Current controls | Residual mitigation (action) |
|---|---|---|---|---|---|---|
| **R-1** | **CSAM / illegal imagery** uploaded via reels/gallery | 3 | 5 | **15** | Reporting + admin moderation queue; suspensions | **OPEN — uploads are currently client-direct to storage (no server choke point). Scanning seam + fail-closed policy added (`lib/safety/csam.ts`); enforcement is NOT yet active. To close: run scanning server-side via a Supabase Storage finalize webhook or upload proxy, configure a provider (PhotoDNA / Cloudflare CSAM Tool / AWS Rekognition), and implement mandatory NCMEC/IWF reporting.** |
| **R-2** | **Grooming / unsafe adult-minor contact** in DMs | 3 | 5 | **15** | Age stored; blocks; reporting | **OPEN — enforce the "two-adult rule" / restrict unsolicited adult→minor DMs; default minors' DMs to connections only; safeguarding escalation path.** |
| R-3 | Account takeover via recovery abuse | 2 | 4 | 8 | Recovery is **admin-reviewed only**, never self-service; rate-limited; email change uses service role inside admin-gated action | Require documented out-of-band identity check before approval; log all approvals (reviewer id captured); consider MFA for admins. |
| R-4 | Incidental special-category data in free text / photos | 3 | 3 | 9 | Public-by-default expectation; user controls | Privacy notice clarity; easy delete; do not index sensitive fields for ML. |
| R-5 | PII leakage into logs / error tracking | 2 | 3 | 6 | Sentry configured | Scrub request bodies, emails, tokens from Sentry & server logs; set Sentry PII = off. |
| R-6 | Excessive admin access to all users' email/data | 3 | 3 | 9 | Admin gated by `is_admin`; service-role server-side only | Least-privilege admin roles; audit log of admin reads of PII; MFA. |
| R-7 | **No EU data residency** (single US region) | 3 | 3 | 9 | Standard contractual clauses via sub-processors | Document transfer mechanism (SCCs); evaluate EU region / data residency for EU subjects. |
| R-8 | Re-identification / safety risk for at-risk Afghan users | 2 | 5 | **10** | Coarse location; user controls visibility | Allow pseudonymous use; minimise precise location; clear guidance; rapid takedown. |
| R-9 | Notification/push tokens or DMs exposed by misconfigured RLS | 2 | 4 | 8 | RLS enabled per table | Run Supabase **security advisors** before launch; review every policy; deny-by-default verified. |
| R-10 | Children's consent not genuinely verified | 3 | 4 | 12 | Parental-consent **email** captured + confirmation timestamp | Strengthen verification beyond a single email click; record consent evidence; honour withdrawal. |

---

## 5. Measures to reduce risk (summary of actions)

**Must-fix before public launch (high residual risk):**
1. **R-1:** Integrate automated CSAM hash-matching at upload + reporting workflow.
2. **R-2 / R-10:** Enforce minor-safety controls in messaging and verify parental consent.
3. **R-9:** Run and clear Supabase security advisors; verify all RLS policies deny by default.
4. **R-5:** Disable PII capture in Sentry; scrub logs.

**Should-fix / document:**
5. **R-7:** Record the international-transfer mechanism (SCCs) and the public sub-processor list.
6. **R-3 / R-6:** Admin MFA + audit logging of PII access and recovery approvals.
7. Define explicit **retention periods** (logs, moderation, recovery requests, deleted-account window).

---

## 6. Consultation & sign-off

- **Data subjects / representatives consulted:** _[FILL IN]_
- **DPO advice:** _[FILL IN]_
- **ICO/lead supervisory authority prior consultation** (required if high residual risk
  cannot be reduced): _[assess after items in §5 are closed]_

| Role | Name | Decision | Date |
|---|---|---|---|
| Controller / responsible owner | _[FILL IN]_ | Approve / Reject | |
| DPO | _[FILL IN]_ | Advice given | |

**Outcome:** Processing may proceed for general (adult) community features once §5
must-fix items are closed. **Youth programs and any photo upload must not go live to the
public until R-1, R-2 and R-10 are mitigated.**
