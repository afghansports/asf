# ASF Platform — Session Handoff

> **Read this file first.** It is the single source of truth for picking up the build mid-stream. All other context is in `ASF_LAUNCH_PRD.md` and `PLAN.md` at this same directory level.

---

## Project in one paragraph

Afghan Sports Federation (ASF) is a 1998-founded non-profit (Northern Virginia, USA) running the Afghan Cup (28+ editions). We are building their **MVP launch website** to replace the current brochure. Five sports (Soccer, Basketball, Volleyball, Bowling, Table Tennis), USA-only Phase 1, English-only, email/password auth, anchored on Afghan Cup 2026 (July 2, 2026, Northern Virginia). Domain: `afghansportsfederation.com`.

The full long-term vision (geo hierarchy, Dari/Pashto, Phase 2 features) is in `ASF_PLATFORM_PRD.md` reference docs but **not** built in this phase. Build only what is in `ASF_LAUNCH_PRD.md`.

---

## Stack (locked, do not change)

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.35 (App Router, TypeScript) — **not 15** |
| Database | Supabase (Postgres + Auth + Storage) — new `sb_publishable_*` / `sb_secret_*` key format |
| Styling | Tailwind v3.4.1 |
| UI | shadcn/ui — **base-nova preset** (uses `@base-ui/react`, NOT Radix) |
| Email | Resend (no API key set yet — wrapper no-ops gracefully) |
| Auth | Supabase Auth, email/password only — **no Google OAuth** in this phase |
| Icons | Lucide v1.14.0 — line icons only, **no emoji icons** |
| Hosting | Vercel + GitHub Actions (not deployed yet) |

---

## Key project paths

```
/Users/ag/Documents/ASF/
├── HANDOFF.md                           ← THIS FILE
├── ASF_LAUNCH_PRD.md                    ← The full spec. PRD wins over PLAN.md.
├── PLAN.md                              ← Execution plan
└── asf-platform/                        ← The Next.js app
    ├── .env.local                       ← Supabase creds (gitignored, real keys)
    ├── .env.example
    ├── app/
    │   ├── layout.tsx                   ← Root layout with fonts + Toaster
    │   ├── globals.css                  ← Brand tokens + shadcn HSL primitives (Tailwind v3)
    │   ├── page.tsx                     ← Step 1 placeholder homepage
    │   ├── (auth)/                      ← /login, /signup, /forgot-password, /reset-password, /verify-email
    │   ├── auth/callback/route.ts       ← Supabase email-confirm callback
    │   ├── auth/signout/route.ts        ← POST sign-out
    │   ├── onboarding/                  ← 3-step flow (location, sports, community)
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                 ← Step 1: location
    │   │   ├── location-form.tsx
    │   │   ├── sports/
    │   │   ├── community/
    │   │   └── actions.ts               ← Server actions
    │   ├── dashboard/page.tsx           ← Step 2 placeholder dashboard
    │   └── api/username/check/route.ts  ← Live uniqueness check API
    ├── components/
    │   ├── ui/                          ← shadcn primitives (button, input, label, alert, popover, command, etc.)
    │   └── shared/                      ← CountryPicker, StatePicker, PasswordInput, LoadingSpinner, OnboardingProgress
    ├── lib/
    │   ├── data/                        ← countries.ts (195), us-states.ts (51), sports.ts (5+positions)
    │   ├── supabase/                    ← server.ts, client.ts, middleware.ts (SSR helpers)
    │   ├── email/resend.ts              ← Email wrapper (no-ops if RESEND_API_KEY blank)
    │   └── utils.ts                     ← cn helper
    ├── middleware.ts                    ← Auth gate for /dashboard, /admin, /profile/edit, /teams/*, /events/create, /onboarding
    ├── tailwind.config.ts               ← Brand colors (asf-red/navy/gold/green) + font families
    └── supabase/migrations/
        ├── 001_core_schema.sql          ✅ run
        ├── 002_rls_policies.sql         ✅ run
        ├── 003_seed.sql                 ✅ run
        ├── 004_storage_buckets.sql      ✅ run
        └── 005_seed_sample_teams.sql    ⚠️ needs admin profile to exist; see "DB state" below
```

---

## Build progress

