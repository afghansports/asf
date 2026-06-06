# ASF Platform — Session Handover (2026-06-06)

Next-session pickup doc for the Afghan Sports Federation platform. Read this first.

---

## 1. What this is & where it lives
- **App:** Next.js 14 (App Router) + TypeScript + Supabase. ~102 routes (public community site + `/admin` console).
- **Path:** `/Users/ag/Documents/ASF/asf-platform` — its **own git repo**. (The `/Users/ag` home dir is *also* a git repo → ignore it; unrelated projects show up in its status.)
- **GitHub:** `https://github.com/translatee2025/asf-platform` (private, branch `main`). `gh` CLI is authed as `translatee2025` (repo + workflow scopes) → `git push origin main` works. *User plans to move this to a new account later.*

## 2. Run it
```
cd /Users/ag/Documents/ASF/asf-platform
PORT=3009 npm run dev      # port 3000 is taken by another process; use 3009
```
→ http://localhost:3009 . **The dev server is NOT running at handover — start it.**
- `npx tsc --noEmit` for typecheck (run after every change; it stays green).
- `.env.local` exists (gitignored). `NEXT_PUBLIC_APP_URL=http://localhost:3009` for local (must match the running origin or OAuth/redirects break). `RESEND_API_KEY` empty (no email yet). No Sentry DSN.

## 3. Admin access
- URL: `/admin` (an "Admin" link shows in the user-menu dropdown + mobile drawer for admins).
- Login: **translatee.io.app@gmail.com** — a **temporary** password was set via the service key this session. **Rotate it** (`/profile/edit` → Change password). Real value is in the assistant's local memory, not this repo.
- Only one real admin; the other ~100 users are demo seeds (`demoNNN@asf.example`).

## 4. Supabase — IMPORTANT access nuance
- **Project:** `ASF` ref `pyhdnfwdmibhnfyyozsw` (East US/Ohio, free tier, **no backups configured**). It was *paused* earlier this session and unpaused — all data intact.
- **The Supabase MCP is connected to the WRONG account** (org "Translatee" `wrwwehvffumxdjgkjksj` — only has Translatee + greyparrot2, NOT ASF). So MCP `apply_migration`/`execute_sql`/`list_tables` **cannot touch ASF**.
- **The `supabase` CLI IS logged into ASF's account** (org `mtqbwglrxwfylaopvkrl`), linked to `pyhdnfwdmibhnfyyozsw`, DB password cached → **use the CLI for migrations**: `supabase db push --linked`.
- **Data-only** changes (no DDL) can be done with the **service-role key** (in `.env.local`) via the REST API — used this session to import the team roster and seed flags.
- *User plans to move Supabase to a new account later (re-link the CLI / update keys then).*

## 5. Migrations
- Numbered SQL files in `supabase/migrations/NNN_name.sql` (001–026). `COMBINED_*` and `URGENT_FIX*` files are ignored by the CLI (no timestamp pattern) — they were one-off manual fixes.
- CLI migration tracking was **empty** (001–023 had been applied out-of-band via the SQL editor). Fixed this session with `supabase migration repair --status applied 001 … 023`, then `db push`. **001–026 are now all tracked applied.** Future migrations: just `supabase db push --linked`.
- **Applied this session:** `024_account_recovery`, `025_asf_team_categories`, `026_seed_wall_discussions_flags`.

## 6. What was done this session
1. **Committed the whole app** (was uncommitted) + pushed to GitHub.
2. **Crash fixes (root cause):** server components passed inline-function props to client components — `action={() => fn(id)}` (ActionButton) and `action={(v) => fn(id,v)}` (AdminToggle). Next can't serialize those → "Functions cannot be passed to Client Components". Fixed ~24 call sites to **bound server actions** `action={fn.bind(null, id)}`. Full authenticated crawl: **61/61 routes clean**.
3. **Launch-quality:** real Dari + Pashto i18n bundles, Sonner success/error toasts on 13 mutation sites, 9 `loading.tsx` skeletons, **account-recovery** flow (admin-assisted; migration 024 + `/recover-account` + `/admin/recovery`), DPIA + RoPA (`compliance/`), CSAM scanning **seam** (`lib/safety/csam.ts`, not yet enforced — uploads are client-direct).
4. **Gallery rebuild:** 4 modes (upload image / upload video / image link / video+YouTube link), media kind detected from URL (`lib/gallery/media.ts`), compact upload box, public renders image/video/YouTube. No DB change.
5. **ASF Team module:** merged "Management Team" + "Volunteers" into one settings-driven module. `management_team.category` CHECK dropped (025) → categories are an **admin-editable list** in Settings (`team_categories` = `management,alumni`). **Volunteers → Alumni.** `/admin/volunteers` redirects to `/admin/team-members`. Public `/about/team` has filter pills (All/Management/Alumni) + 2-col grid (1 on mobile).
6. **Imported the real 25-person roster** (10 management, 15 alumni), replacing demo rows.
7. **Module show/hide:** per-page "Show on site" toggles on events/teams/matches/tournaments/sponsors/chapters/news; seeded missing `module.wall` + `module.discussions` flags (026) so **Talk & Wall are now toggleable** in `/admin/modules`.
8. **"CMS" → "Edit Content"** in the admin nav.

