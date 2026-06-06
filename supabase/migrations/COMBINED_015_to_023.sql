-- =============================================================================
-- ASF Platform - Migration 015: Hashtag follows + push subscriptions
-- =============================================================================
-- Adds:
--   1. hashtag_follows  — users follow specific hashtags; new reels notify them
--   2. push_subscriptions — Web Push endpoints for browser notifications
--   3. notify trigger on new reels: alert hashtag-followers
-- All RLS-locked. Idempotent.
-- =============================================================================

-- ---------------------------- 1. HASHTAG FOLLOWS ----------------------------
create table if not exists public.hashtag_follows (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tag         text not null references public.hashtags(tag) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, tag)
);

create index if not exists hashtag_follows_user_idx on public.hashtag_follows (user_id);
create index if not exists hashtag_follows_tag_idx  on public.hashtag_follows (tag);

alter table public.hashtag_follows enable row level security;
drop policy if exists "Hashtag follows readable by self" on public.hashtag_follows;
create policy "Hashtag follows readable by self" on public.hashtag_follows
  for select using (auth.uid() = user_id);
drop policy if exists "Hashtag follows manageable by self" on public.hashtag_follows;
create policy "Hashtag follows manageable by self" on public.hashtag_follows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- When a reel is hashtagged via parse_reel_hashtags, also notify followers of
-- that tag. We hook this onto reel_hashtags inserts.
create or replace function public.notify_hashtag_followers()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  follower record;
  reel_author uuid;
begin
  select author_id into reel_author from public.reels where id = new.reel_id;
  if reel_author is null then return new; end if;

  for follower in
    select user_id from public.hashtag_follows where tag = new.tag and user_id <> reel_author
  loop
    -- Honor blocks both directions.
    if public.is_blocked(reel_author, follower.user_id) then continue; end if;
    insert into public.notifications (user_id, type, actor_id, target_type, target_id, body, link)
      values (
        follower.user_id,
        'announcement',
        reel_author,
        'reel',
        new.reel_id,
        'New reel in #' || new.tag,
        '/reels/' || new.reel_id::text
      );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_hashtag_followers on public.reel_hashtags;
create trigger trg_notify_hashtag_followers
  after insert on public.reel_hashtags
  for each row execute function public.notify_hashtag_followers();


-- ---------------------------- 2. PUSH SUBSCRIPTIONS ----------------------------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now(),
  last_used_at timestamptz default now()
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "Push subs readable by self" on public.push_subscriptions;
create policy "Push subs readable by self" on public.push_subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "Push subs manageable by self" on public.push_subscriptions;
create policy "Push subs manageable by self" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Verify
-- select count(*) from public.hashtag_follows;
-- select count(*) from public.push_subscriptions;
-- 016: Mux integration columns + locale persistence + seed content
-- Run after 015. Idempotent.

-- ---------------------------- 1. MUX COLUMNS ----------------------------
alter table public.reels add column if not exists mux_upload_id    text;
alter table public.reels add column if not exists mux_asset_id     text;
alter table public.reels add column if not exists mux_playback_id  text;
alter table public.reels add column if not exists processing_state text default 'ready'
  check (processing_state in ('pending','processing','ready','errored'));

create index if not exists reels_mux_upload_idx on public.reels (mux_upload_id) where mux_upload_id is not null;
create index if not exists reels_mux_asset_idx  on public.reels (mux_asset_id)  where mux_asset_id  is not null;

-- ---------------------------- 2. LOCALE PREFERENCE ----------------------------
alter table public.profiles add column if not exists locale text default 'en'
  check (locale in ('en','fa-AF','ps'));

-- ---------------------------- 3. PUSH DELIVERY LOG ----------------------------
-- Track which notifications have already been sent over web push so retries
-- don't double-send.
create table if not exists public.push_deliveries (
  notification_id  uuid not null references public.notifications(id) on delete cascade,
  endpoint         text not null,
  delivered_at     timestamptz default now(),
  status           text default 'sent' check (status in ('sent','failed','expired')),
  primary key (notification_id, endpoint)
);

alter table public.push_deliveries enable row level security;
drop policy if exists "Push deliveries server-only" on public.push_deliveries;
create policy "Push deliveries server-only" on public.push_deliveries
  for all using (false);

