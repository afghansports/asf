-- =============================================================================
-- ASF Platform - Migration 013: Moderation, notifications, engagement, search
-- =============================================================================
-- Closes the remaining backlog from the gap analysis:
--   1. Strikes + suspensions + appeals + shadow banning
--   2. Notifications + per-type preferences
--   3. Verified accounts (blue/gold checkmarks)
--   4. Hashtags + reel<->hashtag join
--   5. Polls (poll, options, votes)
--   6. Player stats (per sport, per season)
--   7. Achievements + auto-grant triggers
--   8. Search: pg_trgm extension + GIN indexes on text columns
-- All RLS-locked. Idempotent.
-- =============================================================================

-- ---------------------------- 1. MODERATION ----------------------------
create table if not exists public.user_strikes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  severity    text not null check (severity in ('minor','moderate','severe','immediate_ban')),
  reason      text not null,
  category    text,
  issued_by   uuid references public.profiles(id),
  created_at  timestamptz default now(),
  expires_at  timestamptz
);

create index if not exists user_strikes_user_active_idx on public.user_strikes (user_id, created_at desc);

alter table public.user_strikes enable row level security;
drop policy if exists "Strikes readable by user or admin" on public.user_strikes;
create policy "Strikes readable by user or admin" on public.user_strikes
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "Strikes writable by admin" on public.user_strikes;
create policy "Strikes writable by admin" on public.user_strikes
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


create table if not exists public.user_suspensions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('posting_only','full','permanent')),
  reason      text not null,
  starts_at   timestamptz default now(),
  ends_at     timestamptz,
  lifted_at   timestamptz,
  issued_by   uuid references public.profiles(id),
  created_at  timestamptz default now()
);

create index if not exists user_suspensions_user_active_idx
  on public.user_suspensions (user_id)
  where lifted_at is null;

alter table public.user_suspensions enable row level security;
drop policy if exists "Suspensions readable by user or admin" on public.user_suspensions;
create policy "Suspensions readable by user or admin" on public.user_suspensions
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "Suspensions writable by admin" on public.user_suspensions;
create policy "Suspensions writable by admin" on public.user_suspensions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Helper used by middleware: returns the active suspension row for a user
-- if there is one, else null.
create or replace function public.active_suspension(p_user_id uuid)
returns table(id uuid, type text, ends_at timestamptz, reason text)
language sql stable security definer set search_path = public as $$
  select id, type, ends_at, reason
    from public.user_suspensions
   where user_id = p_user_id
     and lifted_at is null
     and (ends_at is null or ends_at > now())
   order by created_at desc
   limit 1;
$$;


create table if not exists public.ban_appeals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  suspension_id   uuid references public.user_suspensions(id) on delete set null,
  reason_text     text not null check (char_length(reason_text) between 20 and 2000),
  status          text not null default 'pending' check (status in ('pending','approved','denied','withdrawn')),
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  decision_note   text,
  created_at      timestamptz default now()
);

create index if not exists ban_appeals_status_idx on public.ban_appeals (status, created_at desc);

alter table public.ban_appeals enable row level security;
drop policy if exists "Appeals readable by user or admin" on public.ban_appeals;
create policy "Appeals readable by user or admin" on public.ban_appeals
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "Appeals submittable by suspended user" on public.ban_appeals;
create policy "Appeals submittable by suspended user" on public.ban_appeals
  for insert with check (auth.uid() = user_id);
drop policy if exists "Appeals reviewable by admin" on public.ban_appeals;
create policy "Appeals reviewable by admin" on public.ban_appeals
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Shadow banning: content is visible to the author but hidden from everyone
-- else. Far more effective than a hard ban for low-level trolls.
alter table public.profiles add column if not exists shadow_banned boolean default false;

