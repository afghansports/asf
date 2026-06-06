-- 023: Activity wall + discussion board.
-- The wall is a unified feed of everything that happens on the platform —
-- new reels, news, events, discussions, replies, matches, achievements.
-- Each row knows where to link back to. Triggers populate it automatically
-- so seed data + ongoing activity both end up on the wall.
-- Idempotent. Run after 022.

-- =============================================================================
-- 1. WALL POSTS — unified activity feed
-- =============================================================================
create table if not exists public.wall_posts (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id) on delete set null,
  kind          text not null
    check (kind in (
      'reel','event','news','match','poll','tournament',
      'discussion','discussion_reply','team_created','club_created',
      'achievement','user_joined','match_result'
    )),
  target_type   text,
  target_id     uuid,
  title         text not null,
  body          text,
  image_url     text,
  link          text not null,
  created_at    timestamptz default now()
);

create index if not exists wall_posts_created_idx on public.wall_posts (created_at desc);
create index if not exists wall_posts_actor_idx   on public.wall_posts (actor_id, created_at desc);
create index if not exists wall_posts_kind_idx    on public.wall_posts (kind, created_at desc);

alter table public.wall_posts enable row level security;
drop policy if exists "Wall readable by all" on public.wall_posts;
create policy "Wall readable by all" on public.wall_posts for select using (true);
drop policy if exists "Wall written by service only" on public.wall_posts;
create policy "Wall written by service only" on public.wall_posts
  for insert with check (auth.role() = 'service_role' or actor_id = auth.uid());