-- ---------------------------- 4. SEED: SPONSORS ----------------------------
-- The sponsors table has no unique on name, so guard with a not-exists check.
do $$
begin
  if not exists (select 1 from public.sponsors where name = 'ASF Foundation') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('ASF Foundation', 'platinum', '/sponsors/asf-foundation.svg', 'https://asf.org', 10, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Diaspora Athletics') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Diaspora Athletics', 'gold', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=400&q=80', 'https://example.com/diaspora', 20, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Hindukush Sports') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Hindukush Sports', 'gold', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', 'https://example.com/hindukush', 30, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Kabul Media Group') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Kabul Media Group', 'silver', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=400&q=80', 'https://example.com/kabul-media', 40, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Pamir Travel') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Pamir Travel', 'silver', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80', 'https://example.com/pamir-travel', 50, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Khorasan Tech') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Khorasan Tech', 'partner', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', 'https://example.com/khorasan-tech', 60, true);
  end if;
end $$;

-- ---------------------------- 5. SEED: NEWS POSTS ----------------------------
insert into public.news_posts (slug, title, excerpt, content, image_url, is_published, published_at)
values
  ('asf-platform-launch-2026',
   'ASF launches digital platform for Afghan athletes worldwide',
   'A new home for Afghan sports community — events, teams, reels, and tournaments in one place.',
   E'## A long time coming\n\nFor decades, the Afghan sports community has been spread across continents — players in California training for the same tournaments as cousins in Hamburg, coaches in Toronto running drills for kids whose parents grew up in the same district as someone in Sydney.\n\nThe Afghan Sports Federation has connected this community for over 25 years through tournaments, cup competitions, and youth programs. Today we are opening the next chapter: a digital platform that brings every part of that work online.\n\n## What you can do today\n\n- Find teams in your area or across the diaspora\n- Join tournaments with online registration and live brackets\n- Share reels — short videos from training, matches, celebrations\n- Follow events in your local chapter\n- Connect with players, coaches, and organizers across countries\n\n## What is coming\n\n- Live match streaming in partnership with chapter media teams\n- Multilingual support: Dari and Pashto coming to the interface\n- Free agent matchmaking for players looking for a club\n- Player stats and career history\n\n## How to get involved\n\nSign up at asf.org. If you run a team, tournament, or chapter, claim your page from the Teams or Chapters section after creating your account. We are aiming for 10,000 active members by the end of the year — every signup helps.',
   'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '2 days'),
  ('afghan-cup-2026-registration-open',
   'Afghan Cup 2026 registration now open across six continents',
   'Teams from 14 countries have already entered the eighth edition of the Afghan Cup. Group draws begin in May.',
   E'## Eighth edition, biggest field yet\n\nThe Afghan Cup returns in 2026 with a record 64 confirmed teams across mens, womens, and youth divisions. Registration opened this week and runs through April 30.\n\n## Format\n\n- Group stage: round-robin, four groups of four\n- Knockout: top two from each group advance\n- Finals: single venue tournament weekend in July\n\n## Eligibility\n\nOpen to any team registered with their local chapter or with documented Afghan heritage on the roster. Full roster rules are in the tournament page.\n\n## How to enter\n\nVisit /tournaments and click your division. Pay the entry fee online or contact your chapter coordinator for fee waivers — we never want money to be the reason a team cannot play.',
   'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '5 days'),
  ('youth-coaching-clinic-march',
   'Free youth coaching clinic — March 22, open to all chapter coaches',
   'A full-day clinic covering session planning, age-appropriate skill development, and safeguarding fundamentals.',
   E'## Why this clinic exists\n\nMost of our youth programs are run by parents and volunteers — people who love the sport but never trained as coaches. This clinic is for them.\n\n## What you will learn\n\n- Session planning for ages 6 to 12\n- How to teach a skill so kids actually retain it\n- Safeguarding basics — what to do, what to never do\n- How to handle parents on the sideline\n\n## Free for chapter coaches\n\nThe clinic is free if you are an active chapter coach. Spots are limited to 60. RSVP from the event page.',
   'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '8 days'),
  ('safeguarding-policy-update',
   'Safeguarding policy update — what is new for 2026',
   'Stronger consent for under-16, faster moderation, and a public transparency report.',
   E'## What changed\n\n- Parental consent flow now uses double-opt-in via email\n- Reports of harassment are reviewed within 24 hours, down from 72\n- We will publish a quarterly transparency report starting Q2\n\n## Why\n\nWe operate at scale now. The bar has to rise.\n\n## Read the policy\n\nThe full policy is on the Community Guidelines page. Questions go to safeguarding@asf.org.',
   'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '12 days'),
  ('chapter-spotlight-toronto',
   'Chapter spotlight: Toronto, the engine of the eastern circuit',
   'How the Toronto chapter went from 40 weekend warriors to 1,200 registered members in five years.',
   E'## From a parking lot to four pitches\n\nFive years ago, the Toronto chapter had one team and a borrowed parking lot in Etobicoke. Today: four pitches, 1,200 registered members, and a womens side that just qualified for the Canadian regional cup.\n\n## What worked\n\n- Show up consistently. Same time, same place, every Sunday for two years before they had a permanent venue.\n- Bring kids in early. The U-9 program now feeds the senior team.\n- Sponsor relationships built on results, not asks. Every sponsor gets a shoutout in the highlight reel for the season.\n\n## Want to start something similar?\n\nWe will help. Reach out from the Chapters page.',
   'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '16 days')
on conflict (slug) do nothing;

-- ---------------------------- 6. SEED: EVENTS ----------------------------
insert into public.events (
  slug, title, event_type, sport, description, banner_url,
  start_datetime, end_datetime,
  country_code, state_province, city, venue_name, address,
  is_free, is_published, is_featured
) values
  ('asf-summer-cup-2026',
   'ASF Summer Cup 2026',
   'tournament',
   'soccer',
   E'The flagship summer event. Eight teams compete over a single weekend at the chapter''s home grounds.\n\nMen''s and women''s divisions. Youth showcase Saturday morning.',
   'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80',
   now() + interval '60 days', now() + interval '62 days',
   'US', 'CA', 'Fremont', 'Central Park Pitches', '40000 Paseo Padre Pkwy, Fremont, CA',
   false, true, true),
  ('toronto-pickup-saturday',
   'Toronto pickup — every Saturday',
   'community',
   'soccer',
   'Open pickup. All skill levels welcome. Bring water and shin guards.',
   'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
   now() + interval '3 days', now() + interval '3 days' + interval '3 hours',
   'CA', 'ON', 'Toronto', 'Etobicoke Sports Centre', '110 Kipling Ave, Toronto, ON',
   true, true, false),
  ('virginia-volleyball-clinic',
   'Virginia volleyball clinic — youth + adult',
   'camp',
   'volleyball',
   'Two-day clinic with chapter coaches. Beginners welcome in the morning, advanced session in the afternoon.',
   'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80',
   now() + interval '14 days', now() + interval '15 days',
   'US', 'VA', 'Fairfax', 'Fairfax Athletic Center', '4500 Stringfellow Rd, Chantilly, VA',
   false, true, false),
  ('hamburg-cricket-friendly',
   'Hamburg cricket friendly vs. Berlin Afghan XI',
   'match',
   'cricket',
   'Annual friendly match. Spectators welcome. Refreshments available on site.',
   'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80',
   now() + interval '21 days', now() + interval '21 days' + interval '8 hours',
   'DE', null, 'Hamburg', 'Stadtpark Cricket Ground', 'Otto-Wels-Straße, 22303 Hamburg',
   true, true, false),
  ('sydney-futsal-league-opener',
   'Sydney futsal league — season opener',
   'tournament',
   'futsal',
   'Six-team round-robin opening night for the 2026 Sydney futsal season.',
   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80',
   now() + interval '7 days', now() + interval '7 days' + interval '5 hours',
   'AU', 'NSW', 'Sydney', 'Auburn Indoor Sports Centre', '5 Park Rd, Auburn NSW',
   false, true, false),
  ('community-iftar-2026',
   'Community iftar + 5-a-side — Ramadan 2026',
   'community',
   null,
   'A community iftar followed by friendly 5-a-side matches for all ages. Hosted by the Bay Area chapter.',
   'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80',
   now() + interval '40 days', now() + interval '40 days' + interval '4 hours',
   'US', 'CA', 'Hayward', 'Hayward Community Center', '777 W Tennyson Rd, Hayward, CA',
   true, true, true),
  ('frankfurt-coaching-clinic-spring',
   'Frankfurt coaching clinic — spring session',
   'camp',
   'soccer',
   'Coaching basics and session planning for new chapter coaches in central Europe.',
   'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1600&q=80',
   now() + interval '28 days', now() + interval '28 days' + interval '6 hours',
   'DE', null, 'Frankfurt', 'Sportverein Bockenheim', 'Marburger Str 1, 60487 Frankfurt',
   true, true, false),
  ('london-women-tournament',
   'London women''s tournament 2026',
   'tournament',
   'soccer',
   'Six-team tournament celebrating Afghan women in football. All matches streamed via the chapter feed.',
   'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=1600&q=80',
   now() + interval '50 days', now() + interval '51 days',
   'GB', null, 'London', 'Powerleague Shoreditch', '1 Curtain Rd, London EC2A 3JX',
   false, true, true)
on conflict (slug) do nothing;

-- ---------------------------- 7. SEED: GALLERY (extra images for variety) ----------------------------
insert into public.gallery_images (image_url, caption, event_name, year, sort_order, is_published)
values
  ('https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80', 'Summer Cup 2025 final', 'Summer Cup 2025', 2025, 100, true),
  ('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80', 'Toronto chapter exhibition', 'Toronto Exhibition 2025', 2025, 110, true),
  ('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80', 'Youth coaching clinic', 'Youth Clinic 2024', 2024, 120, true),
  ('https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80', 'Bay Area iftar event', 'Community Iftar 2025', 2025, 130, true),
  ('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80', 'Virginia volleyball clinic', 'Virginia Volleyball 2024', 2024, 140, true),
  ('https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80', 'Hamburg cricket squad', 'Hamburg Cricket 2024', 2024, 150, true)
on conflict do nothing;

-- ---------------------------- 8. RECONCILE PROCESSING_STATE ----------------------------
update public.reels set processing_state = 'ready'
  where processing_state is null and is_published = true;
-- 017: Feature flags (admin-toggleable modules), multi-persona profile roles,
-- and team followers. Idempotent. Run after 016.

-- =============================================================================
-- 1. FEATURE FLAGS — every module a switch
-- =============================================================================
create table if not exists public.feature_flags (
  key            text primary key,
  label          text not null,
  description    text,
  category       text default 'core',                -- core / social / content / safety / monetization / integration
  is_enabled     boolean not null default true,
  default_value  boolean not null default true,      -- so admin can "reset to default"
  rollout_percent int default 100 check (rollout_percent between 0 and 100),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists feature_flags_enabled_idx on public.feature_flags (is_enabled);

alter table public.feature_flags enable row level security;
drop policy if exists "Feature flags readable by all" on public.feature_flags;
create policy "Feature flags readable by all" on public.feature_flags for select using (true);
drop policy if exists "Feature flags writable by admin" on public.feature_flags;
create policy "Feature flags writable by admin" on public.feature_flags
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop trigger if exists trg_feature_flags_updated on public.feature_flags;
create or replace function public.bump_feature_flags_updated()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_feature_flags_updated
  before update on public.feature_flags
  for each row execute function public.bump_feature_flags_updated();

-- Seed every module. Re-running won't overwrite admin's edits.
insert into public.feature_flags (key, label, description, category, is_enabled, default_value) values
  -- Core
  ('module.signup',         'Sign-up open',          'New users can register accounts.',                        'core',   true,  true),
  ('module.oauth.google',   'Google OAuth',          'Allow signing in with a Google account.',                 'core',   true,  true),
  ('module.mfa',            'Two-factor auth',       'TOTP authenticator app for accounts.',                     'core',   true,  true),
  ('module.profile.edit',   'Profile editing',       'Users can edit their profile.',                            'core',   true,  true),
  -- Social
  ('module.follow',         'Following',             'Follow / unfollow users and teams.',                       'social', true,  true),
  ('module.dm',             'Direct messages',       '1:1 and group direct messages.',                           'social', true,  true),
  ('module.dm.requests',    'Message requests',      'Strangers can send message requests.',                     'social', true,  true),
  ('module.dm.groups',      'Group DMs',             'Multi-party direct messages.',                             'social', true,  true),
  ('module.notifications',  'Notifications',         'In-app notifications.',                                    'social', true,  true),
  ('module.push',           'Web push',              'Browser push notifications.',                              'social', true,  true),
  ('module.mentions',       'Mentions',              'Parse and link @mentions in posts.',                       'social', true,  true),
  ('module.hashtags',       'Hashtags',              'Parse and link #hashtags + follow tags.',                  'social', true,  true),
  ('module.bookmarks',      'Bookmarks',             'Save posts / reels for later.',                            'social', true,  true),
  -- Content
  ('module.reels',          'Reels',                 'Vertical video reel feed.',                                'content',true,  true),
  ('module.reels.upload',   'Reel upload',           'Members can upload new reels.',                            'content',true,  true),
  ('module.polls',          'Polls',                 'Create and vote in community polls.',                      'content',true,  true),
  ('module.gallery',        'Gallery',               'Photo gallery.',                                           'content',true,  true),
  ('module.news',           'News',                  'News articles.',                                           'content',true,  true),
  ('module.sponsors',       'Sponsors',              'Sponsor showcase.',                                        'content',true,  true),
  ('module.events',         'Events',                'Event calendar + RSVPs.',                                  'content',true,  true),
  ('module.events.create',  'Event creation',        'Members can submit events for approval.',                  'content',true,  true),
  ('module.matches',        'Matches',               'Match schedule + results.',                                'content',true,  true),
  ('module.tournaments',    'Tournaments',           'Tournament hosting + brackets.',                           'content',true,  true),
  ('module.leaderboards',   'Leaderboards',          'Top scorers and stat rankings.',                           'content',true,  true),
  ('module.free_agents',    'Free agents',           'Free agent listing board.',                               'content',true,  true),
  ('module.achievements',   'Achievements',          'Earn and display achievement badges.',                     'content',true,  true),
  ('module.search',         'Search',                'Global search.',                                           'content',true,  true),
  -- Hierarchy
  ('module.federations',    'Federations',           'Top-level federation entities.',                           'core',   true,  true),
  ('module.chapters',       'Chapters',              'Regional chapters.',                                       'core',   true,  true),
  ('module.clubs',          'Clubs',                 'Multi-team clubs (between chapter and team).',             'core',   true,  true),
  ('module.teams',          'Teams',                 'Teams (rosters + matches).',                               'core',   true,  true),
  ('module.teams.create',   'Team creation',         'Members can start new teams.',                             'core',   true,  true),
  -- Safety
  ('module.reports',        'Reports',               'User-submitted content reports.',                          'safety', true,  true),
  ('module.blocks',         'Block users',           'Block and mute other users.',                              'safety', true,  true),
  ('module.appeals',        'Appeals',               'Members can appeal moderation actions.',                   'safety', true,  true),
  ('module.parental_consent','Parental consent',     'Under-16 accounts require guardian consent.',              'safety', true,  true),
  ('module.gdpr.export',    'GDPR data export',      'Users can download all their data.',                       'safety', true,  true),
  ('module.gdpr.delete',    'Account deletion',      'Users can soft-delete their account.',                     'safety', true,  true),
  -- Integrations
  ('module.mux',            'Mux video',             'Use Mux for video ingest (else Supabase Storage).',        'integration', false, false),
  ('module.cdn.cloudflare', 'Cloudflare CDN',        'Route media through the Cloudflare CDN.',                  'integration', false, false),
  ('module.sentry',         'Sentry',                'Send errors to Sentry.',                                   'integration', false, false),
  ('module.plausible',      'Plausible analytics',   'Cookieless analytics.',                                    'integration', true,  true),
  ('module.external_sports','External sports feed',  'Pull pro fixtures + news from public APIs.',               'integration', true,  true),
  -- Monetization (off by default — needs Stripe wiring)
  ('module.payments',       'Payments',              'Stripe payments for events + memberships.',                'monetization', false, false),
  ('module.donations',      'Donations',             'Accept donations.',                                        'monetization', false, false),
  ('module.merch',          'Merchandise',           'Team and federation merch shop.',                          'monetization', false, false),
  -- Localization
  ('module.locale.fa_AF',   'Dari (Afghan Persian)', 'Show Dari language option.',                               'core',   true,  true),
  ('module.locale.ps',      'Pashto',                'Show Pashto language option.',                             'core',   true,  true)
on conflict (key) do nothing;


-- =============================================================================
-- 2. PROFILE ROLES — multi-persona model
-- =============================================================================
-- Every account starts with a base 'user' role at signup. They can add
-- additional roles (athlete, coach, manager, parent, ref, volunteer, sponsor,
-- press) — each is a separate row tying back to their profile id.
--
-- `metadata` is sport-specific or role-specific JSON (e.g., for an athlete:
-- preferred sports + positions; for a coach: certifications; for a parent:
-- linked minor account ids).
create table if not exists public.profile_roles (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  kind         text not null
    check (kind in ('user','athlete','coach','manager','parent','referee','volunteer','sponsor','press','admin')),
  status       text not null default 'active'
    check (status in ('active','pending','revoked')),
  is_primary   boolean default false,
  metadata     jsonb default '{}'::jsonb,
  granted_at   timestamptz default now(),
  granted_by   uuid references public.profiles(id) on delete set null,
  unique (profile_id, kind)
);

create index if not exists profile_roles_profile_idx on public.profile_roles (profile_id);
create index if not exists profile_roles_kind_idx    on public.profile_roles (kind);

alter table public.profile_roles enable row level security;
drop policy if exists "Profile roles readable by all" on public.profile_roles;
create policy "Profile roles readable by all" on public.profile_roles for select using (true);
drop policy if exists "Profile roles self-managed" on public.profile_roles;
create policy "Profile roles self-managed" on public.profile_roles
  for all using (
    auth.uid() = profile_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Backfill: every existing profile gets the base 'user' role.
insert into public.profile_roles (profile_id, kind, status, is_primary)
  select id, 'user', 'active', true from public.profiles
on conflict (profile_id, kind) do nothing;

-- Profiles get an active_role_id pointer so the UI knows which persona is in use.
alter table public.profiles add column if not exists active_role_kind text default 'user';

-- Trigger: when a new profile is created, give it the base 'user' role.
create or replace function public.grant_base_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profile_roles (profile_id, kind, status, is_primary)
    values (new.id, 'user', 'active', true)
  on conflict (profile_id, kind) do nothing;
  return new;
end $$;

drop trigger if exists trg_grant_base_user_role on public.profiles;
create trigger trg_grant_base_user_role
  after insert on public.profiles
  for each row execute function public.grant_base_user_role();


-- =============================================================================
-- 3. TEAM FOLLOWERS — parity with user follows
-- =============================================================================
create table if not exists public.team_followers (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  team_id      uuid not null references public.teams(id) on delete cascade,
  followed_at  timestamptz default now(),
  primary key (user_id, team_id)
);

create index if not exists team_followers_team_idx on public.team_followers (team_id);
create index if not exists team_followers_user_idx on public.team_followers (user_id);

alter table public.team_followers enable row level security;
drop policy if exists "Team follows readable by all" on public.team_followers;
create policy "Team follows readable by all" on public.team_followers for select using (true);
drop policy if exists "Team follows self-managed" on public.team_followers;
create policy "Team follows self-managed" on public.team_followers
  for all using (auth.uid() = user_id);

-- Maintain teams.follower_count
create or replace function public.sync_team_follower_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.teams set follower_count = coalesce(follower_count, 0) + 1
      where id = new.team_id;
  elsif tg_op = 'DELETE' then
    update public.teams set follower_count = greatest(coalesce(follower_count, 0) - 1, 0)
      where id = old.team_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_team_follower_count_ins on public.team_followers;
create trigger trg_team_follower_count_ins
  after insert on public.team_followers
  for each row execute function public.sync_team_follower_count();

drop trigger if exists trg_team_follower_count_del on public.team_followers;
create trigger trg_team_follower_count_del
  after delete on public.team_followers
  for each row execute function public.sync_team_follower_count();

-- Reconcile counts now (in case some follower_count rows are off).
update public.teams t
   set follower_count = coalesce(c.n, 0)
  from (select team_id, count(*) n from public.team_followers group by team_id) c
 where c.team_id = t.id and coalesce(t.follower_count, 0) <> coalesce(c.n, 0);
-- 018: Federation + club hierarchy. Idempotent. Run after 017.
--
-- Final tree: Federation -> Chapter -> Club -> Team
-- Each tier optional: a team can exist without a club; a chapter without a
-- federation. Use the most specific link the team has when rendering breadcrumbs.

-- =============================================================================
-- 1. FEDERATIONS — top-level governing bodies (e.g. ASF)
-- =============================================================================
create table if not exists public.federations (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  short_name      text,
  description     text,
  scope           text not null default 'national'  -- 'global' | 'continental' | 'national'
                  check (scope in ('global','continental','national')),
  country_code    text,
  parent_federation_id uuid references public.federations(id) on delete set null,
  president_id    uuid references public.profiles(id) on delete set null,
  logo_url        text,
  banner_url      text,
  website_url     text,
  contact_email   text,
  founded_year    int,
  is_active       boolean default true,
  member_count    int default 0,
  follower_count  int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists federations_country_idx on public.federations (country_code);
create index if not exists federations_parent_idx  on public.federations (parent_federation_id);
create index if not exists federations_active_idx  on public.federations (is_active);

alter table public.federations enable row level security;
drop policy if exists "Federations readable by all" on public.federations;
create policy "Federations readable by all" on public.federations for select using (is_active = true or auth.uid() is not null);
drop policy if exists "Federations writable by admin or president" on public.federations;
create policy "Federations writable by admin or president" on public.federations
  for all using (
    auth.uid() = president_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop trigger if exists trg_federations_updated on public.federations;
create or replace function public.bump_federations_updated()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_federations_updated
  before update on public.federations
  for each row execute function public.bump_federations_updated();

-- Seed: ASF as the root federation.
insert into public.federations (slug, name, short_name, description, scope, country_code, founded_year, is_active)
values ('asf', 'Afghan Sports Federation', 'ASF',
        'The global federation connecting Afghan athletes, teams, and chapters across the diaspora. Founded 1998.',
        'global', null, 1998, true)
on conflict (slug) do nothing;


-- =============================================================================
-- 2. CHAPTERS — link to a parent federation + parent chapter
-- =============================================================================
alter table public.chapters add column if not exists federation_id uuid references public.federations(id) on delete set null;
alter table public.chapters add column if not exists parent_chapter_id uuid references public.chapters(id) on delete set null;
alter table public.chapters add column if not exists tier text default 'regional'
  check (tier in ('national','regional','local'));

-- Default any existing chapters to ASF.
update public.chapters
   set federation_id = (select id from public.federations where slug = 'asf')
 where federation_id is null;

create index if not exists chapters_federation_idx on public.chapters (federation_id);
create index if not exists chapters_parent_idx     on public.chapters (parent_chapter_id);


-- =============================================================================
-- 3. CLUBS — multi-team organizations (between chapter and team)
-- =============================================================================
create table if not exists public.clubs (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  short_name      text,
  description     text,
  chapter_id      uuid references public.chapters(id) on delete set null,
  federation_id   uuid references public.federations(id) on delete set null,
  president_id    uuid references public.profiles(id) on delete set null,
  country_code    text default 'US',
  state_province  text,
  city            text,
  address         text,
  website_url     text,
  contact_email   text,
  contact_phone   text,
  logo_url        text,
  banner_url      text,
  founded_year    int,
  team_count      int default 0,
  member_count    int default 0,
  follower_count  int default 0,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists clubs_chapter_idx       on public.clubs (chapter_id);
create index if not exists clubs_federation_idx    on public.clubs (federation_id);
create index if not exists clubs_country_state_idx on public.clubs (country_code, state_province);
create index if not exists clubs_active_idx        on public.clubs (is_active);

alter table public.clubs enable row level security;
drop policy if exists "Clubs readable by all" on public.clubs;
create policy "Clubs readable by all" on public.clubs for select using (is_active = true or auth.uid() is not null);
drop policy if exists "Clubs writable by president or admin" on public.clubs;
create policy "Clubs writable by president or admin" on public.clubs
  for all using (
    auth.uid() = president_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop trigger if exists trg_clubs_updated on public.clubs;
create or replace function public.bump_clubs_updated()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_clubs_updated
  before update on public.clubs
  for each row execute function public.bump_clubs_updated();


-- =============================================================================
-- 4. TEAMS — link to a club (optional)
-- =============================================================================
alter table public.teams add column if not exists club_id uuid references public.clubs(id) on delete set null;
alter table public.teams add column if not exists chapter_id uuid references public.chapters(id) on delete set null;
alter table public.teams add column if not exists federation_id uuid references public.federations(id) on delete set null;
alter table public.teams add column if not exists age_group text;            -- 'U-13', 'U-17', 'senior', 'masters'
alter table public.teams add column if not exists gender_division text       -- 'mens', 'womens', 'mixed'
  check (gender_division is null or gender_division in ('mens','womens','mixed','co-ed'));

create index if not exists teams_club_idx       on public.teams (club_id);
create index if not exists teams_chapter_idx    on public.teams (chapter_id);
create index if not exists teams_federation_idx on public.teams (federation_id);


-- =============================================================================
-- 5. CLUB MEMBERS / OFFICERS
-- =============================================================================
create table if not exists public.club_members (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member'
    check (role in ('member','president','vice_president','secretary','treasurer','coach','volunteer','staff')),
  joined_at   timestamptz default now(),
  unique (club_id, profile_id)
);
create index if not exists club_members_club_idx    on public.club_members (club_id);
create index if not exists club_members_profile_idx on public.club_members (profile_id);

alter table public.club_members enable row level security;
drop policy if exists "Club members readable by all" on public.club_members;
create policy "Club members readable by all" on public.club_members for select using (true);
drop policy if exists "Club members managed by club president or admin" on public.club_members;
create policy "Club members managed by club president or admin" on public.club_members
  for all using (
    profile_id = auth.uid()
    or exists (select 1 from public.clubs c where c.id = club_id and c.president_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create or replace function public.sync_club_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.clubs set member_count = coalesce(member_count, 0) + 1 where id = new.club_id;
  elsif tg_op = 'DELETE' then
    update public.clubs set member_count = greatest(coalesce(member_count, 0) - 1, 0) where id = old.club_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_club_member_count_ins on public.club_members;
create trigger trg_club_member_count_ins
  after insert on public.club_members for each row execute function public.sync_club_member_count();
drop trigger if exists trg_club_member_count_del on public.club_members;
create trigger trg_club_member_count_del
  after delete on public.club_members for each row execute function public.sync_club_member_count();


-- =============================================================================
-- 6. CLUB / FEDERATION FOLLOWERS
-- =============================================================================
create table if not exists public.club_followers (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  club_id      uuid not null references public.clubs(id) on delete cascade,
  followed_at  timestamptz default now(),
  primary key (user_id, club_id)
);
create index if not exists club_followers_club_idx on public.club_followers (club_id);

alter table public.club_followers enable row level security;
drop policy if exists "Club follows readable by all" on public.club_followers;
create policy "Club follows readable by all" on public.club_followers for select using (true);
drop policy if exists "Club follows self-managed" on public.club_followers;
create policy "Club follows self-managed" on public.club_followers
  for all using (auth.uid() = user_id);

create or replace function public.sync_club_follower_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.clubs set follower_count = coalesce(follower_count, 0) + 1 where id = new.club_id;
  elsif tg_op = 'DELETE' then
    update public.clubs set follower_count = greatest(coalesce(follower_count, 0) - 1, 0) where id = old.club_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_club_follower_count_ins on public.club_followers;
create trigger trg_club_follower_count_ins
  after insert on public.club_followers for each row execute function public.sync_club_follower_count();
drop trigger if exists trg_club_follower_count_del on public.club_followers;
create trigger trg_club_follower_count_del
  after delete on public.club_followers for each row execute function public.sync_club_follower_count();

create table if not exists public.federation_followers (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  federation_id uuid not null references public.federations(id) on delete cascade,
  followed_at  timestamptz default now(),
  primary key (user_id, federation_id)
);
create index if not exists federation_followers_idx on public.federation_followers (federation_id);

alter table public.federation_followers enable row level security;
drop policy if exists "Fed follows readable by all" on public.federation_followers;
create policy "Fed follows readable by all" on public.federation_followers for select using (true);
drop policy if exists "Fed follows self-managed" on public.federation_followers;
create policy "Fed follows self-managed" on public.federation_followers
  for all using (auth.uid() = user_id);

create or replace function public.sync_federation_follower_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.federations set follower_count = coalesce(follower_count, 0) + 1 where id = new.federation_id;
  elsif tg_op = 'DELETE' then
    update public.federations set follower_count = greatest(coalesce(follower_count, 0) - 1, 0) where id = old.federation_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_fed_follower_count_ins on public.federation_followers;
create trigger trg_fed_follower_count_ins
  after insert on public.federation_followers for each row execute function public.sync_federation_follower_count();
drop trigger if exists trg_fed_follower_count_del on public.federation_followers;
create trigger trg_fed_follower_count_del
  after delete on public.federation_followers for each row execute function public.sync_federation_follower_count();


-- =============================================================================
-- 7. SEED CHAPTERS + CLUBS so the hierarchy renders out of the box
-- =============================================================================
do $$
declare
  asf_id uuid;
  ch_us  uuid;
  ch_de  uuid;
  ch_ca  uuid;
  ch_au  uuid;
  ch_uk  uuid;
begin
  select id into asf_id from public.federations where slug = 'asf';
  if asf_id is null then return; end if;

  insert into public.chapters (slug, name, country_code, federation_id, tier, is_active, founded_year)
  values
    ('asf-usa',     'ASF USA',     'US', asf_id, 'national', true, 1998),
    ('asf-germany', 'ASF Germany', 'DE', asf_id, 'national', true, 2002),
    ('asf-canada',  'ASF Canada',  'CA', asf_id, 'national', true, 2004),
    ('asf-uk',      'ASF UK',      'GB', asf_id, 'national', true, 2008),
    ('asf-australia','ASF Australia','AU', asf_id, 'national', true, 2010)
  on conflict (slug) do update set
    federation_id = excluded.federation_id,
    tier = excluded.tier;

  select id into ch_us from public.chapters where slug = 'asf-usa';
  select id into ch_de from public.chapters where slug = 'asf-germany';
  select id into ch_ca from public.chapters where slug = 'asf-canada';
  select id into ch_au from public.chapters where slug = 'asf-australia';
  select id into ch_uk from public.chapters where slug = 'asf-uk';

  -- Regional chapters under ASF USA
  insert into public.chapters (slug, name, country_code, state_province, federation_id, parent_chapter_id, tier, is_active)
  values
    ('asf-bay-area',       'ASF Bay Area',         'US', 'CA', asf_id, ch_us, 'regional', true),
    ('asf-northern-virginia','ASF Northern Virginia','US','VA', asf_id, ch_us, 'regional', true),
    ('asf-toronto',        'ASF Toronto',          'CA', 'ON', asf_id, ch_ca, 'regional', true),
    ('asf-hamburg',        'ASF Hamburg',          'DE', null, asf_id, ch_de, 'regional', true),
    ('asf-frankfurt',      'ASF Frankfurt',        'DE', null, asf_id, ch_de, 'regional', true),
    ('asf-london',         'ASF London',           'GB', null, asf_id, ch_uk, 'regional', true),
    ('asf-sydney',         'ASF Sydney',           'AU', 'NSW', asf_id, ch_au, 'regional', true)
  on conflict (slug) do nothing;

  -- Seed clubs
  insert into public.clubs (slug, name, short_name, chapter_id, federation_id, country_code, state_province, city, founded_year, is_active, description)
  values
    ('khorasan-fc-fremont',    'Khorasan FC',     'Khorasan FC', (select id from public.chapters where slug = 'asf-bay-area'),
       asf_id, 'US', 'CA', 'Fremont', 2005, true, 'Senior soccer club rooted in the Bay Area diaspora since 2005.'),
    ('hindukush-united-toronto','Hindukush United','Hindukush', (select id from public.chapters where slug = 'asf-toronto'),
       asf_id, 'CA', 'ON', 'Toronto', 2010, true, 'Multi-sport club operating soccer, futsal, and volleyball programs across the GTA.'),
    ('pamir-sc-hamburg',       'Pamir SC',        'Pamir SC',  (select id from public.chapters where slug = 'asf-hamburg'),
       asf_id, 'DE', null, 'Hamburg', 2007, true, 'Hamburg-based community club known for its youth pathways.'),
    ('kabul-athletic-london',  'Kabul Athletic',  'Kabul AC',  (select id from public.chapters where slug = 'asf-london'),
       asf_id, 'GB', null, 'London', 2012, true, 'London-based club with senior and women''s sides competing in regional leagues.'),
    ('koh-e-noor-sydney',      'Koh-e-Noor Sports','Koh-e-Noor',(select id from public.chapters where slug = 'asf-sydney'),
       asf_id, 'AU', 'NSW', 'Sydney', 2014, true, 'Cricket-focused club running senior and junior programs in greater Sydney.')
  on conflict (slug) do nothing;
end $$;


-- =============================================================================
-- 8. RECONCILE TEAM COUNTS for chapters and clubs
-- =============================================================================
update public.chapters c
   set team_count = coalesce((select count(*) from public.teams t where t.chapter_id = c.id), 0)
 where exists (select 1 from public.teams t where t.chapter_id = c.id);

update public.clubs c
   set team_count = coalesce((select count(*) from public.teams t where t.club_id = c.id), 0);
-- 019: Sport definitions data layer. Adding a new sport = adding rows to the
-- catalog tables; no schema change. Idempotent. Run after 018.

-- =============================================================================
-- 1. SPORTS CATALOG
-- =============================================================================
create table if not exists public.sports (
  code              text primary key,
  name              text not null,
  category          text not null default 'team'
                    check (category in ('team','individual','racket','combat','track','board','esport')),
  is_team_sport     boolean default true,
  default_format    text,                          -- references sport_match_formats(code)
  emoji             text,                          -- shown when an icon component isn't mapped
  sort_order        int default 0,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

alter table public.sports enable row level security;
drop policy if exists "Sports readable by all" on public.sports;
create policy "Sports readable by all" on public.sports for select using (true);
drop policy if exists "Sports writable by admin" on public.sports;
create policy "Sports writable by admin" on public.sports
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sports (code, name, category, is_team_sport, default_format, emoji, sort_order) values
  ('soccer',       'Soccer',        'team',       true,  'soccer-90',    '⚽', 10),
  ('futsal',       'Futsal',        'team',       true,  'futsal-40',    '⚽', 20),
  ('basketball',   'Basketball',    'team',       true,  'basketball-fiba', '🏀', 30),
  ('volleyball',   'Volleyball',    'team',       true,  'volleyball-bo5', '🏐', 40),
  ('cricket',      'Cricket',       'team',       true,  'cricket-t20',   '🏏', 50),
  ('tennis',       'Tennis',        'racket',     false, 'tennis-bo3',    '🎾', 60),
  ('table_tennis', 'Table tennis',  'racket',     false, 'tabletennis-bo5','🏓', 70),
  ('badminton',    'Badminton',     'racket',     false, 'badminton-bo3', '🏸', 80),
  ('bowling',      'Bowling',       'individual', false, 'bowling-frames','🎳', 90),
  ('wrestling',    'Wrestling',     'combat',     false, 'wrestling-3rd', '🤼', 100),
  ('boxing',       'Boxing',        'combat',     false, 'boxing-3rd',    '🥊', 110),
  ('athletics',    'Athletics',     'track',      false, null,            '🏃', 120),
  ('chess',        'Chess',         'board',      false, 'chess-classic', '♟️', 130)
on conflict (code) do nothing;


-- =============================================================================
-- 2. POSITIONS
-- =============================================================================
create table if not exists public.sport_positions (
  sport_code  text not null references public.sports(code) on delete cascade,
  code        text not null,
  name        text not null,
  abbrev      text,
  sort_order  int default 0,
  primary key (sport_code, code)
);

alter table public.sport_positions enable row level security;
drop policy if exists "Sport positions readable by all" on public.sport_positions;
create policy "Sport positions readable by all" on public.sport_positions for select using (true);
drop policy if exists "Sport positions writable by admin" on public.sport_positions;
create policy "Sport positions writable by admin" on public.sport_positions
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_positions (sport_code, code, name, abbrev, sort_order) values
  -- Soccer
  ('soccer','goalkeeper','Goalkeeper','GK',10),
  ('soccer','center_back','Centre back','CB',20),
  ('soccer','full_back','Full back','FB',30),
  ('soccer','def_mid','Defensive midfielder','DM',40),
  ('soccer','center_mid','Central midfielder','CM',50),
  ('soccer','att_mid','Attacking midfielder','AM',60),
  ('soccer','winger','Winger','W',70),
  ('soccer','striker','Striker','ST',80),
  -- Futsal
  ('futsal','goalkeeper','Goalkeeper','GK',10),
  ('futsal','defender','Fixo','FX',20),
  ('futsal','wing','Ala','AL',30),
  ('futsal','pivot','Pivô','PV',40),
  -- Basketball
  ('basketball','point_guard','Point guard','PG',10),
  ('basketball','shooting_guard','Shooting guard','SG',20),
  ('basketball','small_forward','Small forward','SF',30),
  ('basketball','power_forward','Power forward','PF',40),
  ('basketball','center','Center','C',50),
  -- Volleyball
  ('volleyball','outside_hitter','Outside hitter','OH',10),
  ('volleyball','middle_blocker','Middle blocker','MB',20),
  ('volleyball','opposite','Opposite','OPP',30),
  ('volleyball','setter','Setter','S',40),
  ('volleyball','libero','Libero','L',50),
  ('volleyball','defensive_specialist','Defensive specialist','DS',60),
  -- Cricket
  ('cricket','batter','Batter','BAT',10),
  ('cricket','bowler','Bowler','BWL',20),
  ('cricket','all_rounder','All-rounder','AR',30),
  ('cricket','wicketkeeper','Wicketkeeper','WK',40),
  -- Tennis
  ('tennis','singles','Singles','S',10),
  ('tennis','doubles','Doubles','D',20),
  -- Wrestling
  ('wrestling','freestyle','Freestyle','FS',10),
  ('wrestling','greco_roman','Greco-Roman','GR',20)
on conflict (sport_code, code) do nothing;


-- =============================================================================
-- 3. STATS CATALOG
-- =============================================================================
create table if not exists public.sport_stats (
  sport_code        text not null references public.sports(code) on delete cascade,
  stat_key          text not null,
  label             text not null,
  unit              text,                                -- 'count', 'minutes', 'percent', 'meters', 'seconds'
  higher_is_better  boolean default true,
  is_aggregate      boolean default false,               -- true for derived stats (avg, percentage)
  sort_order        int default 0,
  primary key (sport_code, stat_key)
);

alter table public.sport_stats enable row level security;
drop policy if exists "Sport stats readable by all" on public.sport_stats;
create policy "Sport stats readable by all" on public.sport_stats for select using (true);
drop policy if exists "Sport stats writable by admin" on public.sport_stats;
create policy "Sport stats writable by admin" on public.sport_stats
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_stats (sport_code, stat_key, label, unit, higher_is_better, sort_order) values
  -- Soccer
  ('soccer','matches_played','Matches','count',true,10),
  ('soccer','minutes_played','Minutes','minutes',true,20),
  ('soccer','goals','Goals','count',true,30),
  ('soccer','assists','Assists','count',true,40),
  ('soccer','shots','Shots','count',true,50),
  ('soccer','shots_on_target','Shots on target','count',true,60),
  ('soccer','passes','Passes','count',true,70),
  ('soccer','tackles','Tackles','count',true,80),
  ('soccer','yellow_cards','Yellow cards','count',false,90),
  ('soccer','red_cards','Red cards','count',false,100),
  ('soccer','clean_sheets','Clean sheets','count',true,110),
  ('soccer','saves','Saves','count',true,120),
  -- Basketball
  ('basketball','matches_played','Games','count',true,10),
  ('basketball','minutes_played','Minutes','minutes',true,20),
  ('basketball','points','Points','count',true,30),
  ('basketball','rebounds','Rebounds','count',true,40),
  ('basketball','assists','Assists','count',true,50),
  ('basketball','steals','Steals','count',true,60),
  ('basketball','blocks','Blocks','count',true,70),
  ('basketball','turnovers','Turnovers','count',false,80),
  ('basketball','fouls','Fouls','count',false,90),
  ('basketball','field_goals_made','FG made','count',true,100),
  ('basketball','field_goals_attempted','FG att','count',true,110),
  ('basketball','three_pointers_made','3PT made','count',true,120),
  ('basketball','free_throws_made','FT made','count',true,130),
  -- Volleyball
  ('volleyball','matches_played','Matches','count',true,10),
  ('volleyball','sets_played','Sets','count',true,20),
  ('volleyball','kills','Kills','count',true,30),
  ('volleyball','attack_errors','Attack errors','count',false,40),
  ('volleyball','blocks_solo','Solo blocks','count',true,50),
  ('volleyball','blocks_assist','Block assists','count',true,60),
  ('volleyball','digs','Digs','count',true,70),
  ('volleyball','aces','Aces','count',true,80),
  ('volleyball','service_errors','Service errors','count',false,90),
  ('volleyball','reception_errors','Reception errors','count',false,100),
  -- Cricket
  ('cricket','matches_played','Matches','count',true,10),
  ('cricket','runs','Runs','count',true,20),
  ('cricket','balls_faced','Balls faced','count',true,30),
  ('cricket','fours','Fours','count',true,40),
  ('cricket','sixes','Sixes','count',true,50),
  ('cricket','wickets','Wickets','count',true,60),
  ('cricket','overs_bowled','Overs bowled','count',true,70),
  ('cricket','catches','Catches','count',true,80),
  -- Tennis
  ('tennis','matches_played','Matches','count',true,10),
  ('tennis','matches_won','Wins','count',true,20),
  ('tennis','sets_won','Sets won','count',true,30),
  ('tennis','games_won','Games won','count',true,40),
  ('tennis','aces','Aces','count',true,50),
  ('tennis','double_faults','Double faults','count',false,60),
  ('tennis','first_serve_pct','1st serve %','percent',true,70),
  ('tennis','breakpoints_won','Break points won','count',true,80)
on conflict (sport_code, stat_key) do nothing;


-- =============================================================================
-- 4. MATCH FORMATS
-- =============================================================================
create table if not exists public.sport_match_formats (
  code              text primary key,                  -- 'soccer-90', 'basketball-fiba'
  sport_code        text not null references public.sports(code) on delete cascade,
  label             text not null,
  period_count      int default 2,                     -- halves / quarters / sets
  period_label      text default 'half',               -- 'half','quarter','set','round','innings','frame'
  period_minutes    int,                               -- null for sets-based
  scoring_rule      text,                              -- 'goals','points','sets','runs'
  best_of           int,                               -- for tennis-style: best-of-3 / best-of-5
  notes             text
);

alter table public.sport_match_formats enable row level security;
drop policy if exists "Match formats readable by all" on public.sport_match_formats;
create policy "Match formats readable by all" on public.sport_match_formats for select using (true);
drop policy if exists "Match formats writable by admin" on public.sport_match_formats;
create policy "Match formats writable by admin" on public.sport_match_formats
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_match_formats (code, sport_code, label, period_count, period_label, period_minutes, scoring_rule, best_of, notes) values
  ('soccer-90',         'soccer',       'Standard 90 min',           2, 'half',     45, 'goals',  null, '2x45 with extra time + penalties as needed'),
  ('soccer-80',         'soccer',       'Youth 80 min',              2, 'half',     40, 'goals',  null, null),
  ('futsal-40',         'futsal',       'Standard 40 min',           2, 'half',     20, 'goals',  null, null),
  ('basketball-nba',    'basketball',   'NBA (4x12)',                4, 'quarter',  12, 'points', null, null),
  ('basketball-fiba',   'basketball',   'FIBA (4x10)',               4, 'quarter',  10, 'points', null, null),
  ('basketball-3x3',    'basketball',   '3x3 (10 min or 21)',        1, 'period',   10, 'points', null, null),
  ('volleyball-bo5',    'volleyball',   'Best of 5 sets to 25',      5, 'set',      null,'sets',   3,    null),
  ('cricket-t20',       'cricket',      'T20 (20 overs)',            2, 'innings',  null,'runs',   null, null),
  ('cricket-odi',       'cricket',      'ODI (50 overs)',            2, 'innings',  null,'runs',   null, null),
  ('cricket-t10',       'cricket',      'T10 (10 overs)',            2, 'innings',  null,'runs',   null, null),
  ('tennis-bo3',        'tennis',       'Best of 3 sets',            3, 'set',      null,'sets',   2,    null),
  ('tennis-bo5',        'tennis',       'Best of 5 sets',            5, 'set',      null,'sets',   3,    null),
  ('tabletennis-bo5',   'table_tennis', 'Best of 5 (to 11)',         5, 'set',      null,'sets',   3,    null),
  ('badminton-bo3',     'badminton',    'Best of 3 (to 21)',         3, 'set',      null,'sets',   2,    null),
  ('bowling-frames',    'bowling',      '10 frames',                 10, 'frame',   null,'pins',   null, null),
  ('wrestling-3rd',     'wrestling',    'Two periods, 3-min',        2, 'period',   3,   'points', null, null),
  ('boxing-3rd',        'boxing',       'Three rounds, 3-min',       3, 'round',    3,   'points', null, null),
  ('chess-classic',     'chess',        'Classical',                 1, 'period',   null,'points', null, null)
on conflict (code) do nothing;


-- =============================================================================
-- 5. MATCH EVENT TYPES (timeline of what happens during a match)
-- =============================================================================
create table if not exists public.sport_match_event_types (
  sport_code   text not null references public.sports(code) on delete cascade,
  code         text not null,                         -- 'goal', 'foul', 'sub', 'ace', 'set_won'
  label        text not null,
  points_delta int default 0,                         -- if non-zero, applies to score
  is_negative  boolean default false,                 -- yellow/red cards / faults
  sort_order   int default 0,
  primary key (sport_code, code)
);

alter table public.sport_match_event_types enable row level security;
drop policy if exists "Match event types readable by all" on public.sport_match_event_types;
create policy "Match event types readable by all" on public.sport_match_event_types for select using (true);
drop policy if exists "Match event types writable by admin" on public.sport_match_event_types;
create policy "Match event types writable by admin" on public.sport_match_event_types
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_match_event_types (sport_code, code, label, points_delta, is_negative, sort_order) values
  -- Soccer
  ('soccer','kickoff','Kick-off',0,false,10),
  ('soccer','goal','Goal',1,false,20),
  ('soccer','own_goal','Own goal',1,false,30),
  ('soccer','penalty','Penalty',1,false,40),
  ('soccer','penalty_missed','Penalty missed',0,true,50),
  ('soccer','yellow_card','Yellow card',0,true,60),
  ('soccer','red_card','Red card',0,true,70),
  ('soccer','substitution','Substitution',0,false,80),
  ('soccer','half_time','Half-time',0,false,90),
  ('soccer','full_time','Full-time',0,false,100),
  -- Basketball
  ('basketball','field_goal_2','2-point FG',2,false,10),
  ('basketball','field_goal_3','3-point FG',3,false,20),
  ('basketball','free_throw','Free throw',1,false,30),
  ('basketball','foul','Foul',0,true,40),
  ('basketball','technical_foul','Technical foul',0,true,50),
  ('basketball','substitution','Substitution',0,false,60),
  ('basketball','timeout','Timeout',0,false,70),
  -- Volleyball
  ('volleyball','point','Point',1,false,10),
  ('volleyball','ace','Ace',1,false,20),
  ('volleyball','service_error','Service error',0,true,30),
  ('volleyball','set_won','Set won',0,false,40),
  -- Cricket
  ('cricket','run','Run',0,false,10),
  ('cricket','four','Four',4,false,20),
  ('cricket','six','Six',6,false,30),
  ('cricket','wicket','Wicket',0,false,40),
  ('cricket','wide','Wide',1,true,50),
  ('cricket','no_ball','No-ball',1,true,60),
  -- Tennis
  ('tennis','game_won','Game won',0,false,10),
  ('tennis','set_won','Set won',0,false,20),
  ('tennis','ace','Ace',1,false,30),
  ('tennis','double_fault','Double fault',0,true,40),
  ('tennis','break_of_serve','Break of serve',0,false,50)
on conflict (sport_code, code) do nothing;


-- =============================================================================
-- 6. MATCH EVENTS (instances on actual matches)
-- =============================================================================
-- Adds a timeline of events for any match. The match table already exists
-- (from 011); we add an events table linked to it.
create table if not exists public.match_events (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  sport_code   text not null references public.sports(code),
  event_code   text not null,                              -- references sport_match_event_types(code)
  team_id      uuid references public.teams(id) on delete set null,
  player_id    uuid references public.profiles(id) on delete set null,
  assist_player_id uuid references public.profiles(id) on delete set null,
  minute       int,                                        -- 0-90+ for soccer; null for sports without clock
  period       int,                                        -- 1, 2, 3, 4 …
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now()
);

create index if not exists match_events_match_idx  on public.match_events (match_id, period, minute);
create index if not exists match_events_player_idx on public.match_events (player_id);
create index if not exists match_events_sport_idx  on public.match_events (sport_code);

alter table public.match_events enable row level security;
drop policy if exists "Match events readable by all" on public.match_events;
create policy "Match events readable by all" on public.match_events for select using (true);
drop policy if exists "Match events writable by team manager or admin" on public.match_events;
create policy "Match events writable by team manager or admin" on public.match_events
  for all using (
    exists (
      select 1 from public.team_members tm
       where tm.team_id = match_events.team_id
         and tm.player_id = auth.uid()
         and tm.role in ('manager','captain','coach','vice_captain')
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
-- 020: Cache tables for external sports APIs (TheSportsDB, Football-Data.org,
-- BallDontLie, ESPN RSS, CricAPI). We pull on a schedule + on-demand and
-- store results so we never expose API keys to the client and never go over
-- the free-tier rate limits.
--
-- Idempotent. Run after 019.

-- =============================================================================
-- 1. EXTERNAL FIXTURES (pro / national leagues)
-- =============================================================================
create table if not exists public.external_fixtures (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,                          -- 'thesportsdb','football-data','balldontlie','cricapi'
  provider_id     text not null,
  sport_code      text not null,                          -- references public.sports(code)
  league          text,
  league_id       text,
  country_code    text,
  season          text,
  kickoff         timestamptz,
  status          text default 'scheduled',               -- 'scheduled','live','final','postponed','cancelled'
  home_name       text,
  home_logo_url   text,
  home_score      int,
  away_name       text,
  away_logo_url   text,
  away_score      int,
  venue           text,
  notes           text,
  raw             jsonb,
  last_synced_at  timestamptz default now(),
  unique (provider, provider_id)
);

create index if not exists ext_fixtures_sport_kickoff_idx on public.external_fixtures (sport_code, kickoff desc);
create index if not exists ext_fixtures_league_idx        on public.external_fixtures (league_id, kickoff desc);
create index if not exists ext_fixtures_country_idx       on public.external_fixtures (country_code, kickoff desc);

alter table public.external_fixtures enable row level security;
drop policy if exists "External fixtures readable by all" on public.external_fixtures;
create policy "External fixtures readable by all" on public.external_fixtures for select using (true);
drop policy if exists "External fixtures server-only writes" on public.external_fixtures;
create policy "External fixtures server-only writes" on public.external_fixtures for all using (false);


-- =============================================================================
-- 2. EXTERNAL STANDINGS
-- =============================================================================
create table if not exists public.external_standings (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  provider_id     text not null,
  sport_code      text not null,
  league_id       text not null,
  league_name     text,
  season          text,
  position        int,
  team_name       text,
  team_logo_url   text,
  played          int default 0,
  won             int default 0,
  drawn           int default 0,
  lost            int default 0,
  goals_for       int default 0,
  goals_against   int default 0,
  goal_difference int default 0,
  points          int default 0,
  raw             jsonb,
  last_synced_at  timestamptz default now(),
  unique (provider, provider_id)
);

create index if not exists ext_standings_league_idx on public.external_standings (league_id, season, position);

alter table public.external_standings enable row level security;
drop policy if exists "External standings readable by all" on public.external_standings;
create policy "External standings readable by all" on public.external_standings for select using (true);
drop policy if exists "External standings server-only writes" on public.external_standings;
create policy "External standings server-only writes" on public.external_standings for all using (false);


-- =============================================================================
-- 3. EXTERNAL NEWS
-- =============================================================================
create table if not exists public.external_news (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,                          -- 'espn-rss','bbc-rss','reuters-rss','custom-rss'
  provider_id     text not null,
  sport_code      text,
  title           text not null,
  summary         text,
  url             text not null,
  image_url       text,
  source_name     text,
  published_at    timestamptz,
  language        text default 'en',
  last_seen_at    timestamptz default now(),
  unique (provider, provider_id)
);

create index if not exists ext_news_published_idx on public.external_news (published_at desc);
create index if not exists ext_news_sport_idx     on public.external_news (sport_code, published_at desc);

alter table public.external_news enable row level security;
drop policy if exists "External news readable by all" on public.external_news;
create policy "External news readable by all" on public.external_news for select using (true);
drop policy if exists "External news server-only writes" on public.external_news;
create policy "External news server-only writes" on public.external_news for all using (false);


-- =============================================================================
-- 4. POLLING LOG — tracks last successful sync per provider
-- =============================================================================
create table if not exists public.external_sync_log (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  resource        text not null,                          -- 'fixtures','standings','news'
  status          text not null default 'ok',             -- 'ok','rate-limited','error'
  records_upserted int default 0,
  error_message   text,
  ran_at          timestamptz default now()
);

create index if not exists ext_sync_log_provider_idx on public.external_sync_log (provider, ran_at desc);

alter table public.external_sync_log enable row level security;
drop policy if exists "Sync log readable by admin" on public.external_sync_log;
create policy "Sync log readable by admin" on public.external_sync_log
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
drop policy if exists "Sync log server-only writes" on public.external_sync_log;
create policy "Sync log server-only writes" on public.external_sync_log for all using (false);
-- 021: Demo content so reels, polls, matches, tournaments, achievements
-- pages aren't empty for first-time users. Idempotent. Run after 020.

-- ---------------------------- TOURNAMENTS ----------------------------
insert into public.tournaments (slug, name, sport, format, start_date, end_date, city, state_province, country_code, status, is_published, is_featured, description)
values
  ('afghan-cup-2026',
   'Afghan Cup 2026',
   'soccer',
   'group_then_knockout',
   (current_date + interval '60 days')::date,
   (current_date + interval '64 days')::date,
   'Fremont', 'CA', 'US',
   'registration', true, true,
   'The eighth edition of the Afghan Cup. Sixteen teams competing across four group stages, knockout brackets, and a single-day finals weekend.'),
  ('asf-summer-classic-2026',
   'ASF Summer Classic 2026',
   'soccer',
   'round_robin',
   (current_date + interval '30 days')::date,
   (current_date + interval '32 days')::date,
   'Toronto', 'ON', 'CA',
   'announced', true, false,
   'Round-robin summer competition with men''s and women''s divisions hosted by the Toronto chapter.'),
  ('bay-area-volleyball-open',
   'Bay Area Volleyball Open',
   'volleyball',
   'single_elimination',
   (current_date + interval '21 days')::date,
   (current_date + interval '21 days')::date,
   'Hayward', 'CA', 'US',
   'registration', true, false,
   'One-day single-elimination volleyball bracket. Six-person teams, FIVB rules, best-of-five sets in the final.'),
  ('cricket-cup-london-2026',
   'ASF Cricket Cup — London 2026',
   'cricket',
   'group_then_knockout',
   (current_date + interval '50 days')::date,
   (current_date + interval '51 days')::date,
   'London', null, 'GB',
   'announced', true, false,
   'T20 format competition with chapter teams from the UK and continental Europe.')
on conflict (slug) do nothing;


-- ---------------------------- POLLS ----------------------------
do $$
declare
  any_user uuid;
begin
  select id into any_user from public.profiles limit 1;
  if any_user is null then return; end if;

  insert into public.polls (id, author_id, question, is_published, closes_at, created_at)
  values
    (gen_random_uuid(), any_user,
     'Who wins Afghan Cup 2026?',
     true, now() + interval '30 days', now() - interval '2 days'),
    (gen_random_uuid(), any_user,
     'Which sport should ASF add to its 2026 calendar?',
     true, now() + interval '14 days', now() - interval '5 days'),
    (gen_random_uuid(), any_user,
     'Best Afghan diaspora club this season?',
     true, now() + interval '7 days', now() - interval '1 day')
  on conflict do nothing;
end $$;

-- Poll options for the seeded polls (only if poll_options table exists).
do $$
declare
  p1 uuid;
  p2 uuid;
  p3 uuid;
begin
  if to_regclass('public.poll_options') is null then return; end if;

  select id into p1 from public.polls where question = 'Who wins Afghan Cup 2026?' limit 1;
  select id into p2 from public.polls where question = 'Which sport should ASF add to its 2026 calendar?' limit 1;
  select id into p3 from public.polls where question = 'Best Afghan diaspora club this season?' limit 1;

  if p1 is not null then
    insert into public.poll_options (poll_id, label, sort_order) values
      (p1, 'Khorasan FC',      10),
      (p1, 'Hindukush United', 20),
      (p1, 'Pamir SC',         30),
      (p1, 'Kabul Athletic',   40)
    on conflict do nothing;
  end if;
  if p2 is not null then
    insert into public.poll_options (poll_id, label, sort_order) values
      (p2, 'Badminton',  10),
      (p2, 'Wrestling',  20),
      (p2, 'Athletics',  30),
      (p2, 'Chess',      40)
    on conflict do nothing;
  end if;
  if p3 is not null then
    insert into public.poll_options (poll_id, label, sort_order) values
      (p3, 'Khorasan FC',       10),
      (p3, 'Pamir SC',          20),
      (p3, 'Koh-e-Noor Sports', 30),
      (p3, 'Hindukush United',  40)
    on conflict do nothing;
  end if;
end $$;


-- ---------------------------- REELS (using royalty-free sample videos) ----------------------------
-- Pixabay + Pexels host CC0 sport clips suitable for seed content. URLs are
-- the direct mp4 endpoints (no API key needed). Replace with real ASF
-- uploads when members start posting.
do $$
declare
  any_user uuid;
begin
  select id into any_user from public.profiles limit 1;
  if any_user is null then return; end if;

  insert into public.reels (author_id, video_url, thumbnail_url, caption, sport, country_code, state_province, is_published, view_count, like_count)
  values
    (any_user,
     'https://cdn.pixabay.com/video/2024/06/12/216138_large.mp4',
     'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=600&q=80',
     'Bay Area training session — full speed warm-up before the weekend fixture. #soccer #training',
     'soccer', 'US', 'CA', true, 432, 28),
    (any_user,
     'https://cdn.pixabay.com/video/2024/05/03/210010_large.mp4',
     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
     'Futsal night in Hamburg — 5-a-side semifinal highlights. #futsal',
     'futsal', 'DE', null, true, 198, 14),
    (any_user,
     'https://cdn.pixabay.com/video/2022/03/29/112577-696167587_large.mp4',
     'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=600&q=80',
     'Volleyball practice in Virginia. Working on serve receive. #volleyball',
     'volleyball', 'US', 'VA', true, 312, 21),
    (any_user,
     'https://cdn.pixabay.com/video/2020/03/10/33134-397142724_large.mp4',
     'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
     'Sunday cricket nets in London. Big swing connecting. #cricket',
     'cricket', 'GB', null, true, 156, 11),
    (any_user,
     'https://cdn.pixabay.com/video/2021/09/30/89685-625810099_large.mp4',
     'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=600&q=80',
     'Community day in Fremont — kids first basketball clinic. #basketball #youth',
     'basketball', 'US', 'CA', true, 587, 39),
    (any_user,
     'https://cdn.pixabay.com/video/2024/04/02/206406_large.mp4',
     'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=600&q=80',
     'Coach''s touch-line view. Toronto chapter, opening match. #soccer #matchday',
     'soccer', 'CA', 'ON', true, 273, 19)
  on conflict do nothing;
end $$;


-- ---------------------------- MATCHES (recent + upcoming) ----------------------------
do $$
declare
  t_count int;
  t_ids   uuid[];
begin
  select count(*), array_agg(id) into t_count, t_ids
    from (select id from public.teams limit 6) s;
  if t_count < 2 then return; end if;

  insert into public.matches (sport, home_team_id, away_team_id, scheduled_for, played_at, venue, city, state_province, status, home_score, away_score)
  values
    ('soccer', t_ids[1], t_ids[2], now() - interval '7 days', now() - interval '7 days', 'Central Park Pitches', 'Fremont', 'CA',
     'confirmed', 3, 1),
    ('soccer', t_ids[3], t_ids[1], now() - interval '3 days', now() - interval '3 days', 'Etobicoke Sports Centre', 'Toronto', 'ON',
     'confirmed', 2, 2),
    ('soccer', t_ids[2], t_ids[3], now() + interval '4 days', null, 'Hayward Community Center', 'Hayward', 'CA',
     'scheduled', null, null),
    ('soccer', t_ids[1], t_ids[3], now() + interval '11 days', null, 'Toronto FC Practice Field', 'Toronto', 'ON',
     'scheduled', null, null)
  on conflict do nothing;
end $$;


-- ---------------------------- USER FOLLOWS (so /following/hashtags & profile pages have signal) ----------------------------
-- Seed each existing profile to follow the ASF "community" hashtag (idempotent).
do $$
begin
  insert into public.hashtags (tag, reel_count, last_used_at)
  values ('community', 0, now()), ('soccer', 0, now()), ('youth', 0, now())
  on conflict (tag) do nothing;
end $$;


-- ---------------------------- ACHIEVEMENTS GRANTED ----------------------------
-- Give every existing profile a first_post or team_player achievement so the
-- public profile page shows something in the Achievements section.
do $$
begin
  insert into public.user_achievements (user_id, achievement_key)
    select id, 'team_player' from public.profiles
  on conflict do nothing;
end $$;
-- 022: Allow reels to be either a hosted file (Mux / Supabase Storage) or a
-- YouTube embed. Idempotent. Run after 021.

-- ---------------------------- 1. REELS COLUMNS ----------------------------
alter table public.reels add column if not exists video_kind text default 'file'
  check (video_kind in ('file','youtube','mux'));

-- For YouTube reels we store the raw video id (e.g. "dQw4w9WgXcQ") in this
-- column. video_url remains the public URL we hand to <video> / <iframe>.
alter table public.reels add column if not exists youtube_id text;

create index if not exists reels_kind_idx on public.reels (video_kind);

-- Backfill any reels that were uploaded via Mux before this column existed.
update public.reels set video_kind = 'mux'
 where mux_playback_id is not null and video_kind = 'file';
-- 023: Activity wall + discussion board.
-- The wall is a unified feed of everything that happens on the platform —
-- new reels, news, events, discussions, replies, matches, achievements.
-- Each row knows where to link back to. Triggers populate it automatically
-- so seed data + ongoing activity both end up on the wall.
-- Idempotent. Run after 022.

-- =============================================================================
-- 1. WALL POSTS — unified activity feed
-- =============================================================================
create table if not exists public.wall_posts (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id) on delete set null,
  kind          text not null
    check (kind in (
      'reel','event','news','match','poll','tournament',
      'discussion','discussion_reply','team_created','club_created',
      'achievement','user_joined','match_result'
    )),
  target_type   text,
  target_id     uuid,
  title         text not null,
  body          text,
  image_url     text,
  link          text not null,
  created_at    timestamptz default now()
);

create index if not exists wall_posts_created_idx on public.wall_posts (created_at desc);
create index if not exists wall_posts_actor_idx   on public.wall_posts (actor_id, created_at desc);
create index if not exists wall_posts_kind_idx    on public.wall_posts (kind, created_at desc);

alter table public.wall_posts enable row level security;
drop policy if exists "Wall readable by all" on public.wall_posts;
create policy "Wall readable by all" on public.wall_posts for select using (true);
drop policy if exists "Wall written by service only" on public.wall_posts;
create policy "Wall written by service only" on public.wall_posts
  for insert with check (auth.role() = 'service_role' or actor_id = auth.uid());
drop policy if exists "Wall delete by author or admin" on public.wall_posts;
create policy "Wall delete by author or admin" on public.wall_posts
  for delete using (
    actor_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- =============================================================================
-- 2. DISCUSSION BOARD — threads + replies
-- =============================================================================
create table if not exists public.discussions (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  body            text,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  category        text default 'general'
    check (category in ('general','announcements','rules','tactics','recruitment','events','off_topic')),
  sport           text,
  is_pinned       boolean default false,
  is_locked       boolean default false,
  view_count      int default 0,
  reply_count     int default 0,
  last_reply_at   timestamptz default now(),
  last_reply_by   uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists discussions_recent_idx on public.discussions (last_reply_at desc);
create index if not exists discussions_category_idx on public.discussions (category, last_reply_at desc);
create index if not exists discussions_author_idx on public.discussions (author_id);
create index if not exists discussions_pinned_idx on public.discussions (is_pinned desc, last_reply_at desc);

alter table public.discussions enable row level security;
drop policy if exists "Discussions readable by all" on public.discussions;
create policy "Discussions readable by all" on public.discussions for select using (true);
drop policy if exists "Discussions created by any signed-in user" on public.discussions;
create policy "Discussions created by any signed-in user" on public.discussions
  for insert with check (auth.uid() = author_id);
drop policy if exists "Discussions editable by author or admin" on public.discussions;
create policy "Discussions editable by author or admin" on public.discussions
  for update using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


create table if not exists public.discussion_replies (
  id              uuid primary key default gen_random_uuid(),
  discussion_id   uuid not null references public.discussions(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  parent_reply_id uuid references public.discussion_replies(id) on delete cascade,
  created_at      timestamptz default now()
);

create index if not exists discussion_replies_thread_idx on public.discussion_replies (discussion_id, created_at);
create index if not exists discussion_replies_author_idx on public.discussion_replies (author_id);

alter table public.discussion_replies enable row level security;
drop policy if exists "Replies readable by all" on public.discussion_replies;
create policy "Replies readable by all" on public.discussion_replies for select using (true);
drop policy if exists "Replies created by signed-in user" on public.discussion_replies;
create policy "Replies created by signed-in user" on public.discussion_replies
  for insert with check (auth.uid() = author_id);
drop policy if exists "Replies editable by author or admin" on public.discussion_replies;
create policy "Replies editable by author or admin" on public.discussion_replies
  for update using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Maintain discussions.reply_count + last_reply_*
create or replace function public.bump_discussion_on_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.discussions set
      reply_count   = coalesce(reply_count, 0) + 1,
      last_reply_at = new.created_at,
      last_reply_by = new.author_id
    where id = new.discussion_id;
  elsif tg_op = 'DELETE' then
    update public.discussions set
      reply_count = greatest(coalesce(reply_count, 0) - 1, 0)
    where id = old.discussion_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_bump_discussion_on_reply_ins on public.discussion_replies;
create trigger trg_bump_discussion_on_reply_ins
  after insert on public.discussion_replies
  for each row execute function public.bump_discussion_on_reply();
drop trigger if exists trg_bump_discussion_on_reply_del on public.discussion_replies;
create trigger trg_bump_discussion_on_reply_del
  after delete on public.discussion_replies
  for each row execute function public.bump_discussion_on_reply();


-- =============================================================================
-- 3. WALL TRIGGERS — auto-write wall_posts on content insert
-- =============================================================================

-- New reel
create or replace function public.wall_on_reel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.author_id, 'reel', 'reel', new.id,
      coalesce(nullif(new.caption, ''), 'New reel'),
      new.caption,
      new.thumbnail_url,
      '/reels/' || new.id::text
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_wall_on_reel on public.reels;
create trigger trg_wall_on_reel
  after insert on public.reels
  for each row execute function public.wall_on_reel();

-- New event (only when published)
create or replace function public.wall_on_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.organizer_id, 'event', 'event', new.id,
      new.title,
      coalesce(left(new.description, 240), null),
      new.banner_url,
      '/events/' || new.id::text
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_event on public.events;
create trigger trg_wall_on_event
  after insert on public.events
  for each row execute function public.wall_on_event();

-- New news post (only when published)
create or replace function public.wall_on_news()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.author_id, 'news', 'news_post', new.id,
      new.title,
      new.excerpt,
      new.image_url,
      '/news/' || new.slug
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_news on public.news_posts;
create trigger trg_wall_on_news
  after insert on public.news_posts
  for each row execute function public.wall_on_news();

-- New poll
create or replace function public.wall_on_poll()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
    values (
      new.author_id, 'poll', 'poll', new.id,
      new.question,
      'New community poll — cast your vote.',
      '/polls/' || new.id::text
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_poll on public.polls;
create trigger trg_wall_on_poll
  after insert on public.polls
  for each row execute function public.wall_on_poll();

-- New tournament
create or replace function public.wall_on_tournament()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      null, 'tournament', 'tournament', new.id,
      new.name,
      coalesce(left(new.description, 240), null),
      new.banner_url,
      '/tournaments/' || new.slug
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_tournament on public.tournaments;
create trigger trg_wall_on_tournament
  after insert on public.tournaments
  for each row execute function public.wall_on_tournament();

-- Match result (only when confirmed)
create or replace function public.wall_on_match_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  home_name text;
  away_name text;
  score_line text;
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    select name into home_name from public.teams where id = new.home_team_id;
    select name into away_name from public.teams where id = new.away_team_id;
    score_line := coalesce(home_name, 'Home') || ' ' || coalesce(new.home_score::text, '?') ||
                  ' – ' || coalesce(new.away_score::text, '?') || ' ' || coalesce(away_name, 'Away');
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
    values (
      coalesce(new.confirmed_by, new.reported_by), 'match_result', 'match', new.id,
      'Result: ' || score_line,
      coalesce('Played ' || to_char(new.played_at, 'Mon DD, YYYY'), null) ||
        case when new.venue is not null then ' · ' || new.venue else '' end,
      '/matches/' || new.id::text
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_match_confirmed on public.matches;
create trigger trg_wall_on_match_confirmed
  after update on public.matches
  for each row execute function public.wall_on_match_confirmed();

-- Match created (scheduled)
create or replace function public.wall_on_match_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  home_name text;
  away_name text;
begin
  select name into home_name from public.teams where id = new.home_team_id;
  select name into away_name from public.teams where id = new.away_team_id;
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
  values (
    null, 'match', 'match', new.id,
    'Upcoming: ' || coalesce(home_name, 'Home') || ' vs ' || coalesce(away_name, 'Away'),
    coalesce(to_char(new.scheduled_for, 'Mon DD, YYYY HH24:MI'), null) ||
      case when new.venue is not null then ' · ' || new.venue else '' end,
    '/matches/' || new.id::text
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_match_created on public.matches;
create trigger trg_wall_on_match_created
  after insert on public.matches
  for each row execute function public.wall_on_match_created();

-- Discussion + reply
create or replace function public.wall_on_discussion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
  values (
    new.author_id, 'discussion', 'discussion', new.id,
    new.title,
    coalesce(left(new.body, 240), null),
    '/discussions/' || new.slug
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_discussion on public.discussions;
create trigger trg_wall_on_discussion
  after insert on public.discussions
  for each row execute function public.wall_on_discussion();

create or replace function public.wall_on_discussion_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  thread record;
begin
  select id, title, slug into thread from public.discussions where id = new.discussion_id;
  if thread.id is null then return new; end if;
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
  values (
    new.author_id, 'discussion_reply', 'discussion', new.discussion_id,
    'Replied to: ' || thread.title,
    left(new.body, 240),
    '/discussions/' || thread.slug
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_discussion_reply on public.discussion_replies;
create trigger trg_wall_on_discussion_reply
  after insert on public.discussion_replies
  for each row execute function public.wall_on_discussion_reply();

-- New team
create or replace function public.wall_on_team()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap_name text;
begin
  select coalesce(full_name, username) into cap_name from public.profiles where id = new.captain_id;
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
  values (
    new.captain_id, 'team_created', 'team', new.id,
    'New team: ' || new.name,
    'Created by ' || coalesce(cap_name, 'a member') ||
      case when new.city is not null then ' · ' || new.city else '' end,
    new.logo_url,
    '/teams/' || new.slug
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_team on public.teams;
create trigger trg_wall_on_team
  after insert on public.teams
  for each row execute function public.wall_on_team();

-- New user (welcome to the platform)
create or replace function public.wall_on_user_joined()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.username is not null then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.id, 'user_joined', 'profile', new.id,
      coalesce(new.full_name, new.username) || ' joined ASF',
      case when new.city is not null then 'From ' || new.city else null end,
      new.avatar_url,
      '/profile/' || new.username
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_user_joined on public.profiles;
create trigger trg_wall_on_user_joined
  after insert on public.profiles
  for each row execute function public.wall_on_user_joined();


-- =============================================================================
-- 4. NEW MODULE FLAGS
-- =============================================================================
insert into public.feature_flags (key, label, description, category, is_enabled, default_value) values
  ('module.wall',        'Activity wall',  'Unified feed of every public action on the platform.', 'social', true, true),
  ('module.discussions', 'Discussions',    'Threaded community discussion board.',                  'social', true, true)
on conflict (key) do nothing;
