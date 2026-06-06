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
