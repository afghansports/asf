-- 016: Mux integration columns + locale persistence + seed content
-- Run after 015. Idempotent.

-- ---------------------------- 1. MUX COLUMNS ----------------------------
alter table public.reels add column if not exists mux_upload_id    text;
alter table public.reels add column if not exists mux_asset_id     text;
alter table public.reels add column if not exists mux_playback_id  text;
alter table public.reels add column if not exists processing_state text default 'ready'
  check (processing_state in ('pending','processing','ready','errored'));

create index if not exists reels_mux_upload_idx on public.reels (mux_upload_id) where mux_upload_id is not null;
create index if not exists reels_mux_asset_idx  on public.reels (mux_asset_id)  where mux_asset_id  is not null;

-- ---------------------------- 2. LOCALE PREFERENCE ----------------------------
alter table public.profiles add column if not exists locale text default 'en'
  check (locale in ('en','fa-AF','ps'));

-- ---------------------------- 3. PUSH DELIVERY LOG ----------------------------
-- Track which notifications have already been sent over web push so retries
-- don't double-send.
create table if not exists public.push_deliveries (
  notification_id  uuid not null references public.notifications(id) on delete cascade,
  endpoint         text not null,
  delivered_at     timestamptz default now(),
  status           text default 'sent' check (status in ('sent','failed','expired')),
  primary key (notification_id, endpoint)
);

alter table public.push_deliveries enable row level security;
drop policy if exists "Push deliveries server-only" on public.push_deliveries;
create policy "Push deliveries server-only" on public.push_deliveries
  for all using (false);