| Step | Status | Notes |
|---|---|---|
| **1. Scaffold + DB migrations** | ✅ Done | 11 tables + 6 storage buckets + 37 RLS policies + 24 platform_config rows + 1 Afghan Cup event + 6 gallery placeholders. Migrations 001–004 ran. |
| **2. Auth pages** | ✅ Done, verified end-to-end | /login, /signup, /forgot-password, /reset-password, /verify-email, /auth/callback, /api/username/check, /dashboard placeholder. Signup → email verify → login round-trip works. |
| **3. Onboarding flow** | ✅ Code complete | 3 steps: location → sports → community. Server actions in `app/onboarding/actions.ts`. Sample teams migration 005 ready. **End-to-end test still pending** because user needs to (a) promote self to admin, (b) reset their onboarding flag, (c) run migration 005. |
| **4. Layout shell** | ⏳ Next | Navbar (logged-out + logged-in variants, mobile drawer), Footer (links, newsletter signup, cookie consent link), CookieBanner (localStorage `asf_cookie_consent`), PageHero, SectionLabel. See ASF_LAUNCH_PRD.md > STEP 4 for exact spec. |
| 5. Homepage | Pending | Video hero carousel, Cup countdown banner, stats bar, about teaser, sports grid, upcoming events, gallery teaser, newsletter, news teaser. Spec in PRD > STEP 5. |
| 6. About section | Pending | /about, /about/mission, /about/history, /about/team. Spec in PRD > STEP 6. |
| 7. Dashboard + profile | Pending | Real dashboard, /profile/[username], /profile/edit (4 tabs). |
| 8. Teams | Pending | /teams list + filters, /teams/[slug] detail, /teams/create wizard, /teams/manage. |
| 9. Events | Pending | /events list + filters + map, /events/[id], /events/create. |
| 10. Content + supporting pages | Pending | /gallery, /news, /sponsors, /faq, /contact, /privacy, /terms, /404. Wire Resend here. |
| 11. Admin panel | Pending | /admin/* — events, gallery, news, users, teams, contacts, newsletter. |
| 12. SEO + final polish | Pending | metadata, /og-image.png, robots.txt, sitemap.ts, mobile QA. |

---

## What the user needs to do BEFORE the next agent starts coding Step 4

The user must finish testing Step 3. Three SQL commands in Supabase SQL editor (`https://supabase.com/dashboard/project/pyhdnfwdmibhnfyyozsw/sql/new`):

```sql
-- 1. Promote the test account to admin (so migration 005 has a captain)
update profiles set is_admin = true where username = 'translateeioapp';

-- 2. Reset onboarding to retest the flow
update profiles set onboarding_completed = false, sport_interests = '{}'
where id in (select id from auth.users where email = 'translatee.io.app@gmail.com');
```

**3.** Run migration 005 (paste the file contents):
```
cat /Users/ag/Documents/ASF/asf-platform/supabase/migrations/005_seed_sample_teams.sql | pbcopy
```
…then paste into Supabase SQL editor → Run.

**4.** Visit `http://localhost:3000/onboarding` and walk Location → Sports → Community → Dashboard.

If onboarding works, Step 3 is verified and you're cleared to build Step 4.

---

## Database state (right now)

- **11 public tables**: profiles, teams, team_members, events, gallery_images, news_posts, newsletter_signups, contact_submissions, sponsors, follows, platform_config
- **6 storage buckets** (all public): avatars, team-logos, gallery, events, news, sponsors
- **37 RLS policies**, **24 platform_config rows**, **1 featured event** (Afghan Cup 2026), **12 gallery placeholders** (twice the expected 6 because user re-ran 003 — cosmetic)
- **0 teams** until migration 005 runs (then 6 sample teams)
- **Profiles**: `translatee.io.app@gmail.com` (username `translateeioapp`) is the only signed-up account. Need to promote to admin manually (see above).

---

## User accounts + credentials

- **Test user**: `translatee.io.app@gmail.com` (verified, signed up). Username after sanitisation = `translateeioapp`. Currently `is_admin = false`.
- **Designated admin email** (in `.env.local` `ADMIN_EMAILS` and `platform_config.admin_emails`): `agdcvakbl@gmail.com`. **No one has signed up with it yet.** That's why we manually promote the test account instead.
- **Supabase project ref**: `pyhdnfwdmibhnfyyozsw`. URL: `https://pyhdnfwdmibhnfyyozsw.supabase.co`
- All Supabase keys are in `.env.local` — do **not** commit, do **not** echo them.

---

## Recurring problems + fixes

### 1. Dev server CSS cache regression (HIGH frequency)

**Symptom**: Page renders unstyled (raw HTML). DevTools shows 404 on `/_next/static/css/app/layout.css`. Happens after editing `globals.css` or `tailwind.config.ts` while `npm run dev` is running.

**Fix** (always works, takes 10 seconds):
```
pkill -f "next dev" 2>/dev/null
sleep 2
cd /Users/ag/Documents/ASF/asf-platform
find .next -type f -delete 2>/dev/null
find .next -type d -empty -delete 2>/dev/null
npm run dev
```
Then hard reload browser: `⌘ + Shift + R`.

### 2. shadcn `Button` does not support `asChild`

**Why**: shadcn-nova preset uses `@base-ui/react` (not Radix UI). `asChild` is a Radix pattern; base-ui does not have it.

**Fix**: For `PopoverTrigger`, render the trigger directly with classes instead of wrapping a `<Button asChild>`. See `components/shared/country-picker.tsx` and `state-picker.tsx` for the working pattern.

### 3. Lucide v1.14 icon name changes

**Missing icons**: `Dribbble`, `Basketball`. **Existing**: `Goal`, `Volleyball`, `Circle`, `Disc`, `TableProperties`. Always check with `node -e "const l=require('lucide-react'); console.log(!!l.IconName)"` before importing.

### 4. TypeScript ES2015 target

`for (const x of Set)` fails to compile. Use `Array.from(set).forEach(...)` instead. Affects `components/shared/sports-form.tsx` style code.

### 5. Slow Supabase verification emails

Default Supabase email service uses shared SMTP — emails take 30s to 5min. This is fine for dev. Step 10 will replace it with Resend on `mail.afghansportsfederation.com` for sub-second delivery.

### 6. npm run build/dev from wrong directory

`/Users/ag/Documents/ASF/` has no package.json. The Next.js app is in `/Users/ag/Documents/ASF/asf-platform/`. Always `cd asf-platform/` first. (npm error: `ENOENT: no such file or directory, open '/Users/ag/Documents/ASF/package.json'`).

---

## Architectural decisions baked in (from earlier sessions)

1. **Reference data (countries, US states, sports) lives in TypeScript files** at `lib/data/*`, not DB tables. Static, no roundtrip needed, the PRD's Section 4 schema doesn't list them.
2. **Brand colors as `asf-*` Tailwind utilities**: `bg-asf-red`, `bg-asf-navy`, `text-asf-text`, etc. Defined in `tailwind.config.ts`. CSS vars in `globals.css`.
3. **Three font families via `next/font/google`** in `app/layout.tsx`: Playfair Display (display headings), Barlow Condensed (eyebrow/labels/buttons), DM Sans (body).
4. **All structured input is a dropdown** — country (CountryPicker, 195 with flags), state (StatePicker, 51), sport (SportPicker), phone (split). NEVER free text.
5. **No emoji icons** in UI — Lucide line icons only. The ONE exception: country flag emojis in CountryPicker (per PRD form rules).
6. **No long dashes** (em or en) in UI copy — use commas/colons/parens. PRD requirement.
7. **Server Components for data fetching, Client Components only for interactivity** — `lib/supabase/server.ts` for SSR, `lib/supabase/client.ts` for browser.
8. **Service-role client only in Route Handlers** — never expose to client. See `lib/supabase/server.ts` `createServiceClient()`.
9. **Resend wrapper no-ops gracefully** when `RESEND_API_KEY` is blank (logs to console). Build never crashes for missing email.
10. **Three states on every form**: loading (spinner on button) / error (red Alert) / success. Never silent failures.
11. **Middleware auth gate** at root `middleware.ts` redirects unauthenticated visits to `/dashboard`, `/admin/*`, `/profile/edit`, `/teams/(create|manage)`, `/events/create`, `/onboarding` → `/login?next=...`.
12. **`handle_new_user` trigger** auto-creates a profile on `auth.users` insert with derived username and admin flag based on `platform_config.admin_emails`.

---

## Step 4 spec (next agent's job)

From `ASF_LAUNCH_PRD.md > STEP 4`:

### Navbar component
- **Logged out**: `[Logo] [Home] [About v] [Events] [Teams] [Gallery] [News] [Login] [Join]`
- About dropdown: About ASF, Mission and Vision, History, Management Team
- **Logged in**: `[Logo] [Home] [Events] [Teams] [Gallery] [News] [Avatar dropdown]`
- Avatar dropdown: My Profile, My Team, Dashboard, Settings, Log Out
- **Mobile**: hamburger icon → slide-in drawer with same links

### Footer component
- Left: Logo + one-line description + email (`agdcvakbl@gmail.com`)
- Center columns: Quick Links, Sports, Connect (Facebook, email)
- Right: Newsletter signup form (email input + Subscribe button → INSERT into `newsletter_signups`)
- Bottom: Copyright, Privacy link, Terms link, "Cookie Settings" link

### CookieBanner
- Fixed bottom bar
- Copy: "We use cookies to improve your experience."
- Buttons: Accept (navy) / Decline (ghost)
- Store in `localStorage` key `asf_cookie_consent`. Hide once chosen.

### PageHero (reusable component)
- Full-width navy bg (`#223852`)
- Props: `eyebrow` (small red uppercase text), `title`, `subtitle`, optional `children`
- Optional bg texture: subtle diagonal lines at 3% opacity

### SectionLabel (reusable component)
- Red 2px left border, uppercase, Barlow Condensed, wide letter-spacing

**Implementation notes:**
- Place layout components in `components/layout/` (new dir)
- Place reusable hero/label in `components/shared/`
- The marketing pages will use the public Navbar+Footer; the dashboard already has its own simple header (replaced in Step 7)
- Newsletter form: client component posting via server action (use `lib/supabase/server.ts` service client to insert)

---

## Quick commands cheat sheet

```bash
# Always run from repo root
cd /Users/ag/Documents/ASF/asf-platform

# Dev server
npm run dev                                       # http://localhost:3000

# Production build (use to verify Step compiles cleanly)
npm run build

# Stale dev cache fix (CSS suddenly not loading)
pkill -f "next dev" 2>/dev/null
find .next -type f -delete 2>/dev/null
find .next -type d -empty -delete 2>/dev/null
npm run dev

# Copy a migration to clipboard for SQL editor
cat supabase/migrations/00X_*.sql | pbcopy

# Hit the Supabase SQL editor URL
open https://supabase.com/dashboard/project/pyhdnfwdmibhnfyyozsw/sql/new

# Smoke test all routes
for p in / /login /signup /forgot-password /verify-email /onboarding /dashboard; do
  echo -n "$p "
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000$p
done
```

---

## Useful one-shot SQL queries for the next session

```sql
-- See current users and their admin status
select p.username, p.full_name, p.is_admin, p.onboarding_completed, p.country_code, p.state_province, u.email
from profiles p join auth.users u on u.id = p.id
order by p.created_at;

-- Reset any user's onboarding to retest
update profiles set onboarding_completed = false, sport_interests = '{}'
where username = '<username>';

-- Promote any user to admin
update profiles set is_admin = true where username = '<username>';

-- Drop and re-add gallery placeholders if you want exactly 6
delete from gallery_images;
-- then re-run 003_seed.sql

-- See what teams exist (after migration 005)
select name, sport, city, state_province, captain_id, is_asf_affiliate from teams order by created_at;

-- See platform config
select key, value from platform_config order by key;
```

---

## How to brief the next agent

Paste this into a fresh Claude session:

> Continuing the ASF Platform MVP build. **Read `/Users/ag/Documents/ASF/HANDOFF.md` first** — it has every key decision, recurring fix, current state, and step-by-step location of files. Steps 1–3 are done in code. Currently waiting on the user to verify Step 3 onboarding end-to-end (three SQL commands listed in HANDOFF.md). Once they confirm, build Step 4 (Navbar/Footer/CookieBanner/PageHero/SectionLabel). The exact spec for Step 4 is in `ASF_LAUNCH_PRD.md > STEP 4` (also summarized in HANDOFF.md). Do not deviate from the PRD. Show me the design before writing 1000 lines of code.

That's it. The new agent reads HANDOFF.md, sees current state, executes.
