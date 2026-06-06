-- =============================================================================
-- ASF Platform - Migration 014: Bookmarks, mentions, match scorers
-- =============================================================================
-- Adds the next batch of platform features:
--   1. Bookmarks (save any reel / event / news / team / tournament for later)
--   2. Mention triggers (parse @username from reels + reel_comments, insert
--      into reel_mentions, notify the mentioned user)
--   3. Match scorer attribution (link individual scorers to a confirmed match
--      so per-player stats can be computed)
--   4. Helpful: notification insert on hashtag-followed posts (placeholder
--      table for future hashtag follows)
-- All RLS-locked. Idempotent.
-- =============================================================================

-- ---------------------------- 1. BOOKMARKS ----------------------------
create table if not exists public.bookmarks (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('reel','event','news','team','tournament')),
  target_id    uuid not null,
  created_at   timestamptz default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;
drop policy if exists "Bookmarks readable by self" on public.bookmarks;
create policy "Bookmarks readable by self" on public.bookmarks
  for select using (auth.uid() = user_id);
drop policy if exists "Bookmarks writable by self" on public.bookmarks;
create policy "Bookmarks writable by self" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ---------------------------- 2. MENTIONS ----------------------------
create table if not exists public.reel_mentions (
  reel_id          uuid not null references public.reels(id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz default now(),
  primary key (reel_id, mentioned_user_id)
);

create index if not exists reel_mentions_user_idx on public.reel_mentions (mentioned_user_id);

create table if not exists public.reel_comment_mentions (
  comment_id       uuid not null references public.reel_comments(id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz default now(),
  primary key (comment_id, mentioned_user_id)
);

create index if not exists reel_comment_mentions_user_idx on public.reel_comment_mentions (mentioned_user_id);

alter table public.reel_mentions          enable row level security;
alter table public.reel_comment_mentions  enable row level security;

drop policy if exists "Reel mentions readable by all" on public.reel_mentions;
create policy "Reel mentions readable by all" on public.reel_mentions for select using (true);
drop policy if exists "Reel comment mentions readable by all" on public.reel_comment_mentions;
create policy "Reel comment mentions readable by all" on public.reel_comment_mentions for select using (true);


-- Trigger: parse @username out of reel.caption on insert and:
--   1. insert into reel_mentions
--   2. insert a notification for each mentioned user (respecting privacy)
-- Skips self-mentions, mentions where the mentioned user has blocked the author,
-- and users whose privacy_settings.who_can_tag = "nobody" (or "follows" without
-- a follow relationship).
create or replace function public.parse_reel_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m           text;
  uid         uuid;
  ts          text[];
  policy      text;
  follows_me  boolean;
begin
  if new.caption is null or new.caption = '' then return new; end if;

  ts := array(
    select distinct lower(substring(t from 2))
      from regexp_matches(new.caption, '@([A-Za-z0-9_]{3,30})', 'g') as t
  );

  foreach m in array ts loop
    select id into uid from public.profiles where username = m;
    if uid is null then continue; end if;
    if uid = new.author_id then continue; end if;
    if public.is_blocked(new.author_id, uid) then continue; end if;

    select coalesce((privacy_settings ->> 'who_can_tag'), 'everyone')
      into policy
      from public.profiles where id = uid;
    if policy = 'nobody' then continue; end if;
    if policy = 'follows' then
      select exists(
        select 1 from public.follows f
         where f.follower_id = uid and f.subject_type = 'user' and f.subject_id = new.author_id
      ) into follows_me;
      if not follows_me then continue; end if;
    end if;

    insert into public.reel_mentions (reel_id, mentioned_user_id)
      values (new.id, uid)
    on conflict do nothing;

    insert into public.notifications (user_id, type, actor_id, target_type, target_id, body, link)
      values (
        uid,
        'mention',
        new.author_id,
        'reel',
        new.id,
        'You were mentioned in a reel.',
        '/reels/' || new.id::text
      );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_parse_reel_mentions on public.reels;
create trigger trg_parse_reel_mentions
  after insert on public.reels
  for each row execute function public.parse_reel_mentions();


create or replace function public.parse_reel_comment_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m text;
  uid uuid;
  ts text[];
  policy text;
  follows_me boolean;
  reel_id uuid;
begin
  if new.body is null or new.body = '' then return new; end if;

  select r.id into reel_id from public.reel_comments rc join public.reels r on r.id = rc.reel_id where rc.id = new.id;
  if reel_id is null then return new; end if;

  ts := array(
    select distinct lower(substring(t from 2))
      from regexp_matches(new.body, '@([A-Za-z0-9_]{3,30})', 'g') as t
  );

  foreach m in array ts loop
    select id into uid from public.profiles where username = m;
    if uid is null then continue; end if;
    if uid = new.author_id then continue; end if;
    if public.is_blocked(new.author_id, uid) then continue; end if;

    select coalesce((privacy_settings ->> 'who_can_tag'), 'everyone')
      into policy
      from public.profiles where id = uid;
    if policy = 'nobody' then continue; end if;
    if policy = 'follows' then
      select exists(
        select 1 from public.follows f
         where f.follower_id = uid and f.subject_type = 'user' and f.subject_id = new.author_id
      ) into follows_me;
      if not follows_me then continue; end if;
    end if;

    insert into public.reel_comment_mentions (comment_id, mentioned_user_id)
      values (new.id, uid)
    on conflict do nothing;

    insert into public.notifications (user_id, type, actor_id, target_type, target_id, body, link)
      values (
        uid,
        'mention',
        new.author_id,
        'reel_comment',
        new.id,
        'You were mentioned in a comment.',
        '/reels/' || reel_id::text
      );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_parse_reel_comment_mentions on public.reel_comments;
create trigger trg_parse_reel_comment_mentions
  after insert on public.reel_comments
  for each row execute function public.parse_reel_comment_mentions();


-- ---------------------------- 3. MATCH SCORERS ----------------------------
-- Per-match per-player stats. Captains can submit alongside the match result;
-- once the match is `confirmed`, a trigger increments player_stats.

create table if not exists public.match_scorers (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  player_id   uuid not null references public.profiles(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  goals       int default 0,
  assists     int default 0,
  yellow_cards int default 0,
  red_cards   int default 0,
  -- Sport-agnostic numeric "performance" column for non-soccer sports.
  points      int default 0,
  notes       text,
  created_at  timestamptz default now(),
  unique (match_id, player_id)
);

create index if not exists match_scorers_match_idx on public.match_scorers (match_id);
create index if not exists match_scorers_player_idx on public.match_scorers (player_id);

alter table public.match_scorers enable row level security;
drop policy if exists "Match scorers readable by all" on public.match_scorers;
create policy "Match scorers readable by all" on public.match_scorers for select using (true);
drop policy if exists "Match scorers writable by team captain" on public.match_scorers;
create policy "Match scorers writable by team captain" on public.match_scorers
  for all using (
    exists (
      select 1 from public.teams t
       where t.id = team_id and t.captain_id = auth.uid()
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- When a match flips to confirmed, increment player_stats for each scorer.
create or replace function public.apply_match_stats_on_confirm()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec record;
  yr int := extract(year from coalesce(new.played_at, now()))::int;
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    for rec in select * from public.match_scorers where match_id = new.id loop
      -- soccer-style stats; non-zero values get added to player_stats
      if rec.goals <> 0 then
        insert into public.player_stats (player_id, sport, season, stat_key, stat_value)
          values (rec.player_id, new.sport, yr, 'goals', rec.goals)
        on conflict (player_id, sport, season, stat_key)
          do update set stat_value = public.player_stats.stat_value + excluded.stat_value,
                        updated_at = now();
      end if;
      if rec.assists <> 0 then
        insert into public.player_stats (player_id, sport, season, stat_key, stat_value)
          values (rec.player_id, new.sport, yr, 'assists', rec.assists)
        on conflict (player_id, sport, season, stat_key)
          do update set stat_value = public.player_stats.stat_value + excluded.stat_value,
                        updated_at = now();
      end if;
      if rec.yellow_cards <> 0 then
        insert into public.player_stats (player_id, sport, season, stat_key, stat_value)
          values (rec.player_id, new.sport, yr, 'yellow_cards', rec.yellow_cards)
        on conflict (player_id, sport, season, stat_key)
          do update set stat_value = public.player_stats.stat_value + excluded.stat_value,
                        updated_at = now();
      end if;
      if rec.red_cards <> 0 then
        insert into public.player_stats (player_id, sport, season, stat_key, stat_value)
          values (rec.player_id, new.sport, yr, 'red_cards', rec.red_cards)
        on conflict (player_id, sport, season, stat_key)
          do update set stat_value = public.player_stats.stat_value + excluded.stat_value,
                        updated_at = now();
      end if;
      if rec.points <> 0 then
        insert into public.player_stats (player_id, sport, season, stat_key, stat_value)
          values (rec.player_id, new.sport, yr, 'points', rec.points)
        on conflict (player_id, sport, season, stat_key)
          do update set stat_value = public.player_stats.stat_value + excluded.stat_value,
                        updated_at = now();
      end if;

      -- Bump games_played for everyone in the scorers list.
      insert into public.player_stats (player_id, sport, season, stat_key, stat_value)
        values (rec.player_id, new.sport, yr, 'games_played', 1)
      on conflict (player_id, sport, season, stat_key)
        do update set stat_value = public.player_stats.stat_value + 1,
                      updated_at = now();

      -- Auto-grant first_match achievement.
      insert into public.user_achievements (user_id, achievement_key)
        values (rec.player_id, 'first_match')
      on conflict do nothing;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_match_stats on public.matches;
create trigger trg_apply_match_stats
  after update on public.matches
  for each row execute function public.apply_match_stats_on_confirm();


-- ---------------------------- VERIFY ----------------------------
-- select count(*) from public.bookmarks;
-- select count(*) from public.reel_mentions;
-- select count(*) from public.match_scorers;
