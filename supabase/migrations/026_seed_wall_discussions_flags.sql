-- =============================================================================
-- ASF Platform - Migration 026: Seed missing module flags (Wall + Discussions)
-- =============================================================================
-- The navbar gates /feed ("Wall") and /discussions ("Talk") on the feature
-- flags `module.wall` and `module.discussions`, but those rows were never
-- seeded into feature_flags (only present in an unapplied 023 seed). With no
-- row, getFlags() defaults them to ENABLED and they never appear in
-- /admin/modules — so there was no way to turn "Talk"/"Wall" off.
-- This seeds them (enabled by default) so admins get a real on/off toggle.
-- Idempotent.
-- =============================================================================

insert into public.feature_flags (key, label, description, category, is_enabled, default_value, rollout_percent)
values
  ('module.wall',        'Wall',               'Community wall / activity feed at /feed.',            'social', true, true, 100),
  ('module.discussions', 'Discussions (Talk)', 'Discussion boards at /discussions, shown as "Talk".', 'social', true, true, 100)
on conflict (key) do nothing;
