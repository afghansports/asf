-- =============================================================================
-- ASF Platform - Migration 025: Flexible ASF Team categories
-- =============================================================================
-- Consolidates "Management Team" and "Volunteers" into one ASF Team concept.
-- They already share the `management_team` table, differing only by `category`.
--
-- Problems this fixes:
--   1. category had a hard CHECK (category in ('board','volunteers')) — so new
--      categories (management, alumni, …) could never be added, and the admin
--      form actually saved 'volunteer' (singular) which VIOLATED the check.
--   2. The vocabulary is renamed to what ASF actually uses: Management + Alumni,
--      with the list now admin-editable (Admin → Settings → "ASF Team
--      categories"), so Volunteers or any other group can be re-added later
--      without a code or schema change.
-- Idempotent.
-- =============================================================================

-- 1. Drop the restrictive CHECK so category is admin-defined free text.
alter table public.management_team
  drop constraint if exists management_team_category_check;

-- 2. Normalize existing rows to the new vocabulary.
update public.management_team set category = 'management'
  where category in ('board', 'management_team', 'staff');
update public.management_team set category = 'alumni'
  where category in ('volunteers', 'volunteer');

-- 3. New rows default to 'management'.
alter table public.management_team alter column category set default 'management';

-- 4. Configurable category list, editable from Admin → Settings. Stored as a
--    comma-separated text value so the existing settings text editor can manage
--    it; the ASF Team form reads its dropdown options from here.
insert into public.site_settings (setting_key, setting_value, setting_type, label, group_name)
values (
  'team_categories',
  'management,alumni',
  'text',
  'ASF Team categories (comma-separated, in display order)',
  'team'
)
on conflict (setting_key) do nothing;
