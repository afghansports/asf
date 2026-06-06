-- =============================================================================
-- ASF Platform - Migration 006: CMS Schema
-- =============================================================================
-- Additive schema changes for the CMS-driven build per ASF_CLAUDE_CODE_PROMPT.md.
-- Adds columns to existing tables and creates 5 new tables.
-- Idempotent. Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: add phone_verified + total_games
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone_verified boolean default false;

alter table public.profiles
  add column if not exists total_games integer default 0;

-- -----------------------------------------------------------------------------
-- team_members: add is_active
-- -----------------------------------------------------------------------------
alter table public.team_members
  add column if not exists is_active boolean default true;


-- =============================================================================
-- management_team  (About > Management Team page)
-- =============================================================================
create table if not exists public.management_team (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text not null,
  bio         text,
  photo_url   text,
  category    text not null default 'board'
              check (category in ('board','volunteers')),
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists management_team_active_sort_idx
  on public.management_team (is_active, sort_order)
  where is_active = true;

drop trigger if exists trg_management_team_updated_at on public.management_team;
create trigger trg_management_team_updated_at
  before update on public.management_team
  for each row execute function public.set_updated_at();


-- =============================================================================
-- faq_items
-- =============================================================================
create table if not exists public.faq_items (
  id          uuid primary key default uuid_generate_v4(),
  question    text not null,
  answer      text not null,
  category    text not null default 'general'
              check (category in ('general','registration','teams','events','afghancup','volunteering')),
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists faq_active_idx
  on public.faq_items (category, sort_order)
  where is_active = true;

drop trigger if exists trg_faq_updated_at on public.faq_items;
create trigger trg_faq_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();


-- =============================================================================
-- history_timeline
-- =============================================================================
create table if not exists public.history_timeline (
  id          uuid primary key default uuid_generate_v4(),
  year        integer not null,
  title       text not null,
  description text,
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists history_year_idx
  on public.history_timeline (sort_order, year)
  where is_active = true;

drop trigger if exists trg_history_updated_at on public.history_timeline;
create trigger trg_history_updated_at
  before update on public.history_timeline
  for each row execute function public.set_updated_at();


-- =============================================================================
-- site_content  (CMS key/value store for editable text)
-- =============================================================================
create table if not exists public.site_content (
  id            uuid primary key default uuid_generate_v4(),
  content_key   text unique not null,
  content_value text not null default '',
  content_type  text default 'text'
                check (content_type in ('text','textarea','url','number','date','boolean','html')),
  label         text,
  section       text,
  updated_at    timestamptz not null default now()
);

create index if not exists site_content_section_idx on public.site_content (section);

drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();


-- =============================================================================
-- site_settings  (CMS structured settings)
-- =============================================================================
create table if not exists public.site_settings (
  id             uuid primary key default uuid_generate_v4(),
  setting_key    text unique not null,
  setting_value  text not null default '',
  setting_type   text default 'text'
                 check (setting_type in ('text','number','boolean','date','url')),
  label          text,
  group_name     text,
  updated_at     timestamptz not null default now()
);

create index if not exists site_settings_group_idx on public.site_settings (group_name);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- =============================================================================
-- RLS for the new tables
-- =============================================================================

-- Public-readable (active rows), admin-writable. Writes happen through admin
-- API routes using the service-role client which bypasses RLS, so we only need
-- read policies here. SELECT is open for the rows the public site needs.

-- management_team: public reads only active rows
alter table public.management_team enable row level security;
drop policy if exists "management_team_select_active" on public.management_team;
create policy "management_team_select_active" on public.management_team
  for select using (is_active = true);

-- faq_items: public reads only active rows
alter table public.faq_items enable row level security;
drop policy if exists "faq_select_active" on public.faq_items;
create policy "faq_select_active" on public.faq_items
  for select using (is_active = true);

-- history_timeline: public reads
alter table public.history_timeline enable row level security;
drop policy if exists "history_select_all" on public.history_timeline;
create policy "history_select_all" on public.history_timeline
  for select using (true);

-- site_content: public reads
alter table public.site_content enable row level security;
drop policy if exists "site_content_select_all" on public.site_content;
create policy "site_content_select_all" on public.site_content
  for select using (true);

-- site_settings: public reads
alter table public.site_settings enable row level security;
drop policy if exists "site_settings_select_all" on public.site_settings;
create policy "site_settings_select_all" on public.site_settings
  for select using (true);


-- =============================================================================
-- Verify
-- =============================================================================
-- After running, check that these 5 tables exist:
--   select tablename from pg_tables
--   where schemaname = 'public'
--     and tablename in ('management_team','faq_items','history_timeline','site_content','site_settings')
--   order by tablename;
-- Expected rowcount: 5
