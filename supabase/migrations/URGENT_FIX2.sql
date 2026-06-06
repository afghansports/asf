-- =============================================================================
-- URGENT FIX 2 — fixes the reel-comment mention trigger (same substring bug
-- as before, was overlooked). Tiny, idempotent.
-- =============================================================================

create or replace function public.parse_reel_comment_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m text;
  uid uuid;
  ts text[];
  policy text;
  follows_me boolean;
  reel_author uuid;
begin
  if new.body is null or new.body = '' then return new; end if;

  select r.author_id into reel_author
    from public.reel_comments rc
    join public.reels r on r.id = rc.reel_id
    where rc.id = new.id;

  ts := array(
    select distinct lower(tag[1])
      from regexp_matches(new.body, '@([A-Za-z0-9_]{3,30})', 'g') as r(tag)
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
      select exists (
        select 1 from public.follows
         where follower_id = uid
           and subject_type = 'user'
           and subject_id = new.author_id
      ) into follows_me;
      if not follows_me then continue; end if;
    end if;

    insert into public.reel_comment_mentions (comment_id, mentioned_user_id)
      values (new.id, uid)
      on conflict do nothing;

    insert into public.notifications (user_id, type, actor_id, target_type, target_id, body, link)
      values (
        uid, 'mention', new.author_id, 'reel_comment', new.id,
        'You were mentioned in a comment.',
        '/reels/' || (select reel_id from public.reel_comments where id = new.id)::text
      );
  end loop;
  return new;
end $$;
