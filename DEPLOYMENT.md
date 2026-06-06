# ASF Platform — Deployment

End-to-end deploy guide. Read top to bottom for first deploy; sections after #1 are mostly copy-paste once it's running.

---

## 1. Prerequisites

- Vercel account
- Supabase project at `https://pyhdnfwdmibhnfyyozsw.supabase.co` (already provisioned)
- GitHub repo for this codebase
- Domain registrar access for `afghansportsfederation.com`

Optional (added when traffic warrants):

- Resend account (transactional email)
- Cloudflare account (image CDN + edge cache)
- Mux or Cloudflare Stream (video hosting once reels traffic ramps)
- Upstash Redis (shared rate limit + cache)
- Plausible (privacy-friendly analytics)
- Sentry (error tracking)

---

## 2. Run all migrations in order

In the Supabase SQL editor, paste each in order. Idempotent so re-running is safe.

```bash
cat supabase/migrations/001_core_schema.sql                         | pbcopy
cat supabase/migrations/002_rls_policies.sql                        | pbcopy
cat supabase/migrations/003_seed.sql                                | pbcopy
cat supabase/migrations/004_storage_buckets.sql                     | pbcopy
cat supabase/migrations/005_seed_sample_teams.sql                   | pbcopy
cat supabase/migrations/006_cms_schema.sql                          | pbcopy
cat supabase/migrations/007_seed_cms.sql                            | pbcopy
cat supabase/migrations/008_storage_management.sql                  | pbcopy
cat supabase/migrations/009_fixes_and_teams.sql                     | pbcopy
cat supabase/migrations/010_geo_reels_calendar.sql                  | pbcopy
cat supabase/migrations/011_chapters_matches_tournaments.sql        | pbcopy
cat supabase/migrations/012_safety_gdpr_messaging.sql               | pbcopy
cat supabase/migrations/013_moderation_notifications_engagement.sql | pbcopy
cat supabase/migrations/014_polls_mentions_bookmarks.sql            | pbcopy
cat supabase/migrations/015_hashtag_follows_push_subscriptions.sql  | pbcopy
cat supabase/migrations/016_mux_locale_seed.sql                     | pbcopy
```

After 016, verify the new tables + columns exist:

```sql
select to_regclass('public.hashtag_follows'),
       to_regclass('public.push_subscriptions'),
       to_regclass('public.push_deliveries'),
       (select count(*) from information_schema.columns
         where table_schema='public' and table_name='reels'
           and column_name in ('mux_upload_id','mux_asset_id','mux_playback_id','processing_state'));
```

The first three should be table names (not null); the last should be 4.

After 014, verify the new tables exist:

```sql
select to_regclass('public.bookmarks'),
       to_regclass('public.reel_mentions'),
       to_regclass('public.match_scorers'),
       to_regclass('public.polls'),
       to_regclass('public.notifications'),
       to_regclass('public.user_blocks');
```

All six should return their table name (not `null`).

---

## 3. Push to GitHub + import on Vercel

```bash
cd /Users/ag/Documents/ASF/asf-platform
git init
git add .
git commit -m "Initial ASF platform deployment"
git branch -M main
git remote add origin git@github.com:<org>/asf-platform.git
git push -u origin main
```

On Vercel:
1. New Project → Import the repo
2. Framework: Next.js (auto-detected)
3. Root Directory: leave blank
4. Don't deploy yet — set env vars first

---

## 4. Vercel environment variables

In Vercel project Settings → Environment Variables (Production + Preview):