-- ---------------------------- 4. SEED: SPONSORS ----------------------------
-- The sponsors table has no unique on name, so guard with a not-exists check.
do $$
begin
  if not exists (select 1 from public.sponsors where name = 'ASF Foundation') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('ASF Foundation', 'platinum', '/sponsors/asf-foundation.svg', 'https://asf.org', 10, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Diaspora Athletics') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Diaspora Athletics', 'gold', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=400&q=80', 'https://example.com/diaspora', 20, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Hindukush Sports') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Hindukush Sports', 'gold', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', 'https://example.com/hindukush', 30, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Kabul Media Group') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Kabul Media Group', 'silver', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=400&q=80', 'https://example.com/kabul-media', 40, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Pamir Travel') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Pamir Travel', 'silver', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80', 'https://example.com/pamir-travel', 50, true);
  end if;
  if not exists (select 1 from public.sponsors where name = 'Khorasan Tech') then
    insert into public.sponsors (name, tier, logo_url, website_url, sort_order, is_active)
    values ('Khorasan Tech', 'partner', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', 'https://example.com/khorasan-tech', 60, true);
  end if;
end $$;

-- ---------------------------- 5. SEED: NEWS POSTS ----------------------------
insert into public.news_posts (slug, title, excerpt, content, image_url, is_published, published_at)
values
  ('asf-platform-launch-2026',
   'ASF launches digital platform for Afghan athletes worldwide',
   'A new home for Afghan sports community — events, teams, reels, and tournaments in one place.',
   E'## A long time coming\n\nFor decades, the Afghan sports community has been spread across continents — players in California training for the same tournaments as cousins in Hamburg, coaches in Toronto running drills for kids whose parents grew up in the same district as someone in Sydney.\n\nThe Afghan Sports Federation has connected this community for over 25 years through tournaments, cup competitions, and youth programs. Today we are opening the next chapter: a digital platform that brings every part of that work online.\n\n## What you can do today\n\n- Find teams in your area or across the diaspora\n- Join tournaments with online registration and live brackets\n- Share reels — short videos from training, matches, celebrations\n- Follow events in your local chapter\n- Connect with players, coaches, and organizers across countries\n\n## What is coming\n\n- Live match streaming in partnership with chapter media teams\n- Multilingual support: Dari and Pashto coming to the interface\n- Free agent matchmaking for players looking for a club\n- Player stats and career history\n\n## How to get involved\n\nSign up at asf.org. If you run a team, tournament, or chapter, claim your page from the Teams or Chapters section after creating your account. We are aiming for 10,000 active members by the end of the year — every signup helps.',
   'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '2 days'),
  ('afghan-cup-2026-registration-open',
   'Afghan Cup 2026 registration now open across six continents',
   'Teams from 14 countries have already entered the eighth edition of the Afghan Cup. Group draws begin in May.',
   E'## Eighth edition, biggest field yet\n\nThe Afghan Cup returns in 2026 with a record 64 confirmed teams across mens, womens, and youth divisions. Registration opened this week and runs through April 30.\n\n## Format\n\n- Group stage: round-robin, four groups of four\n- Knockout: top two from each group advance\n- Finals: single venue tournament weekend in July\n\n## Eligibility\n\nOpen to any team registered with their local chapter or with documented Afghan heritage on the roster. Full roster rules are in the tournament page.\n\n## How to enter\n\nVisit /tournaments and click your division. Pay the entry fee online or contact your chapter coordinator for fee waivers — we never want money to be the reason a team cannot play.',
   'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '5 days'),
  ('youth-coaching-clinic-march',
   'Free youth coaching clinic — March 22, open to all chapter coaches',
   'A full-day clinic covering session planning, age-appropriate skill development, and safeguarding fundamentals.',
   E'## Why this clinic exists\n\nMost of our youth programs are run by parents and volunteers — people who love the sport but never trained as coaches. This clinic is for them.\n\n## What you will learn\n\n- Session planning for ages 6 to 12\n- How to teach a skill so kids actually retain it\n- Safeguarding basics — what to do, what to never do\n- How to handle parents on the sideline\n\n## Free for chapter coaches\n\nThe clinic is free if you are an active chapter coach. Spots are limited to 60. RSVP from the event page.',
   'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '8 days'),
  ('safeguarding-policy-update',
   'Safeguarding policy update — what is new for 2026',
   'Stronger consent for under-16, faster moderation, and a public transparency report.',
   E'## What changed\n\n- Parental consent flow now uses double-opt-in via email\n- Reports of harassment are reviewed within 24 hours, down from 72\n- We will publish a quarterly transparency report starting Q2\n\n## Why\n\nWe operate at scale now. The bar has to rise.\n\n## Read the policy\n\nThe full policy is on the Community Guidelines page. Questions go to safeguarding@asf.org.',
   'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '12 days'),
  ('chapter-spotlight-toronto',
   'Chapter spotlight: Toronto, the engine of the eastern circuit',
   'How the Toronto chapter went from 40 weekend warriors to 1,200 registered members in five years.',
   E'## From a parking lot to four pitches\n\nFive years ago, the Toronto chapter had one team and a borrowed parking lot in Etobicoke. Today: four pitches, 1,200 registered members, and a womens side that just qualified for the Canadian regional cup.\n\n## What worked\n\n- Show up consistently. Same time, same place, every Sunday for two years before they had a permanent venue.\n- Bring kids in early. The U-9 program now feeds the senior team.\n- Sponsor relationships built on results, not asks. Every sponsor gets a shoutout in the highlight reel for the season.\n\n## Want to start something similar?\n\nWe will help. Reach out from the Chapters page.',
   'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80',
   true, now() - interval '16 days')
on conflict (slug) do nothing;

-- ---------------------------- 6. SEED: EVENTS ----------------------------
insert into public.events (
  slug, title, event_type, sport, description, banner_url,
  start_datetime, end_datetime,
  country_code, state_province, city, venue_name, address,
  is_free, is_published, is_featured
) values
  ('asf-summer-cup-2026',
   'ASF Summer Cup 2026',
   'tournament',
   'soccer',
   E'The flagship summer event. Eight teams compete over a single weekend at the chapter''s home grounds.\n\nMen''s and women''s divisions. Youth showcase Saturday morning.',
   'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80',
   now() + interval '60 days', now() + interval '62 days',
   'US', 'CA', 'Fremont', 'Central Park Pitches', '40000 Paseo Padre Pkwy, Fremont, CA',
   false, true, true),
  ('toronto-pickup-saturday',
   'Toronto pickup — every Saturday',
   'community',
   'soccer',
   'Open pickup. All skill levels welcome. Bring water and shin guards.',
   'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
   now() + interval '3 days', now() + interval '3 days' + interval '3 hours',
   'CA', 'ON', 'Toronto', 'Etobicoke Sports Centre', '110 Kipling Ave, Toronto, ON',
   true, true, false),
  ('virginia-volleyball-clinic',
   'Virginia volleyball clinic — youth + adult',
   'camp',
   'volleyball',
   'Two-day clinic with chapter coaches. Beginners welcome in the morning, advanced session in the afternoon.',
   'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80',
   now() + interval '14 days', now() + interval '15 days',
   'US', 'VA', 'Fairfax', 'Fairfax Athletic Center', '4500 Stringfellow Rd, Chantilly, VA',
   false, true, false),
  ('hamburg-cricket-friendly',
   'Hamburg cricket friendly vs. Berlin Afghan XI',
   'match',
   'cricket',
   'Annual friendly match. Spectators welcome. Refreshments available on site.',
   'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80',
   now() + interval '21 days', now() + interval '21 days' + interval '8 hours',
   'DE', null, 'Hamburg', 'Stadtpark Cricket Ground', 'Otto-Wels-Straße, 22303 Hamburg',
   true, true, false),
  ('sydney-futsal-league-opener',
   'Sydney futsal league — season opener',
   'tournament',
   'futsal',
   'Six-team round-robin opening night for the 2026 Sydney futsal season.',
   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80',
   now() + interval '7 days', now() + interval '7 days' + interval '5 hours',
   'AU', 'NSW', 'Sydney', 'Auburn Indoor Sports Centre', '5 Park Rd, Auburn NSW',
   false, true, false),
  ('community-iftar-2026',
   'Community iftar + 5-a-side — Ramadan 2026',
   'community',
   null,
   'A community iftar followed by friendly 5-a-side matches for all ages. Hosted by the Bay Area chapter.',
   'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80',
   now() + interval '40 days', now() + interval '40 days' + interval '4 hours',
   'US', 'CA', 'Hayward', 'Hayward Community Center', '777 W Tennyson Rd, Hayward, CA',
   true, true, true),
  ('frankfurt-coaching-clinic-spring',
   'Frankfurt coaching clinic — spring session',
   'camp',
   'soccer',
   'Coaching basics and session planning for new chapter coaches in central Europe.',
   'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1600&q=80',
   now() + interval '28 days', now() + interval '28 days' + interval '6 hours',
   'DE', null, 'Frankfurt', 'Sportverein Bockenheim', 'Marburger Str 1, 60487 Frankfurt',
   true, true, false),
  ('london-women-tournament',
   'London women''s tournament 2026',
   'tournament',
   'soccer',
   'Six-team tournament celebrating Afghan women in football. All matches streamed via the chapter feed.',
   'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=1600&q=80',
   now() + interval '50 days', now() + interval '51 days',
   'GB', null, 'London', 'Powerleague Shoreditch', '1 Curtain Rd, London EC2A 3JX',
   false, true, true)
on conflict (slug) do nothing;

-- ---------------------------- 7. SEED: GALLERY (extra images for variety) ----------------------------
insert into public.gallery_images (image_url, caption, event_name, year, sort_order, is_published)
values
  ('https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80', 'Summer Cup 2025 final', 'Summer Cup 2025', 2025, 100, true),
  ('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80', 'Toronto chapter exhibition', 'Toronto Exhibition 2025', 2025, 110, true),
  ('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80', 'Youth coaching clinic', 'Youth Clinic 2024', 2024, 120, true),
  ('https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80', 'Bay Area iftar event', 'Community Iftar 2025', 2025, 130, true),
  ('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80', 'Virginia volleyball clinic', 'Virginia Volleyball 2024', 2024, 140, true),
  ('https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80', 'Hamburg cricket squad', 'Hamburg Cricket 2024', 2024, 150, true)
on conflict do nothing;

-- ---------------------------- 8. RECONCILE PROCESSING_STATE ----------------------------
update public.reels set processing_state = 'ready'
  where processing_state is null and is_published = true;
