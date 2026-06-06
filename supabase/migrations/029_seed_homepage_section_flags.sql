-- 029_seed_homepage_section_flags.sql
-- Per-section show/hide toggles for the public homepage. Each homepage section
-- is gated on its own `home.*` flag, managed from /admin/cms/homepage (and they
-- also appear in /admin/modules under "Homepage"). All default ON, so the
-- homepage is unchanged until an admin hides a section.
-- (Numbered 029 because 028 is taken by 028_external_sports_wall.sql.)
insert into public.feature_flags (key, label, description, category, is_enabled, default_value) values
  ('home.hero',            'Hero (video + headline)',     'Top video hero with the main headline and call-to-action buttons.',     'homepage', true, true),
  ('home.afghan_cup',      'Afghan Cup countdown banner', 'Red banner with the Afghan Cup countdown and the "Register your team" button.', 'homepage', true, true),
  ('home.stats',           'Stats bar',                   'The four big numbers (years, members, sports, events).',                'homepage', true, true),
  ('home.about',           'About teaser',                'Short "About ASF" intro block with bullet points.',                     'homepage', true, true),
  ('home.sports',          'Sports grid',                 'The five sport cards.',                                                 'homepage', true, true),
  ('home.upcoming_events', 'Upcoming events',             'Cards for the next published events.',                                  'homepage', true, true),
  ('home.scores_strip',    'Scores strip',                'Compact live & recent pro scores strip.',                               'homepage', true, true),
  ('home.gallery',         'Gallery teaser',              'Recent photos from the gallery.',                                       'homepage', true, true),
  ('home.newsletter',      'Newsletter signup',           'Email newsletter signup banner.',                                       'homepage', true, true),
  ('home.news',            'News teaser',                 'Latest news headlines block.',                                          'homepage', true, true)
on conflict (key) do nothing;
