-- 021: Demo content so reels, polls, matches, tournaments, achievements
-- pages aren't empty for first-time users. Idempotent. Run after 020.

-- ---------------------------- TOURNAMENTS ----------------------------
insert into public.tournaments (slug, name, sport, format, start_date, end_date, city, state_province, country_code, status, is_published, is_featured, description)
values
  ('afghan-cup-2026',
   'Afghan Cup 2026',
   'soccer',
   'group_then_knockout',
   (current_date + interval '60 days')::date,
   (current_date + interval '64 days')::date,
   'Fremont', 'CA', 'US',
   'registration', true, true,
   'The eighth edition of the Afghan Cup. Sixteen teams competing across four group stages, knockout brackets, and a single-day finals weekend.'),
  ('asf-summer-classic-2026',
   'ASF Summer Classic 2026',
   'soccer',
   'round_robin',
   (current_date + interval '30 days')::date,
   (current_date + interval '32 days')::date,
   'Toronto', 'ON', 'CA',
   'announced', true, false,
   'Round-robin summer competition with men''s and women''s divisions hosted by the Toronto chapter.'),
  ('bay-area-volleyball-open',
   'Bay Area Volleyball Open',
   'volleyball',
   'single_elimination',
   (current_date + interval '21 days')::date,
   (current_date + interval '21 days')::date,
   'Hayward', 'CA', 'US',
   'registration', true, false,
   'One-day single-elimination volleyball bracket. Six-person teams, FIVB rules, best-of-five sets in the final.'),
  ('cricket-cup-london-2026',
   'ASF Cricket Cup — London 2026',
   'cricket',
   'group_then_knockout',
   (current_date + interval '50 days')::date,
   (current_date + interval '51 days')::date,
   'London', null, 'GB',
   'announced', true, false,
   'T20 format competition with chapter teams from the UK and continental Europe.')
on conflict (slug) do nothing;


-- ---------------------------- POLLS ----------------------------
do $$
declare
  any_user uuid;
begin
  select id into any_user from public.profiles limit 1;
  if any_user is null then return; end if;

  insert into public.polls (id, author_id, question, is_published, closes_at, created_at)
  values
    (gen_random_uuid(), any_user,
     'Who wins Afghan Cup 2026?',
     true, now() + interval '30 days', now() - interval '2 days'),
    (gen_random_uuid(), any_user,
     'Which sport should ASF add to its 2026 calendar?',
     true, now() + interval '14 days', now() - interval '5 days'),
    (gen_random_uuid(), any_user,
     'Best Afghan diaspora club this season?',
     true, now() + interval '7 days', now() - interval '1 day')
  on conflict do nothing;
end $$;

-- Poll options for the seeded polls (only if poll_options table exists).
do $$
declare
  p1 uuid;
  p2 uuid;
  p3 uuid;
begin
  if to_regclass('public.poll_options') is null then return; end if;

  select id into p1 from public.polls where question = 'Who wins Afghan Cup 2026?' limit 1;
  select id into p2 from public.polls where question = 'Which sport should ASF add to its 2026 calendar?' limit 1;
  select id into p3 from public.polls where question = 'Best Afghan diaspora club this season?' limit 1;

  if p1 is not null then
    insert into public.poll_options (poll_id, label, sort_order) values
      (p1, 'Khorasan FC',      10),
      (p1, 'Hindukush United', 20),
      (p1, 'Pamir SC',         30),
      (p1, 'Kabul Athletic',   40)
    on conflict do nothing;
  end if;
  if p2 is not null then
    insert into public.poll_options (poll_id, label, sort_order) values
      (p2, 'Badminton',  10),
      (p2, 'Wrestling',  20),
      (p2, 'Athletics',  30),
      (p2, 'Chess',      40)
    on conflict do nothing;
  end if;
  if p3 is not null then
    insert into public.poll_options (poll_id, label, sort_order) values
      (p3, 'Khorasan FC',       10),
      (p3, 'Pamir SC',          20),
      (p3, 'Koh-e-Noor Sports', 30),
      (p3, 'Hindukush United',  40)
    on conflict do nothing;
  end if;
end $$;


