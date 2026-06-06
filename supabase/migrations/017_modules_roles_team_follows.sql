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
