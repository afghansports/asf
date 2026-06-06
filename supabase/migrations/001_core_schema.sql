-- =============================================================================
-- ASF Platform - Migration 001: Core Schema
-- =============================================================================
-- Creates all MVP tables per ASF_LAUNCH_PRD.md > Section 4.
-- Run this in the Supabase SQL editor BEFORE 002_rls_policies.sql.
-- Idempotent where reasonable. Drops nothing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- profiles  (extends auth.users)
-- =============================================================================
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  username               text unique not null,
  full_name              text,
  avatar_url             text,
  bio                    text check (char_length(bio) <= 200),

  -- Location
  country_code           text,                       -- ISO 3166-1 alpha-2 (e.g. 'US')
  state_province         text,                       -- USPS code for US ('VA','CA',...) or free for non-US
  city                   text,

  -- Contact
  phone                  text,
  phone_country_code     text,

  -- Sport interests (multi-select pills in onboarding)
  sport_interests        text[] default '{}',

  -- Player mode
  is_player              boolean default false,
  sport                  text,                       -- 'soccer','basketball','volleyball','bowling','table_tennis'
  position               text,
  is_free_agent          boolean default false,

  -- Roles & status
  is_admin               boolean default false,
  is_active              boolean default true,
  onboarding_completed   boolean default false,

  -- Privacy & notifications
  email_notifications    boolean default true,
  show_email             boolean default false,
  show_phone             boolean default false,

  -- Cached counts (incremented by triggers below)
  follower_count         integer default 0,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists profiles_username_idx        on public.profiles (lower(username));
create index if not exists profiles_country_state_idx   on public.profiles (country_code, state_province);
create index if not exists profiles_is_player_idx       on public.profiles (is_player) where is_player = true;
create index if not exists profiles_is_free_agent_idx   on public.profiles (is_free_agent) where is_free_agent = true;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- =============================================================================
-- Auto-create profile on auth.users insert
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username       text;
  v_admin_emails   text;
  v_is_admin       boolean := false;
  v_email_local    text;
  v_suffix         integer := 0;
  v_candidate      text;