drop policy if exists "Wall delete by author or admin" on public.wall_posts;
create policy "Wall delete by author or admin" on public.wall_posts
  for delete using (
    actor_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- =============================================================================
-- 2. DISCUSSION BOARD — threads + replies
-- =============================================================================
create table if not exists public.discussions (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  body            text,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  category        text default 'general'
    check (category in ('general','announcements','rules','tactics','recruitment','events','off_topic')),
  sport           text,
  is_pinned       boolean default false,
  is_locked       boolean default false,
  view_count      int default 0,
  reply_count     int default 0,
  last_reply_at   timestamptz default now(),
  last_reply_by   uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists discussions_recent_idx on public.discussions (last_reply_at desc);
create index if not exists discussions_category_idx on public.discussions (category, last_reply_at desc);
create index if not exists discussions_author_idx on public.discussions (author_id);
create index if not exists discussions_pinned_idx on public.discussions (is_pinned desc, last_reply_at desc);

alter table public.discussions enable row level security;
drop policy if exists "Discussions readable by all" on public.discussions;
create policy "Discussions readable by all" on public.discussions for select using (true);
drop policy if exists "Discussions created by any signed-in user" on public.discussions;
create policy "Discussions created by any signed-in user" on public.discussions
  for insert with check (auth.uid() = author_id);
drop policy if exists "Discussions editable by author or admin" on public.discussions;
create policy "Discussions editable by author or admin" on public.discussions
  for update using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


create table if not exists public.discussion_replies (
  id              uuid primary key default gen_random_uuid(),
  discussion_id   uuid not null references public.discussions(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  parent_reply_id uuid references public.discussion_replies(id) on delete cascade,
  created_at      timestamptz default now()
);

create index if not exists discussion_replies_thread_idx on public.discussion_replies (discussion_id, created_at);
create index if not exists discussion_replies_author_idx on public.discussion_replies (author_id);

alter table public.discussion_replies enable row level security;
drop policy if exists "Replies readable by all" on public.discussion_replies;
create policy "Replies readable by all" on public.discussion_replies for select using (true);
drop policy if exists "Replies created by signed-in user" on public.discussion_replies;
create policy "Replies created by signed-in user" on public.discussion_replies
  for insert with check (auth.uid() = author_id);
drop policy if exists "Replies editable by author or admin" on public.discussion_replies;
create policy "Replies editable by author or admin" on public.discussion_replies
  for update using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Maintain discussions.reply_count + last_reply_*
create or replace function public.bump_discussion_on_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.discussions set
      reply_count   = coalesce(reply_count, 0) + 1,
      last_reply_at = new.created_at,
      last_reply_by = new.author_id
    where id = new.discussion_id;
  elsif tg_op = 'DELETE' then
    update public.discussions set
      reply_count = greatest(coalesce(reply_count, 0) - 1, 0)
    where id = old.discussion_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_bump_discussion_on_reply_ins on public.discussion_replies;
create trigger trg_bump_discussion_on_reply_ins
  after insert on public.discussion_replies
  for each row execute function public.bump_discussion_on_reply();
drop trigger if exists trg_bump_discussion_on_reply_del on public.discussion_replies;
create trigger trg_bump_discussion_on_reply_del
  after delete on public.discussion_replies
  for each row execute function public.bump_discussion_on_reply();


-- =============================================================================
-- 3. WALL TRIGGERS — auto-write wall_posts on content insert
-- =============================================================================

-- New reel
create or replace function public.wall_on_reel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.author_id, 'reel', 'reel', new.id,
      coalesce(nullif(new.caption, ''), 'New reel'),
      new.caption,
      new.thumbnail_url,
      '/reels/' || new.id::text
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_wall_on_reel on public.reels;
create trigger trg_wall_on_reel
  after insert on public.reels
  for each row execute function public.wall_on_reel();

-- New event (only when published)
create or replace function public.wall_on_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.organizer_id, 'event', 'event', new.id,
      new.title,
      coalesce(left(new.description, 240), null),
      new.banner_url,
      '/events/' || new.id::text
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_event on public.events;
create trigger trg_wall_on_event
  after insert on public.events
  for each row execute function public.wall_on_event();

-- New news post (only when published)
create or replace function public.wall_on_news()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.author_id, 'news', 'news_post', new.id,
      new.title,
      new.excerpt,
      new.image_url,
      '/news/' || new.slug
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_news on public.news_posts;
create trigger trg_wall_on_news
  after insert on public.news_posts
  for each row execute function public.wall_on_news();

-- New poll
create or replace function public.wall_on_poll()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
    values (
      new.author_id, 'poll', 'poll', new.id,
      new.question,
      'New community poll — cast your vote.',
      '/polls/' || new.id::text
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_poll on public.polls;
create trigger trg_wall_on_poll
  after insert on public.polls
  for each row execute function public.wall_on_poll();

-- New tournament
create or replace function public.wall_on_tournament()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      null, 'tournament', 'tournament', new.id,
      new.name,
      coalesce(left(new.description, 240), null),
      new.banner_url,
      '/tournaments/' || new.slug
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_tournament on public.tournaments;
create trigger trg_wall_on_tournament
  after insert on public.tournaments
  for each row execute function public.wall_on_tournament();

-- Match result (only when confirmed)
create or replace function public.wall_on_match_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  home_name text;
  away_name text;
  score_line text;
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    select name into home_name from public.teams where id = new.home_team_id;
    select name into away_name from public.teams where id = new.away_team_id;
    score_line := coalesce(home_name, 'Home') || ' ' || coalesce(new.home_score::text, '?') ||
                  ' – ' || coalesce(new.away_score::text, '?') || ' ' || coalesce(away_name, 'Away');
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
    values (
      coalesce(new.confirmed_by, new.reported_by), 'match_result', 'match', new.id,
      'Result: ' || score_line,
      coalesce('Played ' || to_char(new.played_at, 'Mon DD, YYYY'), null) ||
        case when new.venue is not null then ' · ' || new.venue else '' end,
      '/matches/' || new.id::text
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_match_confirmed on public.matches;
create trigger trg_wall_on_match_confirmed
  after update on public.matches
  for each row execute function public.wall_on_match_confirmed();

-- Match created (scheduled)
create or replace function public.wall_on_match_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  home_name text;
  away_name text;
begin
  select name into home_name from public.teams where id = new.home_team_id;
  select name into away_name from public.teams where id = new.away_team_id;
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
  values (
    null, 'match', 'match', new.id,
    'Upcoming: ' || coalesce(home_name, 'Home') || ' vs ' || coalesce(away_name, 'Away'),
    coalesce(to_char(new.scheduled_for, 'Mon DD, YYYY HH24:MI'), null) ||
      case when new.venue is not null then ' · ' || new.venue else '' end,
    '/matches/' || new.id::text
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_match_created on public.matches;
create trigger trg_wall_on_match_created
  after insert on public.matches
  for each row execute function public.wall_on_match_created();

-- Discussion + reply
create or replace function public.wall_on_discussion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
  values (
    new.author_id, 'discussion', 'discussion', new.id,
    new.title,
    coalesce(left(new.body, 240), null),
    '/discussions/' || new.slug
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_discussion on public.discussions;
create trigger trg_wall_on_discussion
  after insert on public.discussions
  for each row execute function public.wall_on_discussion();

create or replace function public.wall_on_discussion_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  thread record;
begin
  select id, title, slug into thread from public.discussions where id = new.discussion_id;
  if thread.id is null then return new; end if;
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, link)
  values (
    new.author_id, 'discussion_reply', 'discussion', new.discussion_id,
    'Replied to: ' || thread.title,
    left(new.body, 240),
    '/discussions/' || thread.slug
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_discussion_reply on public.discussion_replies;
create trigger trg_wall_on_discussion_reply
  after insert on public.discussion_replies
  for each row execute function public.wall_on_discussion_reply();

-- New team
create or replace function public.wall_on_team()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap_name text;
begin
  select coalesce(full_name, username) into cap_name from public.profiles where id = new.captain_id;
  insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
  values (
    new.captain_id, 'team_created', 'team', new.id,
    'New team: ' || new.name,
    'Created by ' || coalesce(cap_name, 'a member') ||
      case when new.city is not null then ' · ' || new.city else '' end,
    new.logo_url,
    '/teams/' || new.slug
  );
  return new;
end $$;
drop trigger if exists trg_wall_on_team on public.teams;
create trigger trg_wall_on_team
  after insert on public.teams
  for each row execute function public.wall_on_team();

-- New user (welcome to the platform)
create or replace function public.wall_on_user_joined()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.username is not null then
    insert into public.wall_posts (actor_id, kind, target_type, target_id, title, body, image_url, link)
    values (
      new.id, 'user_joined', 'profile', new.id,
      coalesce(new.full_name, new.username) || ' joined ASF',
      case when new.city is not null then 'From ' || new.city else null end,
      new.avatar_url,
      '/profile/' || new.username
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_wall_on_user_joined on public.profiles;
create trigger trg_wall_on_user_joined
  after insert on public.profiles
  for each row execute function public.wall_on_user_joined();


-- =============================================================================
-- 4. NEW MODULE FLAGS
-- =============================================================================
insert into public.feature_flags (key, label, description, category, is_enabled, default_value) values
  ('module.wall',        'Activity wall',  'Unified feed of every public action on the platform.', 'social', true, true),
  ('module.discussions', 'Discussions',    'Threaded community discussion board.',                  'social', true, true)
on conflict (key) do nothing;