-- Hide shadow-banned content from public reels/comments queries.
drop policy if exists "Published reels readable by all" on public.reels;
create policy "Published reels readable by all" on public.reels
  for select using (
    (is_published = true and deleted_at is null
     and (auth.uid() is null or not public.is_blocked(auth.uid(), author_id))
     and not exists (select 1 from public.profiles p where p.id = author_id and p.shadow_banned = true))
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "reel_comments readable by all" on public.reel_comments;
create policy "reel_comments readable by all" on public.reel_comments
  for select using (
    (deleted_at is null
     and (auth.uid() is null or not public.is_blocked(auth.uid(), author_id))
     and not exists (select 1 from public.profiles p where p.id = author_id and p.shadow_banned = true))
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- ---------------------------- 2. NOTIFICATIONS ----------------------------
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,         -- 'follow', 'like_reel', 'comment_reel', 'mention', 'event_approved', etc.
  actor_id        uuid references public.profiles(id) on delete set null,
  target_type     text,                  -- 'reel','comment','event','match','team','tournament'
  target_id       uuid,
  body            text,                  -- denormalized human-readable summary
  link            text,                  -- where clicking the notification goes
  is_read         boolean default false,
  created_at      timestamptz default now()
);

create index if not exists notif_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "Notifications readable by recipient" on public.notifications;
create policy "Notifications readable by recipient" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "Notifications writable by recipient" on public.notifications;
create policy "Notifications writable by recipient" on public.notifications
  for update using (auth.uid() = user_id);
-- INSERT is service-role only (server actions).


-- Per-user, per-type channel preferences. JSON keyed by notification type
-- with channel toggles. Defaults: all in-app on, email off.
alter table public.profiles add column if not exists notification_prefs jsonb default jsonb_build_object(
  'follow',           jsonb_build_object('inapp', true,  'email', false),
  'like_reel',        jsonb_build_object('inapp', true,  'email', false),
  'comment_reel',     jsonb_build_object('inapp', true,  'email', false),
  'mention',          jsonb_build_object('inapp', true,  'email', true),
  'team_invite',      jsonb_build_object('inapp', true,  'email', true),
  'match_reported',   jsonb_build_object('inapp', true,  'email', true),
  'match_confirmed',  jsonb_build_object('inapp', true,  'email', false),
  'event_approved',   jsonb_build_object('inapp', true,  'email', true),
  'event_rejected',   jsonb_build_object('inapp', true,  'email', true),
  'announcement',     jsonb_build_object('inapp', true,  'email', false),
  'message',          jsonb_build_object('inapp', true,  'email', false),
  'message_request',  jsonb_build_object('inapp', true,  'email', true),
  'strike',           jsonb_build_object('inapp', true,  'email', true),
  'suspension',       jsonb_build_object('inapp', true,  'email', true)
);


-- ---------------------------- 3. VERIFIED ACCOUNTS ----------------------------
alter table public.profiles
  add column if not exists verification_status text default 'unverified'
  check (verification_status in ('unverified','verified','official'));


-- ---------------------------- 4. HASHTAGS ----------------------------
create table if not exists public.hashtags (
  tag             text primary key check (tag = lower(tag) and char_length(tag) between 1 and 50),
  reel_count      int default 0,
  last_used_at    timestamptz default now(),
  created_at      timestamptz default now()
);

create table if not exists public.reel_hashtags (
  reel_id  uuid not null references public.reels(id) on delete cascade,
  tag      text not null references public.hashtags(tag) on delete cascade,
  primary key (reel_id, tag)
);

create index if not exists reel_hashtags_tag_idx on public.reel_hashtags (tag);

alter table public.hashtags        enable row level security;
alter table public.reel_hashtags   enable row level security;

drop policy if exists "Hashtags readable by all" on public.hashtags;
create policy "Hashtags readable by all" on public.hashtags for select using (true);
drop policy if exists "Reel hashtags readable by all" on public.reel_hashtags;
create policy "Reel hashtags readable by all" on public.reel_hashtags for select using (true);
drop policy if exists "Reel hashtags writable by author" on public.reel_hashtags;
create policy "Reel hashtags writable by author" on public.reel_hashtags
  for all using (
    exists (select 1 from public.reels r where r.id = reel_id and r.author_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Trigger: when a reel is inserted, parse #tags out of caption and link them.
create or replace function public.parse_reel_hashtags()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m text;
  ts text[];
begin
  if new.caption is null then return new; end if;

  -- Pull out unique lowercased hashtag bodies (alphanumeric + underscore, 1..50 chars).
  ts := array(
    select distinct lower(substring(t from 2))
      from regexp_matches(new.caption, '#([A-Za-z0-9_]{1,50})', 'g') as t
  );

  foreach m in array ts loop
    insert into public.hashtags (tag, reel_count, last_used_at)
      values (m, 1, now())
    on conflict (tag) do update
      set reel_count   = public.hashtags.reel_count + 1,
          last_used_at = now();

    insert into public.reel_hashtags (reel_id, tag)
      values (new.id, m)
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_parse_reel_hashtags on public.reels;
create trigger trg_parse_reel_hashtags
  after insert on public.reels
  for each row execute function public.parse_reel_hashtags();


-- ---------------------------- 5. POLLS ----------------------------
create table if not exists public.polls (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  question        text not null check (char_length(question) between 5 and 280),
  closes_at       timestamptz not null,
  is_published    boolean default true,
  created_at      timestamptz default now()
);

create index if not exists polls_open_idx on public.polls (closes_at desc) where is_published = true;

create table if not exists public.poll_options (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references public.polls(id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 80),
  sort_order  int default 0,
  vote_count  int default 0
);

create index if not exists poll_options_poll_idx on public.poll_options (poll_id, sort_order);

create table if not exists public.poll_votes (
  poll_id     uuid not null references public.polls(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  option_id   uuid not null references public.poll_options(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (poll_id, user_id)
);

alter table public.polls          enable row level security;
alter table public.poll_options   enable row level security;
alter table public.poll_votes     enable row level security;

drop policy if exists "Polls readable by all" on public.polls;
create policy "Polls readable by all" on public.polls for select using (is_published = true);
drop policy if exists "Polls insertable by authed" on public.polls;
create policy "Polls insertable by authed" on public.polls for insert with check (auth.uid() = author_id);
drop policy if exists "Polls deletable by author or admin" on public.polls;
create policy "Polls deletable by author or admin" on public.polls
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "Poll options readable by all" on public.poll_options;
create policy "Poll options readable by all" on public.poll_options for select using (true);
drop policy if exists "Poll options insertable by author" on public.poll_options;
create policy "Poll options insertable by author" on public.poll_options for insert with check (
  exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid())
);

drop policy if exists "Poll votes readable by all" on public.poll_votes;
create policy "Poll votes readable by all" on public.poll_votes for select using (true);
drop policy if exists "Poll votes insertable by self" on public.poll_votes;
create policy "Poll votes insertable by self" on public.poll_votes
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.polls p
       where p.id = poll_id
         and p.is_published = true
         and p.closes_at > now()
    )
  );

-- Trigger: keep poll_options.vote_count synced.
create or replace function public.sync_poll_vote_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.poll_options set vote_count = vote_count + 1 where id = new.option_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_poll_vote_count on public.poll_votes;
create trigger trg_sync_poll_vote_count
  after insert on public.poll_votes
  for each row execute function public.sync_poll_vote_count();


-- ---------------------------- 6. PLAYER STATS ----------------------------
create table if not exists public.player_stats (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.profiles(id) on delete cascade,
  sport       text not null,
  season      int not null default extract(year from current_date)::int,
  stat_key    text not null,
  stat_value  numeric not null default 0,
  updated_at  timestamptz default now(),
  unique (player_id, sport, season, stat_key)
);

create index if not exists player_stats_player_idx on public.player_stats (player_id, sport, season);
create index if not exists player_stats_leaderboard_idx
  on public.player_stats (sport, season, stat_key, stat_value desc);

alter table public.player_stats enable row level security;
drop policy if exists "Player stats readable by all" on public.player_stats;
create policy "Player stats readable by all" on public.player_stats for select using (true);
drop policy if exists "Player stats writable by admin or self" on public.player_stats;
create policy "Player stats writable by admin or self" on public.player_stats
  for all using (
    auth.uid() = player_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- ---------------------------- 7. ACHIEVEMENTS ----------------------------
create table if not exists public.achievements (
  key         text primary key,
  name        text not null,
  description text not null,
  icon        text,
  category    text,
  sort_order  int default 0
);

create table if not exists public.user_achievements (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  achievement_key  text not null references public.achievements(key) on delete cascade,
  earned_at        timestamptz default now(),
  primary key (user_id, achievement_key)
);

create index if not exists user_achievements_user_idx on public.user_achievements (user_id);

alter table public.achievements        enable row level security;
alter table public.user_achievements   enable row level security;

drop policy if exists "Achievements readable by all" on public.achievements;
create policy "Achievements readable by all" on public.achievements for select using (true);
drop policy if exists "User achievements readable by all" on public.user_achievements;
create policy "User achievements readable by all" on public.user_achievements for select using (true);

-- Seed catalog.
insert into public.achievements (key, name, description, icon, category, sort_order) values
  ('first_post',        'First post',        'Posted your first piece of content.',        'Pencil',     'milestone',  10),
  ('team_player',       'Team player',       'Joined your first team.',                    'Users',      'team',       20),
  ('captain',           'Captain',           'Created or led a team.',                     'Star',       'team',       30),
  ('first_match',       'First match',       'Submitted or played your first match.',      'Trophy',     'match',      40),
  ('ten_wins',          'Ten wins',          'Your team has 10 confirmed match wins.',     'Award',      'match',      50),
  ('community_builder', 'Community builder', 'Followed by 100 people.',                    'Heart',      'social',     60),
  ('veteran',           'Veteran',           'Account older than one year.',               'Clock',      'milestone',  70),
  ('free_agent',        'Free agent',        'Listed yourself on the Free Agent board.',   'UserSearch', 'social',     80),
  ('cup_2026',          'Afghan Cup 2026',   'Participated in Afghan Cup 2026.',           'Trophy',     'event',      90),
  ('first_reel',        'First reel',        'Uploaded your first reel.',                  'Video',      'milestone',  100)
on conflict (key) do nothing;

-- Trigger: auto-grant first_reel when a user posts a reel for the first time.
create or replace function public.grant_first_reel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_achievements (user_id, achievement_key)
    values (new.author_id, 'first_reel')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_grant_first_reel on public.reels;
create trigger trg_grant_first_reel
  after insert on public.reels
  for each row execute function public.grant_first_reel();

-- Trigger: auto-grant team_player when joining a team.
create or replace function public.grant_team_player()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_achievements (user_id, achievement_key)
    values (new.player_id, 'team_player')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_grant_team_player on public.team_members;
create trigger trg_grant_team_player
  after insert on public.team_members
  for each row execute function public.grant_team_player();


-- ---------------------------- 8. SEARCH (pg_trgm) ----------------------------
create extension if not exists pg_trgm;

create index if not exists profiles_username_trgm  on public.profiles using gin (username gin_trgm_ops);
create index if not exists profiles_fullname_trgm  on public.profiles using gin (full_name gin_trgm_ops);
create index if not exists teams_name_trgm         on public.teams    using gin (name gin_trgm_ops);
create index if not exists news_title_trgm         on public.news_posts using gin (title gin_trgm_ops);
create index if not exists events_title_trgm       on public.events using gin (title gin_trgm_ops);
create index if not exists reels_caption_trgm      on public.reels using gin (caption gin_trgm_ops);
create index if not exists tournaments_name_trgm   on public.tournaments using gin (name gin_trgm_ops);


-- Verify
-- select count(*) from public.achievements;             -- 10
-- select tag, reel_count from public.hashtags;          -- after first reel with #tag posted
-- select * from public.active_suspension(<some-uuid>);  -- null until a row is inserted