## 7. Gotchas (things that bit me — read before editing)
- **Never pass a function literal as a prop from a Server Component to a Client Component.** Use `serverAction.bind(null, ...args)`. This is the #1 crash class here.
- **Stale dev compiles:** after many rapid edits or a file delete, Next dev can serve corrupted/stale output (500s, "Failed to read source code" for a deleted file). **Fix = restart the dev server** (kill the port + `PORT=3009 npm run dev`). `rm -rf` is blocked by a safety guard, so don't rely on wiping `.next`.
- **Verify authed admin pages with a crawl, not just tsc.** tsc was green while pages 500'd. Mint a Supabase session cookie with `@supabase/ssr` (`signInWithPassword`, capture `setAll` cookies), curl admin routes with it, and detect the "Something went wrong" error-boundary text + grep the dev log for `⨯ Error`.
- Error pages return **HTTP 200** (the error boundary), so don't trust status codes alone.

## 8. Open items / next steps
**Product decisions (asked, awaiting user):**
1. **Central admin create forms** for New event / New team / New match. Today those pages have *no* admin create flow (events are member-submitted then approved; teams are user-created; matches are reported/synced), so no "New X" button was added. Build admin create forms if the federation should create them centrally.
2. **"Same for edit team"** — sports Teams (`/admin/teams`) category treatment; needs the category list (e.g. Men's/Women's/Youth).

**Ops / launch (from the original gap report, mostly untouched):**
- Deploy to a **web server** (user will provide SSH) + **GoDaddy DNS** (give A-records once IP known). Not on Vercel.
- `RESEND_API_KEY` (email — password reset, verification, account-recovery link all need it), Sentry DSN, `CRON_SECRET` in the host env, `vercel.json` crons (present) / equivalent.
- **CSAM scanning** is a seam only (`lib/safety/csam.ts`) — must be enforced server-side (Storage finalize webhook / upload proxy) before public photo upload. Background checks for coaches-with-minors not integrated.
- **Zero tests.** No CI. In-memory rate limiting (needs Upstash). No DB backups configured on the Supabase project.
- i18n: only ~20 keyed strings are translated; most UI is hardcoded English.

**Housekeeping:**
- Rotate the temp admin password.
- Move GitHub + Supabase to the user's new accounts when provided.
- `module.events` was observed `is_enabled=false` in the DB at one point — all module visibility is controlled at `/admin/modules`.

## 9. Commit history this session (newest first)
`aa45fb4` seed wall+discussions flags · `d4738c1` team filter pills + 2-col grid · `5d61133` module show/hide toggles · `340229d` ASF Team consolidation · `a0981da` gallery 4 modes + migration 025 · `83a38be` AdminToggle fix + CMS→Edit Content · `a129532` admin link + serialization fix · `5f98af3` launch-quality sprint · `eb701d9` full app snapshot.

## 10. Key file map
- Admin nav/shell: `app/admin/layout.tsx` · Admin server actions: `app/admin/_actions.ts` (`requireAdmin()`), `lib/safety/moderation.ts`
- Reusable admin widgets: `app/admin/_action-button.tsx`, `app/admin/_toggle.tsx` (both client; pass **bound** actions)
- Feature flags: `lib/features/flags.ts` + table `feature_flags`; UI `/admin/modules`
- Supabase clients: `lib/supabase/{client,server,public}.ts` (`createServiceClient()` = service role, server-only)
- ASF Team: `app/admin/team-members/*`, `lib/team/categories.ts`, public `app/(marketing)/about/team/*`
- i18n: `lib/i18n/messages.ts` · Gallery: `lib/gallery/media.ts`
