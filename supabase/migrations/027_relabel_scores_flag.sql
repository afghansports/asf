-- 027_relabel_scores_flag.sql
-- The public /scores page is gated by the `module.external_sports` flag, but the
-- flag shipped labeled "External sports feed" under the Integrations group — so an
-- admin looking in /admin/modules to show/hide "Scores" couldn't find the switch.
-- Relabel it "Scores" and move it into the Content group for discoverability.
-- Data-only; the flag key (referenced in code) is unchanged.
update public.feature_flags
set
  label = 'Scores',
  description = 'Public Scores page — live & recent pro/international fixtures, standings, and headlines from public sports APIs.',
  category = 'content'
where key = 'module.external_sports';
