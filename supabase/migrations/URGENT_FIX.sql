-- =============================================================================
-- URGENT FIX — paste this whole file into Supabase SQL editor and run.
-- Fixes the broken reels trigger + adds the minimum tables we need so the
-- demo seed can populate reels, discussions, and the activity wall.
--
-- Smaller and faster than COMBINED_015_to_023.sql — only the essentials.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix `parse_reel_hashtags` — the existing function uses `substring(t from 2)`
-- where `t` is the table alias of `regexp_matches`, which is a row (record), not
-- text. That throws `function pg_catalog.substring(text[], integer) does not
-- exist` on every reel insert. Replace with a column alias + array index.
-- ---------------------------------------------------------------------------
create or replace function public.parse_reel_hashtags()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m text;
  ts text[];
begin
  if new.caption is null then return new; end if;

  -- Pull out unique lowercased hashtag bodies. Alias the function as r(tag)
  -- so we can extract the first capture group with tag[1].
  ts := array(
    select distinct lower(tag[1])
      from regexp_matches(new.caption, '#([A-Za-z0-9_]{1,50})', 'g') as r(tag)
  );

  foreach m in array ts loop
    insert into public.hashtags (tag, reel_count, last_used_at)
      values (m, 1, now())
    on conflict (tag) do update
      set reel_count   = public.hashtags.reel_count + 1,
          last_used_at = now();

    insert into public.reel_hashtags (reel_id, tag)
      values (new.id, m)
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Same bug almost certainly exists in `parse_reel_mentions` from migration
-- 014. Fix it the same way.
-- ---------------------------------------------------------------------------
create or replace function public.parse_reel_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text;
  unames text[];
  uid uuid;
begin
  if new.caption is null then return new; end if;

  unames := array(
    select distinct lower(u[1])
      from regexp_matches(new.caption, '@([A-Za-z0-9_]{3,30})', 'g') as r(u)
  );

  foreach uname in array unames loop
    select id into uid from public.profiles where username = uname;
    if uid is not null then
      insert into public.reel_mentions (reel_id, mentioned_user_id, mentioned_by)
        values (new.id, uid, new.author_id)
      on conflict do nothing;
    end if;
  end loop;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Add reels columns for YouTube + processing state (migration 022 portion).
-- ---------------------------------------------------------------------------
alter table public.reels add column if not exists video_kind text default 'file'
  check (video_kind in ('file','youtube','mux'));
alter table public.reels add column if not exists youtube_id text;
alter table public.reels add column if not exists mux_upload_id text;
alter table public.reels add column if not exists mux_asset_id text;
alter table public.reels add column if not exists mux_playback_id text;
alter table public.reels add column if not exists processing_state text default 'ready'
  check (processing_state in ('pending','processing','ready','errored'));

-- ---------------------------------------------------------------------------
-- 4. Discussions + replies tables (migration 023 portion).
-- ---------------------------------------------------------------------------
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
alter table public.discussions enable row level security;
drop policy if exists "Discussions readable by all" on public.discussions;
create policy "Discussions readable by all" on public.discussions for select using (true);
drop policy if exists "Discussions created by signed-in user" on public.discussions;
create policy "Discussions created by signed-in user" on public.discussions
  for insert with check (auth.uid() = author_id);

create table if not exists public.discussion_replies (
  id              uuid primary key default gen_random_uuid(),
  discussion_id   uuid not null references public.discussions(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  parent_reply_id uuid references public.discussion_replies(id) on delete cascade,
  created_at      timestamptz default now()
);
create index if not exists discussion_replies_thread_idx on public.discussion_replies (discussion_id, created_at);
alter table public.discussion_replies enable row level security;
drop policy if exists "Replies readable by all" on public.discussion_replies;
create policy "Replies readable by all" on public.discussion_replies for select using (true);
drop policy if exists "Replies created by signed-in user" on public.discussion_replies;
create policy "Replies created by signed-in user" on public.discussion_replies
  for insert with check (auth.uid() = author_id);

-- Maintain reply count + last reply
create or replace function public.bump_discussion_on_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.discussions set
      reply_count   = coalesce(reply_count, 0) + 1,
      last_reply_at = new.created_at,
      last_reply_by = new.author_id
    where id = new.discussion_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_bump_discussion_on_reply on public.discussion_replies;
create trigger trg_bump_discussion_on_reply
  after insert on public.discussion_replies
  for each row execute function public.bump_discussion_on_reply();

-- ---------------------------------------------------------------------------
-- 5. Activity wall (migration 023 portion).
-- ---------------------------------------------------------------------------
create table if not exists public.wall_posts (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id) on delete set null,
  kind          text not null,
  target_type   text,
  target_id     uuid,
  title         text not null,
  body          text,
  image_url     text,
  link          text not null,
  created_at    timestamptz default now()
);
create index if not exists wall_posts_created_idx on public.wall_posts (created_at desc);
alter table public.wall_posts enable row level security;
drop policy if exists "Wall readable by all" on public.wall_posts;
create policy "Wall readable by all" on public.wall_posts for select using (true);
