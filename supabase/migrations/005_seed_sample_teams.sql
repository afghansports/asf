-- =============================================================================
-- ASF Platform - Migration 005: Sample Teams (for onboarding bootstrap)
-- =============================================================================
-- Six placeholder teams so the onboarding "Find your community" step has real
-- content to render. Idempotent on slug. Captain is set to NULL for now;
-- founders can claim them later via admin or these can be deleted/replaced.
--
-- These teams have NO captain (captain_id is required, but we can satisfy that
-- by inserting a system "ASF Federation" profile first OR by relaxing the FK
-- temporarily for seeding). Using the simpler path: create one system profile
-- whose id matches a fixed UUID, and assign all sample teams to it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Reserve a system "ASF" auth user we can attach things to.
--    (We can't insert directly into auth.users via SQL editor reliably, so
--    instead we relax the FK during the insert by using a deferred constraint,
--    OR we use the admin's profile if they have signed up.)
--
--    Pragmatic fix: we'll require that the migration is run AFTER the admin
--    (agdcvakbl@gmail.com) has signed up at least once. We pick the first
--    is_admin=true profile as the default captain for sample teams.
--    If no admin profile exists yet, the migration is a no-op and you can
--    re-run it later.
-- -----------------------------------------------------------------------------

do $$
declare
  v_captain uuid;
begin
  select id into v_captain
    from public.profiles
   where is_admin = true
   order by created_at asc
   limit 1;

  if v_captain is null then
    raise notice 'No admin profile yet. Sign up with an ADMIN_EMAILS account first, then re-run this migration.';
    return;
  end if;

  insert into public.teams (
    name, slug, sport, country_code, state_province, city,
    description, captain_id, founded_year,
    is_looking_for_players, is_asf_affiliate
  ) values
    ('Northern Virginia Eagles',  'nova-eagles',     'soccer',       'US', 'VA', 'Arlington',       'Founding member of the ASF community.',                v_captain, 1998, true,  true),
    ('Sacramento Strikers',       'sac-strikers',    'soccer',       'US', 'CA', 'Sacramento',      'Pickup and league soccer for the West Coast diaspora.', v_captain, 2015, true,  false),
    ('Houston Wolves',            'houston-wolves',  'soccer',       'US', 'TX', 'Houston',         'Texas-strong Afghan soccer.',                           v_captain, 2018, true,  false),
    ('Bay Area Hawks',            'bay-hawks',       'basketball',   'US', 'CA', 'Fremont',         'Basketball every Saturday at the community center.',    v_captain, 2020, true,  false),
    ('DC Spikers',                'dc-spikers',      'volleyball',   'US', 'DC', 'Washington',      'Volleyball nights at the rec center.',                  v_captain, 2022, true,  false),
    ('Fairfax Strike Kings',      'fairfax-kings',   'bowling',      'US', 'VA', 'Fairfax',         'Friday night bowling league.',                          v_captain, 2021, false, false)
  on conflict (slug) do nothing;

  -- Add the system captain as a member of each team they captain
  insert into public.team_members (team_id, player_id, role)
  select t.id, v_captain, 'captain'
    from public.teams t
   where t.captain_id = v_captain
  on conflict (team_id, player_id) do nothing;
end $$;

-- =============================================================================
-- Verification
-- =============================================================================
-- After running:
--   select count(*) from teams;            -- expect 6 (or more if you already had teams)
--   select name, sport, city, state_province from teams order by created_at;
