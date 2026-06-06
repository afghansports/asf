-- =============================================================================
-- ASF Platform - Migration 009: Replace broken gallery placeholders + sample teams
-- =============================================================================
-- 1. Replaces the 6 "Photo coming soon" placeholder rows from migration 003
--    with real Unsplash sports photos (license: free for commercial use).
--    Admins can swap any of these later from /admin/gallery.
-- 2. Seeds 6 sample teams using ANY existing profile as captain (admin
--    preferred, falls back to the most recent user). Unblocks /teams and
--    the onboarding "Find your community" step.
-- 3. Adds team_member rows so member_count is correct.
--
-- Idempotent. Safe to re-run.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Replace broken gallery placeholders with real seed photos.
-- ----------------------------------------------------------------------------
-- Strategy: pick the 6 oldest "Photo coming soon" rows by sort_order, replace
-- their image_url + caption + event_name with real seed data, leaving them
-- editable by admins via /admin/gallery.

with broken as (
  select id, sort_order
    from public.gallery_images
   where caption = 'Photo coming soon'
     and image_url = '/placeholder-gallery.svg'
   order by sort_order asc
   limit 6
),
replacements (idx, url, caption, event_name, year) as (
  values
    (1, 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200', 'Soccer match action shot',                'Afghan Cup 2024',          2024),
    (2, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200', 'Basketball league finals',                'Basketball League 2024',   2024),
    (3, 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200', 'Volleyball tournament setup',             'Volleyball Open 2024',     2024),
    (4, 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200', 'Community day at Reston',                 'Community Day 2024',       2024),
    (5, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200', 'Junior soccer training in Northern VA',    'Youth Programs 2024',      2024),
    (6, 'https://images.unsplash.com/photo-1518644961665-ed172691aaa1?w=1200', 'Bowling night at the community lanes',     'Bowling Night 2024',       2024)
),
ranked as (
  select b.id, row_number() over (order by b.sort_order) as rn
    from broken b
)
update public.gallery_images g
   set image_url  = r.url,
       caption    = r.caption,
       event_name = r.event_name,
       year       = r.year
  from ranked rk
  join replacements r on r.idx = rk.rn
 where g.id = rk.id;


-- ----------------------------------------------------------------------------
-- 2. Seed sample teams using any existing user as captain.
-- ----------------------------------------------------------------------------
do $$
declare
  v_captain uuid;
begin
  -- Prefer an admin profile, otherwise the most recent profile.
  select id into v_captain
    from public.profiles
   where is_admin = true
   order by created_at asc
   limit 1;

  if v_captain is null then
    select id into v_captain
      from public.profiles
     order by created_at desc
     limit 1;
  end if;

  if v_captain is null then
    raise notice 'No profiles exist yet. Sign up first, then re-run this migration.';
    return;
  end if;

  insert into public.teams (
    name, slug, sport, country_code, state_province, city,
    description, captain_id, founded_year,
    is_looking_for_players, is_asf_affiliate
  ) values
    ('Northern Virginia Eagles', 'nova-eagles',    'soccer',     'US', 'VA', 'Arlington',  'Founding member of the ASF community. Pickup matches every Saturday at Bluemont Park.', v_captain, 1998, true,  true),
    ('Sacramento Strikers',      'sac-strikers',   'soccer',     'US', 'CA', 'Sacramento', 'Pickup and league soccer for the West Coast diaspora.',                                  v_captain, 2015, true,  false),
    ('Houston Wolves',           'houston-wolves', 'soccer',     'US', 'TX', 'Houston',    'Texas-strong Afghan soccer. Practice Sundays in Memorial Park.',                         v_captain, 2018, true,  false),
    ('Bay Area Hawks',           'bay-hawks',      'basketball', 'US', 'CA', 'Fremont',    'Basketball every Saturday at the community center. All skill levels welcome.',          v_captain, 2020, true,  false),
    ('DC Spikers',               'dc-spikers',     'volleyball', 'US', 'DC', 'Washington', 'Volleyball nights at the rec center. Mixed gender teams.',                               v_captain, 2022, true,  false),
    ('Fairfax Strike Kings',     'fairfax-kings',  'bowling',    'US', 'VA', 'Fairfax',    'Friday night bowling league at the Bowl America in Fairfax.',                            v_captain, 2021, false, false)
  on conflict (slug) do nothing;

  -- Captain membership rows (so member_count trigger fires correctly).
  insert into public.team_members (team_id, player_id, role)
  select t.id, v_captain, 'captain'
    from public.teams t
   where t.captain_id = v_captain
  on conflict (team_id, player_id) do nothing;
end $$;


-- ----------------------------------------------------------------------------
-- 3. Verify
-- ----------------------------------------------------------------------------
--    select count(*) from public.gallery_images;
--      -- All rows now have a real image_url; no more "Photo coming soon" / placeholder.svg.
--    select name, slug, sport, city, state_province from public.teams order by name;
--    select count(*) from public.teams;  -- expected: 6
