-- =============================================================================
-- ASF Platform - Migration 002: Row Level Security Policies
-- =============================================================================
-- Per ASF_LAUNCH_PRD.md > STEP 1 > Row Level Security.
-- Run this AFTER 001_core_schema.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is_admin(user_id) -> boolean
-- -----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.is_admin = true);
$$;

-- -----------------------------------------------------------------------------
-- Helper: is_team_captain(team_id, user_id) -> boolean
-- -----------------------------------------------------------------------------
create or replace function public.is_team_captain(p_team_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.teams t where t.id = p_team_id and t.captain_id = uid);
$$;


-- =============================================================================
-- profiles
-- =============================================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all"      on public.profiles;
drop policy if exists "profiles_update_own"      on public.profiles;
drop policy if exists "profiles_insert_self"     on public.profiles;
drop policy if exists "profiles_admin_all"       on public.profiles;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- teams
-- =============================================================================
alter table public.teams enable row level security;

drop policy if exists "teams_select_all"         on public.teams;
drop policy if exists "teams_insert_authed"      on public.teams;
drop policy if exists "teams_update_captain"     on public.teams;
drop policy if exists "teams_delete_captain"     on public.teams;
drop policy if exists "teams_admin_all"          on public.teams;

create policy "teams_select_all"
  on public.teams for select
  using (true);

create policy "teams_insert_authed"
  on public.teams for insert
  with check (auth.uid() = captain_id);

create policy "teams_update_captain"
  on public.teams for update
  using (auth.uid() = captain_id)
  with check (auth.uid() = captain_id);

create policy "teams_delete_captain"
  on public.teams for delete
  using (auth.uid() = captain_id);

create policy "teams_admin_all"
  on public.teams for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- team_members
-- =============================================================================
alter table public.team_members enable row level security;

drop policy if exists "tm_select_all"            on public.team_members;
drop policy if exists "tm_insert_captain"        on public.team_members;
drop policy if exists "tm_update_captain"        on public.team_members;
drop policy if exists "tm_delete_captain_self"   on public.team_members;
drop policy if exists "tm_admin_all"             on public.team_members;

create policy "tm_select_all"
  on public.team_members for select
  using (true);

-- Captain can add players, OR a player can add themselves (e.g. via "Join Team" if looking for players)
create policy "tm_insert_captain"
  on public.team_members for insert
  with check (
    public.is_team_captain(team_id, auth.uid())
    or auth.uid() = player_id
  );

create policy "tm_update_captain"
  on public.team_members for update
  using (public.is_team_captain(team_id, auth.uid()))
  with check (public.is_team_captain(team_id, auth.uid()));

-- Captain can remove anyone, player can remove themselves
create policy "tm_delete_captain_self"
  on public.team_members for delete
  using (
    public.is_team_captain(team_id, auth.uid())
    or auth.uid() = player_id
  );

create policy "tm_admin_all"
  on public.team_members for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- events
-- =============================================================================
alter table public.events enable row level security;

drop policy if exists "events_select_published_or_own"   on public.events;
drop policy if exists "events_insert_authed"             on public.events;
drop policy if exists "events_update_organizer"          on public.events;
drop policy if exists "events_delete_organizer"          on public.events;
drop policy if exists "events_admin_all"                 on public.events;

create policy "events_select_published_or_own"
  on public.events for select
  using (
    is_published = true
    or auth.uid() = organizer_id
    or public.is_admin(auth.uid())
  );

create policy "events_insert_authed"
  on public.events for insert
  with check (auth.uid() = organizer_id);

-- Organizer can edit their own draft (not published-published events without admin)
create policy "events_update_organizer"
  on public.events for update
  using (auth.uid() = organizer_id and is_published = false)
  with check (auth.uid() = organizer_id);

create policy "events_delete_organizer"
  on public.events for delete
  using (auth.uid() = organizer_id and is_published = false);

create policy "events_admin_all"
  on public.events for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- gallery_images
-- =============================================================================
alter table public.gallery_images enable row level security;

drop policy if exists "gallery_select_published"   on public.gallery_images;
drop policy if exists "gallery_admin_all"          on public.gallery_images;

create policy "gallery_select_published"
  on public.gallery_images for select
  using (is_published = true or public.is_admin(auth.uid()));

create policy "gallery_admin_all"
  on public.gallery_images for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- news_posts
-- =============================================================================
alter table public.news_posts enable row level security;

drop policy if exists "news_select_published"   on public.news_posts;
drop policy if exists "news_admin_all"          on public.news_posts;

create policy "news_select_published"
  on public.news_posts for select
  using (is_published = true or public.is_admin(auth.uid()));

create policy "news_admin_all"
  on public.news_posts for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- newsletter_signups
-- =============================================================================
alter table public.newsletter_signups enable row level security;

drop policy if exists "newsletter_insert_public"   on public.newsletter_signups;
drop policy if exists "newsletter_admin_select"    on public.newsletter_signups;
drop policy if exists "newsletter_admin_all"       on public.newsletter_signups;

-- Anyone (logged in or not) can subscribe
create policy "newsletter_insert_public"
  on public.newsletter_signups for insert
  with check (true);

create policy "newsletter_admin_select"
  on public.newsletter_signups for select
  using (public.is_admin(auth.uid()));

create policy "newsletter_admin_all"
  on public.newsletter_signups for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- contact_submissions
-- =============================================================================
alter table public.contact_submissions enable row level security;

drop policy if exists "contact_insert_public"      on public.contact_submissions;
drop policy if exists "contact_admin_select"       on public.contact_submissions;
drop policy if exists "contact_admin_all"          on public.contact_submissions;

create policy "contact_insert_public"
  on public.contact_submissions for insert
  with check (true);

create policy "contact_admin_select"
  on public.contact_submissions for select
  using (public.is_admin(auth.uid()));

create policy "contact_admin_all"
  on public.contact_submissions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- sponsors
-- =============================================================================
alter table public.sponsors enable row level security;

drop policy if exists "sponsors_select_active"   on public.sponsors;
drop policy if exists "sponsors_admin_all"       on public.sponsors;

create policy "sponsors_select_active"
  on public.sponsors for select
  using (is_active = true or public.is_admin(auth.uid()));

create policy "sponsors_admin_all"
  on public.sponsors for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- follows
-- =============================================================================
alter table public.follows enable row level security;

drop policy if exists "follows_select_all"        on public.follows;
drop policy if exists "follows_insert_self"       on public.follows;
drop policy if exists "follows_delete_self"       on public.follows;
drop policy if exists "follows_admin_all"         on public.follows;

create policy "follows_select_all"
  on public.follows for select
  using (true);

create policy "follows_insert_self"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_self"
  on public.follows for delete
  using (auth.uid() = follower_id);

create policy "follows_admin_all"
  on public.follows for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- =============================================================================
-- platform_config
-- =============================================================================
alter table public.platform_config enable row level security;

drop policy if exists "config_select_all"   on public.platform_config;
drop policy if exists "config_admin_all"    on public.platform_config;

-- Public read so the app can read tier thresholds, business rules, Cup date, etc.
create policy "config_select_all"
  on public.platform_config for select
  using (true);

create policy "config_admin_all"
  on public.platform_config for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
