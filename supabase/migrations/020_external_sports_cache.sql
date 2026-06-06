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
