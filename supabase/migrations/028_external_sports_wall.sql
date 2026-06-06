-- 028: External sports → activity-wall projection, refocused on Afghanistan +
-- FIFA World Cup 2026.
--
-- Adds a feed tag to the external cache tables so we project + display only the
-- rows we care about; extends the wall with external + announcement kinds, a
-- dedupe key (so the same story from two sources lands once), and admin
-- moderation columns (hide / pin).
--
-- Idempotent. Run after 027.

-- =============================================================================
-- 1. TAG EXTERNAL CACHE ROWS BY FEED  ('afghanistan' | 'wc2026' | null=other)
-- =============================================================================
alter table public.external_fixtures  add column if not exists feed_tag text;
alter table public.external_news      add column if not exists feed_tag text;
alter table public.external_standings add column if not exists feed_tag text;

create index if not exists ext_fixtures_feedtag_idx
  on public.external_fixtures (feed_tag, kickoff desc);
create index if not exists ext_news_feedtag_idx
  on public.external_news (feed_tag, published_at desc);
create index if not exists ext_standings_feedtag_idx
  on public.external_standings (feed_tag, league_id, position);


-- =============================================================================
-- 2. WALL: dedupe key + admin moderation columns
-- =============================================================================
alter table public.wall_posts add column if not exists dedupe_key text;
alter table public.wall_posts add column if not exists is_hidden  boolean not null default false;
alter table public.wall_posts add column if not exists is_pinned  boolean not null default false;

-- One wall post per external item / content fingerprint. NULLs are allowed and
-- treated as distinct, so the trigger-populated rows (which never set a key)
-- are unaffected.
create unique index if not exists wall_posts_dedupe_key_idx
  on public.wall_posts (dedupe_key);

-- Drives the public feed query: visible, pinned-first, newest-first.
create index if not exists wall_posts_visible_idx
  on public.wall_posts (is_hidden, is_pinned desc, created_at desc);


-- =============================================================================
-- 3. WALL: allow external + announcement kinds
-- =============================================================================
-- The original inline CHECK from migration 023 is named wall_posts_kind_check.
alter table public.wall_posts drop constraint if exists wall_posts_kind_check;
alter table public.wall_posts add constraint wall_posts_kind_check
  check (kind in (
    'reel','event','news','match','poll','tournament',
    'discussion','discussion_reply','team_created','club_created',
    'achievement','user_joined','match_result',
    'external_fixture','external_news','announcement'
  ));
