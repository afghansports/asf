-- =============================================================================
-- ASF Platform - Migration 015: Hashtag follows + push subscriptions
-- =============================================================================
-- Adds:
--   1. hashtag_follows  — users follow specific hashtags; new reels notify them
--   2. push_subscriptions — Web Push endpoints for browser notifications
--   3. notify trigger on new reels: alert hashtag-followers
-- All RLS-locked. Idempotent.
-- =============================================================================

-- ---------------------------- 1. HASHTAG FOLLOWS ----------------------------
create table if not exists public.hashtag_follows (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tag         text not null references public.hashtags(tag) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, tag)
);

create index if not exists hashtag_follows_user_idx on public.hashtag_follows (user_id);
create index if not exists hashtag_follows_tag_idx  on public.hashtag_follows (tag);

alter table public.hashtag_follows enable row level security;
drop policy if exists "Hashtag follows readable by self" on public.hashtag_follows;
create policy "Hashtag follows readable by self" on public.hashtag_follows
  for select using (auth.uid() = user_id);
drop policy if exists "Hashtag follows manageable by self" on public.hashtag_follows;
create policy "Hashtag follows manageable by self" on public.hashtag_follows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- When a reel is hashtagged via parse_reel_hashtags, also notify followers of
-- that tag. We hook this onto reel_hashtags inserts.
create or replace function public.notify_hashtag_followers()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  follower record;
  reel_author uuid;
begin
  select author_id into reel_author from public.reels where id = new.reel_id;
  if reel_author is null then return new; end if;

  for follower in
    select user_id from public.hashtag_follows where tag = new.tag and user_id <> reel_author
  loop
    -- Honor blocks both directions.
    if public.is_blocked(reel_author, follower.user_id) then continue; end if;
    insert into public.notifications (user_id, type, actor_id, target_type, target_id, body, link)
      values (
        follower.user_id,
        'announcement',
        reel_author,
        'reel',
        new.reel_id,
        'New reel in #' || new.tag,
        '/reels/' || new.reel_id::text
      );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_hashtag_followers on public.reel_hashtags;
create trigger trg_notify_hashtag_followers
  after insert on public.reel_hashtags
  for each row execute function public.notify_hashtag_followers();


-- ---------------------------- 2. PUSH SUBSCRIPTIONS ----------------------------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now(),
  last_used_at timestamptz default now()
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "Push subs readable by self" on public.push_subscriptions;
create policy "Push subs readable by self" on public.push_subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "Push subs manageable by self" on public.push_subscriptions;
create policy "Push subs manageable by self" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Verify
-- select count(*) from public.hashtag_follows;
-- select count(*) from public.push_subscriptions;