```
NEXT_PUBLIC_SUPABASE_URL          https://pyhdnfwdmibhnfyyozsw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     <anon key>
SUPABASE_SERVICE_ROLE_KEY         <service role key>

NEXT_PUBLIC_APP_URL               https://afghansportsfederation.com
NEXT_PUBLIC_APP_NAME              Afghan Sports Federation
ADMIN_EMAILS                      agdcvakbl@gmail.com

RESEND_API_KEY                    <key once Resend domain is verified>
EMAIL_FROM                        noreply@afghansportsfederation.com
EMAIL_ADMIN                       agdcvakbl@gmail.com

CRON_SECRET                       <generate a 32-char random string>

NEXT_PUBLIC_PLAUSIBLE_DOMAIN      afghansportsfederation.com
NEXT_PUBLIC_PLAUSIBLE_SRC         https://plausible.io/js/script.js

SENTRY_DSN                        <project DSN>
NEXT_PUBLIC_SENTRY_DSN            <same DSN>

# Web push (browser notifications). Generate with: node -e "console.log(require('web-push').generateVAPIDKeys())"
NEXT_PUBLIC_VAPID_PUBLIC_KEY      <public key>
VAPID_PRIVATE_KEY                 <private key>
VAPID_SUBJECT                     mailto:safeguarding@asf.org

# Mux (video ingest). Optional — falls back to Supabase Storage when unset.
MUX_TOKEN_ID                      <token id>
MUX_TOKEN_SECRET                  <token secret>
MUX_WEBHOOK_SECRET                <signing secret from Mux dashboard>

# Cloudflare image CDN. Optional — origins resolve directly without it.
NEXT_PUBLIC_CDN_BASE              https://cdn.afghansportsfederation.com

# Google OAuth. Configured in Supabase dashboard; no env needed in app.
```

**Connection pooling at scale**: at >1K concurrent connections, Supabase direct (port 5432) starts dropping. Switch to "Transaction" pooler mode (port 6543) in Supabase project settings; the JS SDK uses it automatically.

---

## 5. Vercel Cron jobs

Add to `vercel.json` at repo root:

```json
{
  "crons": [
    { "path": "/api/cron/auto-confirm", "schedule": "0 * * * *" },
    { "path": "/api/cron/purge",        "schedule": "0 3 * * *" }
  ]
}
```

The cron handlers accept `x-asf-cron-key`. Either set Vercel Cron to send your `CRON_SECRET` as that header, or update routes to also accept Vercel's default `x-vercel-cron`.

---

## 6. Domain + DNS

1. Vercel → Settings → Domains → Add `afghansportsfederation.com` and `www.*`
2. At registrar:
   - `A`     `@`   → `76.76.21.21`
   - `CNAME` `www` → `cname.vercel-dns.com`
3. Wait for cert issuance (usually under an hour)

---

## 7. Supabase post-deploy config

Settings → Auth → URL Configuration:

- **Site URL**: `https://afghansportsfederation.com`
- **Redirect URLs**:
  - `https://afghansportsfederation.com/auth/callback`
  - `https://www.afghansportsfederation.com/auth/callback`
  - `http://localhost:3000/auth/callback` (keep for local dev)

---

## 8. Resend (email)

1. Sign up at resend.com
2. Add domain `mail.afghansportsfederation.com`
3. Add SPF + DKIM + DMARC records to DNS
4. Wait for "Verified"
5. Generate API key, paste into `RESEND_API_KEY`
6. Test: submit `/contact` from production. Without the key, `sendEmail()` logs to console and never crashes.

---

## 9. Cloudflare image + edge cache (recommended >100K MAU)

The Supabase Storage CDN gets expensive at scale. Layer Cloudflare in front:

1. Create Cloudflare account, add the apex domain
2. Repoint registrar nameservers to Cloudflare's
3. In Cloudflare DNS, the apex A record points to Vercel; orange-cloud the proxy
4. Optional: Cloudflare Worker proxying `/cdn/<bucket>/<path>` → Supabase Storage URL, then update image URLs in code to use the proxy

---

## 10. Mux or Cloudflare Stream (video at scale)

Reels at 100K MAU will burn Supabase egress. Move video off Supabase:

**Mux** (recommended for adaptive streaming):
1. Sign up; create an environment
2. `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` in Vercel env
3. Replace upload step in `/reels/upload` to POST to Mux's direct-upload endpoint
4. Store playback ID; replace `<video src>` with `@mux/mux-player-react`

**Cloudflare Stream** (cheaper):
1. Enable Stream in Cloudflare
2. Direct-upload URL flow
3. Replace `<video>` with the `<stream>` web component

Both give you adaptive bitrate (HLS), automatic transcoding, and DDoS protection.

---

## 11. Upstash Redis

The current rate limiter (`lib/security/rate-limit.ts`) is in-memory per Vercel instance.

1. Sign up at upstash.com, create Redis db
2. Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
3. Swap the in-memory map for `@upstash/ratelimit`
4. Same Redis can cache `site_content` reads with 5-minute TTL via `unstable_cache` around `getContentBatch()`

---

## 12. Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

Adds the wrapper config and instrumentation. Set `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` in Vercel. Sentry auto-wraps server actions + API routes.

---

## 13. First admin login

1. Sign up at `https://afghansportsfederation.com/signup` with `agdcvakbl@gmail.com`
2. Verify the email
3. Complete onboarding
4. Trigger sets `is_admin=true` automatically because the email matches `ADMIN_EMAILS`
5. Visit `/admin`

---

## 14. CMS first-pass content

After admin login, populate via these pages (all live on save):

1. `/admin/cms/hero` — homepage hero
2. `/admin/cms/afghancup` — real Afghan Cup 2026 date + city
3. `/admin/cms/contact` — address, phone, social links
4. `/admin/cms/about` — story, mission, vision, values, goals
5. `/admin/team-members` — board members + volunteers
6. `/admin/sponsors` — sponsor list with tiers
7. `/admin/faq` — FAQ items per category
8. `/admin/history` — confirmed timeline entries
9. `/admin/gallery` — upload real ASF event photos

---

## 15. Final smoke test from production

```
GET /                       200
GET /events                 200
GET /teams                  200
GET /reels                  200
GET /search?q=ASF           200
GET /robots.txt             200
GET /sitemap.xml            200
GET /manifest.webmanifest   200
GET /sw.js                  200
GET /api/cron/auto-confirm  with x-asf-cron-key header → {"ok":true,...}
```

Lighthouse target (logged out, mobile):
```
Performance:    >= 85
Accessibility:  >= 95
Best practices: >= 95
SEO:            >= 95
PWA:            installable
```

---

## 16. Routine maintenance

| Task | Where | Cadence |
|---|---|---|
| Toggle maintenance mode | `/admin/settings` | as needed |
| Issue strikes / suspensions / lift | `/admin/moderation` | per case |
| Review reports | `/admin/reports` | daily |
| Review appeals | `/admin/appeals` | within 7d |
| Approve pending events | `/admin/events` | within 24h |
| Resolve match disputes | `/admin/matches?status=disputed` | within 48h |
| Verify accounts | `/admin/moderation` → user | on request |
| Update CMS | `/admin/cms/*` | anytime |

---

## 17. Disaster recovery

**Forgot admin password**: Supabase → Authentication → Users → "Send password reset"

**Locked out of admin**: SQL editor: `update profiles set is_admin = true where username = '<you>';`

**Bad CMS edit**: revert the row directly in `site_content` via SQL editor (no version history yet)

**Mass spam wave**: `/admin/settings` → toggle `registration_enabled = false` to pause signups. Block / suspend at scale via SQL if needed.

**Service worker stuck on old version**: bump `CACHE_VERSION` in `public/sw.js` and redeploy. Clients pick up the new SW on next navigation.

---

Run section 2 first, then push and deploy. Email setup and Cloudflare/Mux/Sentry/Upstash can come later as traffic grows.

---

## 18. Mux webhook configuration