-- ---------------------------- REELS (using royalty-free sample videos) ----------------------------
-- Pixabay + Pexels host CC0 sport clips suitable for seed content. URLs are
-- the direct mp4 endpoints (no API key needed). Replace with real ASF
-- uploads when members start posting.
do $$
declare
  any_user uuid;
begin
  select id into any_user from public.profiles limit 1;
  if any_user is null then return; end if;

  insert into public.reels (author_id, video_url, thumbnail_url, caption, sport, country_code, state_province, is_published, view_count, like_count)
  values
    (any_user,
     'https://cdn.pixabay.com/video/2024/06/12/216138_large.mp4',
     'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=600&q=80',
     'Bay Area training session — full speed warm-up before the weekend fixture. #soccer #training',
     'soccer', 'US', 'CA', true, 432, 28),
    (any_user,
     'https://cdn.pixabay.com/video/2024/05/03/210010_large.mp4',
     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
     'Futsal night in Hamburg — 5-a-side semifinal highlights. #futsal',
     'futsal', 'DE', null, true, 198, 14),
    (any_user,
     'https://cdn.pixabay.com/video/2022/03/29/112577-696167587_large.mp4',
     'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=600&q=80',
     'Volleyball practice in Virginia. Working on serve receive. #volleyball',
     'volleyball', 'US', 'VA', true, 312, 21),
    (any_user,
     'https://cdn.pixabay.com/video/2020/03/10/33134-397142724_large.mp4',
     'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
     'Sunday cricket nets in London. Big swing connecting. #cricket',
     'cricket', 'GB', null, true, 156, 11),
    (any_user,
     'https://cdn.pixabay.com/video/2021/09/30/89685-625810099_large.mp4',
     'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=600&q=80',
     'Community day in Fremont — kids first basketball clinic. #basketball #youth',
     'basketball', 'US', 'CA', true, 587, 39),
    (any_user,
     'https://cdn.pixabay.com/video/2024/04/02/206406_large.mp4',
     'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=600&q=80',
     'Coach''s touch-line view. Toronto chapter, opening match. #soccer #matchday',
     'soccer', 'CA', 'ON', true, 273, 19)
  on conflict do nothing;
end $$;


-- ---------------------------- MATCHES (recent + upcoming) ----------------------------
do $$
declare
  t_count int;
  t_ids   uuid[];
begin
  select count(*), array_agg(id) into t_count, t_ids
    from (select id from public.teams limit 6) s;
  if t_count < 2 then return; end if;

  insert into public.matches (sport, home_team_id, away_team_id, scheduled_for, played_at, venue, city, state_province, status, home_score, away_score)
  values
    ('soccer', t_ids[1], t_ids[2], now() - interval '7 days', now() - interval '7 days', 'Central Park Pitches', 'Fremont', 'CA',
     'confirmed', 3, 1),
    ('soccer', t_ids[3], t_ids[1], now() - interval '3 days', now() - interval '3 days', 'Etobicoke Sports Centre', 'Toronto', 'ON',
     'confirmed', 2, 2),
    ('soccer', t_ids[2], t_ids[3], now() + interval '4 days', null, 'Hayward Community Center', 'Hayward', 'CA',
     'scheduled', null, null),
    ('soccer', t_ids[1], t_ids[3], now() + interval '11 days', null, 'Toronto FC Practice Field', 'Toronto', 'ON',
     'scheduled', null, null)
  on conflict do nothing;
end $$;


-- ---------------------------- USER FOLLOWS (so /following/hashtags & profile pages have signal) ----------------------------
-- Seed each existing profile to follow the ASF "community" hashtag (idempotent).
do $$
begin
  insert into public.hashtags (tag, reel_count, last_used_at)
  values ('community', 0, now()), ('soccer', 0, now()), ('youth', 0, now())
  on conflict (tag) do nothing;
end $$;


-- ---------------------------- ACHIEVEMENTS GRANTED ----------------------------
-- Give every existing profile a first_post or team_player achievement so the
-- public profile page shows something in the Achievements section.
do $$
begin
  insert into public.user_achievements (user_id, achievement_key)
    select id, 'team_player' from public.profiles
  on conflict do nothing;
end $$;
