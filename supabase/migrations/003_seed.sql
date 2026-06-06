-- =============================================================================
-- ASF Platform - Migration 003: Seed Data
-- =============================================================================
-- Per ASF_LAUNCH_PRD.md > SEED DATA.
-- Run AFTER 001_core_schema.sql and 002_rls_policies.sql.
--
-- NOTE on countries / US states: per the implementation, those static lookup
-- lists live in TypeScript (lib/data/countries.ts, lib/data/us-states.ts)
-- because (a) they are static, (b) the CountryPicker / StatePicker render on
-- the client and benefit from zero DB roundtrips, and (c) the PRD does not
-- specify a countries or us_states table in Section 4 of the schema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- platform_config
-- -----------------------------------------------------------------------------
-- Schema convention: { "value": <native_value>, "type": "<json|string|number|bool>" }
-- so callers can read either the typed value or the wrapped jsonb.
-- -----------------------------------------------------------------------------

insert into public.platform_config (key, value, description) values
  -- Admin allow-list (mirrors ADMIN_EMAILS env var; the auth trigger in 001 reads this row to set is_admin)
  ('admin_emails',
    jsonb_build_object('value', 'agdcvakbl@gmail.com', 'type', 'string'),
    'Comma-separated list of emails granted is_admin=true on signup'),

  -- Tier thresholds
  ('tier_1_requirement',
    jsonb_build_object('value', 'email_verified', 'type', 'string'),
    'Tier 1 (Community Member): requires verified email'),
  ('tier_2_requirement',
    jsonb_build_object('value', 'profile_complete_sport_phone', 'type', 'string'),
    'Tier 2 (Player): profile complete + sport selected + phone verified'),
  ('tier_3_requirement',
    jsonb_build_object('value', 'phone_verified_team_5_players', 'type', 'string'),
    'Tier 3 (Team Captain): phone verified + team with min 5 players created'),
  ('tier_4_requirement',
    jsonb_build_object('value', '2_active_teams_chapter_approval', 'type', 'string'),
    'Tier 4 (Association Admin): 2 active teams + chapter manager approval'),
  ('tier_5_requirement',
    jsonb_build_object('value', '1000_followers_id_deputy_asf', 'type', 'string'),
    'Tier 5 (Chapter Manager): 1000 followers + ID verified + deputy + ASF approval'),

  -- Business rules
  ('match_auto_confirm_hours',
    jsonb_build_object('value', 48, 'type', 'number'),
    'Hours after which a posted match result is auto-confirmed'),
  ('transfer_window_days_per_side',
    jsonb_build_object('value', 7, 'type', 'number'),
    'Days each captain has to approve/reject a transfer'),
  ('tournament_min_teams',
    jsonb_build_object('value', 2, 'type', 'number'),
    'Minimum number of teams to create a tournament'),
  ('tournament_min_players',
    jsonb_build_object('value', 15, 'type', 'number'),
    'Minimum number of players per team for tournament eligibility'),
  ('post_edit_window_minutes',
    jsonb_build_object('value', 30, 'type', 'number'),
    'Minutes after posting that a post can still be edited'),
  ('post_delete_window_hours',
    jsonb_build_object('value', 24, 'type', 'number'),
    'Hours after posting that a post can still be deleted by author'),
  ('chapter_inactivity_days',
    jsonb_build_object('value', 90, 'type', 'number'),
    'Days of chapter manager inactivity before auto-demote'),
  ('team_inactive_badge_days',
    jsonb_build_object('value', 90, 'type', 'number'),
    'Days of team inactivity before showing inactive badge'),

  -- Afghan Cup 2026
  ('afghan_cup_2026_date',
    jsonb_build_object('value', '2026-07-02T00:00:00Z', 'type', 'string'),
    'Afghan Cup 2026 start date (ISO 8601 UTC). Update when confirmed.'),
  ('afghan_cup_2026_host_city',
    jsonb_build_object('value', 'Northern Virginia', 'type', 'string'),
    'Afghan Cup 2026 host city. Update when confirmed.'),
  ('afghan_cup_2026_registration_open',
    jsonb_build_object('value', '2026-04-01T00:00:00Z', 'type', 'string'),
    'Afghan Cup 2026 registration opens. Update when confirmed.'),

  -- Module enablement (per PRD: all Phase 1 enabled, Phase 2/3 disabled)
  ('module_match_results',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 2: match result submission UI'),
  ('module_free_agent_board',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 2: free agent board UI (data layer ready)'),
  ('module_direct_messages',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 2: direct messages UI'),
  ('module_tournament_brackets',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 3: tournament bracket engine'),
  ('module_player_rankings',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 3: ELO / player rankings'),
  ('module_transfers',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 3: transfer windows'),
  ('module_whatsapp_notifications',
    jsonb_build_object('value', false, 'type', 'bool'),
    'Phase 2: WhatsApp Business API notifications')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();


-- -----------------------------------------------------------------------------
-- Afghan Cup 2026 (featured event shell, organizer assigned later)
-- -----------------------------------------------------------------------------
insert into public.events (
  id, title, slug, event_type, sport, description,
  start_datetime, end_datetime,
  country_code, state_province, city, venue_name,
  is_free, is_published, is_featured
) values (
  '00000000-0000-0000-0000-000000000001',
  'Afghan Cup 2026',
  'afghan-cup-2026',
  'tournament',
  'soccer',
  'The 28th edition of the Afghan Cup. Eligibility: ASF Affiliate teams only (is_asf_affiliate = true). Host city, exact dates, and registration window will be confirmed.',
  '2026-07-02T00:00:00Z',
  '2026-07-05T00:00:00Z',
  'US',
  'VA',
  'Northern Virginia',
  null,
  true,
  true,
  true
)
on conflict (id) do update
  set title          = excluded.title,
      description    = excluded.description,
      start_datetime = excluded.start_datetime,
      end_datetime   = excluded.end_datetime,
      country_code   = excluded.country_code,
      state_province = excluded.state_province,
      city           = excluded.city,
      is_published   = excluded.is_published,
      is_featured    = excluded.is_featured;


-- -----------------------------------------------------------------------------
-- Gallery: 6 placeholder rows (real photos uploaded via /admin/gallery)
-- -----------------------------------------------------------------------------
insert into public.gallery_images (id, image_url, caption, event_name, year, sort_order, is_published)
select
  uuid_generate_v4(),
  '/placeholder-gallery.svg',
  'Photo coming soon',
  'Afghan Cup 2025',
  2025,
  i,
  true
from generate_series(1, 6) as g(i)
on conflict do nothing;


-- =============================================================================
-- Verification queries
-- =============================================================================
-- After running:
--   select count(*) from platform_config;            -- expect 23
--   select count(*) from events where is_featured;   -- expect 1
--   select count(*) from gallery_images;             -- expect 6 (or more if rerun, but deduped by id)
--   select key, value from platform_config order by key;