Once `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set in Vercel:

1. Mux dashboard → **Settings → Webhooks → Add endpoint**
2. URL: `https://afghansportsfederation.com/api/mux/webhook`
3. Events: subscribe to at least
   - `video.upload.asset_created`
   - `video.asset.ready`
   - `video.asset.errored`
   - `video.upload.cancelled`
4. Copy the signing secret → set `MUX_WEBHOOK_SECRET` in Vercel
5. Test with the "Send test event" button. The route returns `{"ok":true}` on success.

When Mux env vars are absent, `/reels/upload` automatically falls back to direct-to-Supabase-Storage uploads. No code changes are needed to switch back.

---

## 19. Web push (browser notifications)

1. Generate VAPID keys (one time per environment):
   ```bash
   node -e "console.log(require('web-push').generateVAPIDKeys())"
   ```
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` in Vercel.
3. Set `VAPID_SUBJECT` to a contact email (`mailto:safeguarding@asf.org`).
4. Without these, the `<PushSubscribe>` button on `/notifications/preferences`
   renders a "not supported" hint and skips registration.

### Wire notifications → push fan-out

The webapp exposes `POST /api/push/send` which fans a single notification row
out to all of the recipient's push subscriptions. Trigger it from Postgres on
notification insert:

```sql
create extension if not exists pg_net;

alter database postgres set "app.app_url"      to 'https://afghansportsfederation.com';
alter database postgres set "app.cron_secret"  to '<your CRON_SECRET>';

create or replace function public.fanout_notification_push()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := current_setting('app.app_url') || '/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := jsonb_build_object('notificationId', new.id)::text
  );
  return new;
end $$;

drop trigger if exists trg_fanout_notification_push on public.notifications;
create trigger trg_fanout_notification_push
  after insert on public.notifications
  for each row execute function public.fanout_notification_push();
```

If you can't enable `pg_net`, call `/api/push/send` directly from the
notification-creating server actions instead — same body, same auth header.

---

## 20. Google OAuth

1. Google Cloud Console → **APIs & Services → Credentials → OAuth 2.0 Client ID**
2. Application type: Web application
3. Authorized redirect URI:
   - `https://<project>.supabase.co/auth/v1/callback`
4. Save Client ID + Client Secret.
5. Supabase dashboard → **Authentication → Providers → Google** → enable, paste
   the Client ID and Client Secret, save.
6. The `<GoogleOAuthButton>` on `/login` will start working immediately.

---

## 21. Cloudflare CDN base

If you put Cloudflare in front of Supabase Storage:

1. Create a `cdn.afghansportsfederation.com` CNAME pointing to the Cloudflare
   proxy (orange cloud) which fronts your Supabase Storage origin.
2. Set `NEXT_PUBLIC_CDN_BASE=https://cdn.afghansportsfederation.com` in Vercel.
3. Image and video components automatically rewrite Supabase Storage URLs
   through the CDN.
4. Without the env var, all URLs resolve directly from Supabase — no degradation.

---

## 22. Operational launch checklist (in order)

Use this when going from "code is merged" to "site is live":

- [ ] All migrations 001 → 016 run in Supabase SQL editor (verify with the queries in #2)
- [ ] Vercel project imported, env vars set (#4)
- [ ] `vercel.json` cron schedule committed (#5)
- [ ] DNS pointed at Vercel (#6)
- [ ] Supabase Auth Site URL + Redirect URLs match production (#7)
- [ ] Resend domain verified, `RESEND_API_KEY` set (#8)
- [ ] Google OAuth client created + Supabase Provider enabled (#20)
- [ ] VAPID keys generated, `pg_net` trigger installed (#19)
- [ ] Mux webhook endpoint registered (only if Mux env vars set) (#18)
- [ ] First admin signup completes, `/admin` accessible (#13)
- [ ] CMS first-pass content filled in (#14)
- [ ] Smoke test passes (#15)
- [ ] Lighthouse run on `/`, `/events`, `/reels` — investigate anything below 80
- [ ] Public announcement banner toggled in `/admin/cms/hero`