begin
  -- Derive username from email local-part
  v_email_local := lower(split_part(coalesce(new.email, ''), '@', 1));
  v_email_local := regexp_replace(v_email_local, '[^a-z0-9_]+', '_', 'g');
  if v_email_local = '' then
    v_email_local := 'user_' || substr(new.id::text, 1, 8);
  end if;

  v_candidate := v_email_local;
  loop
    exit when not exists (select 1 from public.profiles where username = v_candidate);
    v_suffix := v_suffix + 1;
    v_candidate := v_email_local || v_suffix::text;
  end loop;
  v_username := v_candidate;

  -- Check ADMIN_EMAILS allow-list (set as a Postgres setting if needed; otherwise compare via app layer)
  -- We compare the literal email here against a comma-separated list stored in platform_config.
  select value->>'value' into v_admin_emails
    from public.platform_config where key = 'admin_emails';

  if v_admin_emails is not null and new.email is not null then
    v_is_admin := position(lower(new.email) in lower(v_admin_emails)) > 0;
  end if;

  insert into public.profiles (id, username, full_name, is_admin)
  values (
    new.id,
    v_username,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_is_admin
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- teams
-- =============================================================================
create table if not exists public.teams (
  id                       uuid primary key default uuid_generate_v4(),
  name                     text not null,
  slug                     text unique not null,

  sport                    text not null,                  -- 'soccer','basketball','volleyball','bowling','table_tennis'
  country_code             text not null default 'US',
  state_province           text,
  city                     text,

  description              text check (char_length(description) <= 500),
  logo_url                 text,
  banner_url               text,

  captain_id               uuid not null references public.profiles(id) on delete restrict,

  founded_year             integer,
  member_count             integer default 1,
  follower_count           integer default 0,

  is_looking_for_players   boolean default false,
  is_asf_affiliate         boolean default false,
  is_active                boolean default true,

  contact_email            text,
  contact_phone            text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists teams_sport_idx                  on public.teams (sport);
create index if not exists teams_country_state_idx          on public.teams (country_code, state_province);
create index if not exists teams_captain_idx                on public.teams (captain_id);
create index if not exists teams_looking_idx                on public.teams (is_looking_for_players) where is_looking_for_players = true;
create index if not exists teams_affiliate_idx              on public.teams (is_asf_affiliate)        where is_asf_affiliate        = true;

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();


-- =============================================================================
-- team_members
-- =============================================================================
create table if not exists public.team_members (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references public.teams(id) on delete cascade,
  player_id       uuid not null references public.profiles(id) on delete cascade,

  role            text not null default 'player'           -- 'captain','vice_captain','player','coach','manager'
                  check (role in ('captain','vice_captain','player','coach','manager')),
  position        text,
  jersey_number   integer,

  joined_at       timestamptz not null default now(),
  unique (team_id, player_id)
);

create index if not exists team_members_team_idx     on public.team_members (team_id);
create index if not exists team_members_player_idx   on public.team_members (player_id);


-- =============================================================================
-- events
-- =============================================================================
create table if not exists public.events (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  slug                text unique,

  event_type          text not null default 'community'
                      check (event_type in ('tournament','match','camp','community','other')),
  sport               text,                                  -- nullable: community events may not be sport-specific
  description         text,
  banner_url          text,

  start_datetime      timestamptz not null,
  end_datetime        timestamptz,

  -- Location
  country_code        text not null default 'US',
  state_province      text,
  city                text,
  venue_name          text,
  address             text,

  is_free             boolean default true,
  registration_link   text,

  organizer_id        uuid references public.profiles(id) on delete set null,
  organizer_team_id   uuid references public.teams(id) on delete set null,

  is_published        boolean default false,
  is_featured         boolean default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists events_published_start_idx   on public.events (is_published, start_datetime);
create index if not exists events_state_idx             on public.events (state_province) where is_published = true;
create index if not exists events_sport_idx             on public.events (sport)          where is_published = true;
create index if not exists events_organizer_idx         on public.events (organizer_id);
create index if not exists events_team_idx              on public.events (organizer_team_id);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- =============================================================================
-- gallery_images
-- =============================================================================
create table if not exists public.gallery_images (
  id              uuid primary key default uuid_generate_v4(),
  image_url       text not null,
  caption         text,
  event_name      text,
  year            integer,
  sort_order      integer default 0,
  is_published    boolean default true,
  uploaded_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists gallery_year_idx        on public.gallery_images (year);
create index if not exists gallery_sort_idx        on public.gallery_images (sort_order);
create index if not exists gallery_published_idx   on public.gallery_images (is_published) where is_published = true;


-- =============================================================================
-- news_posts
-- =============================================================================
create table if not exists public.news_posts (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  slug            text unique not null,
  content         text,                                       -- HTML or plain text
  excerpt         text check (char_length(excerpt) <= 160),
  image_url       text,
  author_id       uuid references public.profiles(id) on delete set null,
  is_published    boolean default false,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists news_published_idx   on public.news_posts (is_published, published_at desc);

drop trigger if exists trg_news_updated_at on public.news_posts;
create trigger trg_news_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();


-- =============================================================================
-- newsletter_signups
-- =============================================================================
create table if not exists public.newsletter_signups (
  id              uuid primary key default uuid_generate_v4(),
  email           text not null unique,
  name            text,
  country_code    text,
  created_at      timestamptz not null default now()
);


-- =============================================================================
-- contact_submissions
-- =============================================================================
create table if not exists public.contact_submissions (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  email           text not null,
  phone           text,
  subject         text not null
                  check (subject in (
                    'general_inquiry','team_registration','afghan_cup',
                    'volunteer','sponsorship','media','other'
                  )),
  message         text not null check (char_length(message) >= 20),
  is_read         boolean default false,
  created_at      timestamptz not null default now()
);

create index if not exists contact_unread_idx   on public.contact_submissions (is_read, created_at desc);


-- =============================================================================
-- sponsors
-- =============================================================================
create table if not exists public.sponsors (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  logo_url        text,
  website_url     text,
  tier            text not null default 'partner'
                  check (tier in ('platinum','gold','silver','partner')),
  is_active       boolean default true,
  sort_order      integer default 0,
  created_at      timestamptz not null default now()
);


-- =============================================================================
-- follows  (used in onboarding step 3 + general team/user follows)
-- =============================================================================
create table if not exists public.follows (
  id              uuid primary key default uuid_generate_v4(),
  follower_id     uuid not null references public.profiles(id) on delete cascade,
  subject_type    text not null check (subject_type in ('team','user')),
  subject_id      uuid not null,
  created_at      timestamptz not null default now(),
  unique (follower_id, subject_type, subject_id)
);

create index if not exists follows_subject_idx   on public.follows (subject_type, subject_id);
create index if not exists follows_follower_idx  on public.follows (follower_id);


-- =============================================================================
-- platform_config  (key/value store for tier thresholds, business rules, etc.)
-- =============================================================================
create table if not exists public.platform_config (
  key             text primary key,
  value           jsonb not null,
  description     text,
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_platform_config_updated_at on public.platform_config;
create trigger trg_platform_config_updated_at
  before update on public.platform_config
  for each row execute function public.set_updated_at();


-- =============================================================================
-- Counter triggers
-- =============================================================================

-- team_members count -> teams.member_count
create or replace function public.update_team_member_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.teams set member_count = member_count + 1 where id = new.team_id;
  elsif (tg_op = 'DELETE') then
    update public.teams set member_count = greatest(member_count - 1, 0) where id = old.team_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_team_members_count on public.team_members;
create trigger trg_team_members_count
  after insert or delete on public.team_members
  for each row execute function public.update_team_member_count();


-- follows count -> teams.follower_count / profiles.follower_count
create or replace function public.update_follow_counts()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    if (new.subject_type = 'team') then
      update public.teams set follower_count = follower_count + 1 where id = new.subject_id;
    elsif (new.subject_type = 'user') then
      update public.profiles set follower_count = follower_count + 1 where id = new.subject_id;
    end if;
  elsif (tg_op = 'DELETE') then
    if (old.subject_type = 'team') then
      update public.teams set follower_count = greatest(follower_count - 1, 0) where id = old.subject_id;
    elsif (old.subject_type = 'user') then
      update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.subject_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_follows_counts on public.follows;
create trigger trg_follows_counts
  after insert or delete on public.follows
  for each row execute function public.update_follow_counts();


-- =============================================================================
-- Verification queries
-- =============================================================================
-- After running this migration, run:
--   select tablename from pg_tables where schemaname = 'public' order by tablename;
-- Expected tables (11):
--   contact_submissions, events, follows, gallery_images, news_posts,
--   newsletter_signups, platform_config, profiles, sponsors, team_members, teams
