-- =============================================================================
-- ASF Platform - Migration 011: Chapters + matches + tournaments + rate limits
-- =============================================================================
-- Adds:
--   1. chapters table (regional sub-organizations, e.g. NoVA Chapter)
--   2. matches + match_results (single-game submission with auto-confirm window)
--   3. tournaments + tournament_teams + tournament_matches (single-elim bracket)
--   4. rate_limits (in-memory fallback when Upstash not configured)
-- All RLS-locked. Idempotent.
-- =============================================================================

-- ---------------------------- 1. CHAPTERS ----------------------------
create table if not exists public.chapters (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  description     text,
  logo_url        text,
  banner_url      text,
  country_code    text default 'US',
  state_province  text,
  district_code   text,
  city            text,
  manager_id      uuid references public.profiles(id),
  deputy_id       uuid references public.profiles(id),
  member_count    int default 0,
  team_count      int default 0,
  is_active       boolean default true,
  founded_year    int,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists chapters_country_idx on public.chapters (country_code);
create index if not exists chapters_state_idx   on public.chapters (state_province);
create index if not exists chapters_active_idx  on public.chapters (is_active);

alter table public.chapters enable row level security;
drop policy if exists "Chapters readable by all" on public.chapters;
create policy "Chapters readable by all" on public.chapters for select using (true);
drop policy if exists "Chapters editable by manager or admin" on public.chapters;
create policy "Chapters editable by manager or admin" on public.chapters
  for update using (
    auth.uid() = manager_id
    or auth.uid() = deputy_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "Chapters insertable by admin" on public.chapters;
create policy "Chapters insertable by admin" on public.chapters
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Optional link: a team belongs to a chapter
alter table public.teams add column if not exists chapter_id uuid references public.chapters(id);
create index if not exists teams_chapter_idx on public.teams (chapter_id);


-- ---------------------------- 2. MATCHES ----------------------------
create table if not exists public.matches (
  id                  uuid primary key default gen_random_uuid(),
  sport               text not null,
  home_team_id        uuid not null references public.teams(id) on delete cascade,
  away_team_id        uuid not null references public.teams(id) on delete cascade,
  scheduled_for       timestamptz,
  played_at           timestamptz,
  venue               text,
  city                text,
  state_province      text,
  status              text not null default 'scheduled',  -- scheduled | reported | confirmed | disputed | cancelled
  reported_by         uuid references public.profiles(id),
  reported_at         timestamptz,
  confirmed_by        uuid references public.profiles(id),
  confirmed_at        timestamptz,
  home_score          int,
  away_score          int,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists matches_status_idx     on public.matches (status, played_at desc);
create index if not exists matches_home_team_idx  on public.matches (home_team_id);
create index if not exists matches_away_team_idx  on public.matches (away_team_id);
create index if not exists matches_played_idx    on public.matches (played_at desc);

alter table public.matches enable row level security;
drop policy if exists "Matches readable by all" on public.matches;
create policy "Matches readable by all" on public.matches for select using (true);
drop policy if exists "Matches insertable by team captain" on public.matches;
create policy "Matches insertable by team captain" on public.matches
  for insert with check (
    auth.uid() is not null
    and (
      exists (select 1 from public.teams t where t.id = home_team_id and t.captain_id = auth.uid())
      or exists (select 1 from public.teams t where t.id = away_team_id and t.captain_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
  );
drop policy if exists "Matches updatable by captains or admin" on public.matches;
create policy "Matches updatable by captains or admin" on public.matches
  for update using (
    exists (select 1 from public.teams t where t.id = home_team_id and t.captain_id = auth.uid())
    or exists (select 1 from public.teams t where t.id = away_team_id and t.captain_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- ---------------------------- 3. TOURNAMENTS ----------------------------
create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  sport           text not null,
  format          text not null default 'single_elim',  -- single_elim | round_robin
  description     text,
  banner_url      text,
  start_date      date,
  end_date        date,
  registration_opens timestamptz,
  registration_closes timestamptz,
  city            text,
  state_province  text,
  status          text not null default 'announced',  -- announced | registration | in_progress | completed | cancelled
  organizer_id    uuid references public.profiles(id),
  is_published    boolean default false,
  is_featured     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists tournaments_status_idx on public.tournaments (status, start_date desc);
create index if not exists tournaments_sport_idx  on public.tournaments (sport);

alter table public.tournaments enable row level security;
drop policy if exists "Tournaments readable by all" on public.tournaments;
create policy "Tournaments readable by all" on public.tournaments
  for select using (is_published = true or auth.uid() = organizer_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
drop policy if exists "Tournaments writable by admin" on public.tournaments;
create policy "Tournaments writable by admin" on public.tournaments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


create table if not exists public.tournament_teams (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  seed            int,
  status          text default 'registered',  -- registered | confirmed | eliminated | champion
  registered_at   timestamptz default now(),
  unique (tournament_id, team_id)
);

create index if not exists tt_tournament_idx on public.tournament_teams (tournament_id);
create index if not exists tt_team_idx       on public.tournament_teams (team_id);

alter table public.tournament_teams enable row level security;
drop policy if exists "TT readable by all" on public.tournament_teams;
create policy "TT readable by all" on public.tournament_teams for select using (true);
drop policy if exists "TT registerable by team captain" on public.tournament_teams;
create policy "TT registerable by team captain" on public.tournament_teams
  for insert with check (
    auth.uid() is not null and
    exists (select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid())
  );
drop policy if exists "TT manageable by admin" on public.tournament_teams;
create policy "TT manageable by admin" on public.tournament_teams
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


create table if not exists public.tournament_matches (
  id                uuid primary key default gen_random_uuid(),
  tournament_id     uuid not null references public.tournaments(id) on delete cascade,
  round             int not null,           -- 1 = first round, n = final
  position          int not null,           -- index within round (0-based)
  home_team_id      uuid references public.teams(id),
  away_team_id      uuid references public.teams(id),
  home_score        int,
  away_score        int,
  winner_team_id    uuid references public.teams(id),
  scheduled_for     timestamptz,
  status            text default 'pending',  -- pending | in_progress | completed
  next_match_id     uuid references public.tournament_matches(id),
  created_at        timestamptz default now()
);

create index if not exists tm_tournament_idx on public.tournament_matches (tournament_id, round, position);

alter table public.tournament_matches enable row level security;
drop policy if exists "TM readable by all" on public.tournament_matches;
create policy "TM readable by all" on public.tournament_matches for select using (true);
drop policy if exists "TM writable by admin" on public.tournament_matches;
create policy "TM writable by admin" on public.tournament_matches
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- ---------------------------- 4. RATE LIMITS ----------------------------
-- Simple per-IP rolling-window counter. Used by /api/contact, /api/newsletter.
create table if not exists public.rate_limits (
  bucket      text not null,    -- e.g. "contact" or "newsletter"
  ip_or_key   text not null,
  hit_count   int default 1,
  window_start timestamptz default now(),
  primary key (bucket, ip_or_key, window_start)
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
-- Rate limits are server-only; no public policies (service-role bypasses RLS).


-- ---------------------------- TRIGGERS ----------------------------
-- Auto-confirm match results 48h after report (per platform_config).
-- This is a passive helper; actual cron should invoke a routine that calls
-- the SQL below. For MVP, the /api/cron/auto-confirm route fires this.

create or replace function public.match_auto_confirm_eligible(p_id uuid)
returns boolean language sql stable as $$
  select status = 'reported'
    and reported_at < now() - interval '48 hours'
  from public.matches where id = p_id;
$$;

-- Verify
--   select count(*) from public.chapters;            -- 0 unless seeded
--   select count(*) from public.tournaments;         -- 0
--   select count(*) from public.matches;             -- 0
