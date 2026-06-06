-- =============================================================================
-- ASF Platform - Migration 012: Safety, GDPR, soft deletes, DM schema, privacy
-- =============================================================================
-- Implements the seven "before launch" gaps identified for 1M-user scale:
--   1. Blocking system (user_blocks + RLS hooks)
--   2. Account deletion / GDPR (deletion_requests + profile soft-delete)
--   3. Reports v2 (categories, dedup count, reporter privacy, false-report tracking)
--   4. Youth safeguarding (DOB, parental consent, team safeguarding contacts)
--   5. Soft deletes (deleted_at on user-generated content + 90-day purge helpers)
--   6. Messaging foundation schema (DM conversations + message requests)
--   7. Privacy settings (deeper toggles via JSON column)
-- All RLS-locked. Idempotent. Safe to re-run.
-- =============================================================================

-- ---------------------------- 1. BLOCKING ----------------------------
create table if not exists public.user_blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  reason      text,
  created_at  timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx on public.user_blocks (blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;
drop policy if exists "user_blocks readable by participants" on public.user_blocks;
create policy "user_blocks readable by participants" on public.user_blocks
  for select using (auth.uid() = blocker_id);
drop policy if exists "user_blocks manageable by blocker" on public.user_blocks;
create policy "user_blocks manageable by blocker" on public.user_blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Helper: is one user blocked by another?
create or replace function public.is_blocked(p_viewer uuid, p_target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_blocks
     where (blocker_id = p_viewer and blocked_id = p_target)
        or (blocker_id = p_target and blocked_id = p_viewer)
  );
$$;


-- ---------------------------- 2. SOFT DELETES ----------------------------
-- Add deleted_at to user-generated content. Public RLS filters it out;
-- admin moderation queue still sees it; cron purges after 90 days.

alter table public.news_posts      add column if not exists deleted_at timestamptz;
alter table public.reels           add column if not exists deleted_at timestamptz;
alter table public.reel_comments   add column if not exists deleted_at timestamptz;
alter table public.events          add column if not exists deleted_at timestamptz;
alter table public.gallery_images  add column if not exists deleted_at timestamptz;

create index if not exists reels_deleted_at_idx          on public.reels (deleted_at);
create index if not exists reel_comments_deleted_at_idx  on public.reel_comments (deleted_at);
create index if not exists events_deleted_at_idx         on public.events (deleted_at);

-- Tighten reels read policy to hide soft-deleted from public.
drop policy if exists "Published reels readable by all" on public.reels;
create policy "Published reels readable by all" on public.reels
  for select using (
    (is_published = true and deleted_at is null)
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "reel_comments readable by all" on public.reel_comments;
create policy "reel_comments readable by all" on public.reel_comments
  for select using (
    deleted_at is null
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Purge helper: hard-delete content soft-deleted more than 90 days ago.
create or replace function public.purge_soft_deleted()
returns table(table_name text, purged int) language plpgsql security definer set search_path = public as $$
declare
  cutoff timestamptz := now() - interval '90 days';
  n int;
begin
  delete from public.reels where deleted_at < cutoff;             get diagnostics n = row_count; table_name := 'reels';            purged := n; return next;
  delete from public.reel_comments where deleted_at < cutoff;     get diagnostics n = row_count; table_name := 'reel_comments';    purged := n; return next;
  delete from public.news_posts where deleted_at < cutoff;        get diagnostics n = row_count; table_name := 'news_posts';       purged := n; return next;
  delete from public.events where deleted_at < cutoff;            get diagnostics n = row_count; table_name := 'events';           purged := n; return next;
  delete from public.gallery_images where deleted_at < cutoff;    get diagnostics n = row_count; table_name := 'gallery_images';   purged := n; return next;
  return;
end;
$$;


-- ---------------------------- 3. REPORTS V2 ----------------------------
-- Replace the basic reporting flow with a deduplicated, categorized one.
-- Reports are aggregated by (target_type, target_id, category) so 100 spam
-- reports on the same post become one queue item with hit_count = 100.

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  target_type     text not null check (target_type in ('post','reel','comment','reel_comment','profile','team','dm','event','news')),
  target_id       uuid not null,
  category        text not null check (category in ('spam','harassment','hate','threats','impersonation','inappropriate','misinformation','underage','copyright','other')),
  status          text not null default 'pending' check (status in ('pending','reviewed','actioned','dismissed')),
  hit_count       int not null default 0,
  first_reported_at timestamptz not null default now(),
  last_reported_at  timestamptz not null default now(),
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  resolution_note text,
  unique (target_type, target_id, category)
);

create index if not exists reports_status_idx on public.reports (status, last_reported_at desc);

create table if not exists public.report_submissions (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references public.reports(id) on delete cascade,
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  reason_text   text check (char_length(reason_text) <= 500),
  outcome       text default 'pending' check (outcome in ('pending','acknowledged','actioned','dismissed','false')),
  created_at    timestamptz default now(),
  unique (report_id, reporter_id)  -- a user can only submit once per report
);

create index if not exists report_submissions_reporter_idx on public.report_submissions (reporter_id, created_at desc);

-- Track false-report rate per user. >= 5 dismissed-as-false in 90 days =>
-- the user's report ability is throttled.
alter table public.profiles add column if not exists false_report_count int default 0;

alter table public.reports             enable row level security;
alter table public.report_submissions  enable row level security;

drop policy if exists "reports admin only" on public.reports;
create policy "reports admin only" on public.reports
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "report_submissions reporter or admin read" on public.report_submissions;
create policy "report_submissions reporter or admin read" on public.report_submissions
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "report_submissions self insert" on public.report_submissions;
create policy "report_submissions self insert" on public.report_submissions
  for insert with check (auth.uid() = reporter_id);


-- Submit-or-aggregate function: called by the server action. Inserts a
-- submission, upserts the parent report, bumps the hit_count atomically.
create or replace function public.submit_report(
  p_target_type text,
  p_target_id   uuid,
  p_category    text,
  p_reason_text text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_reporter uuid := auth.uid();
  v_report_id uuid;
  v_existing_submission uuid;
begin
  if v_reporter is null then
    raise exception 'auth required';
  end if;

  -- Throttle abusers.
  if (select false_report_count from public.profiles where id = v_reporter) >= 5 then
    raise exception 'report ability restricted due to repeated false reports';
  end if;

  -- Upsert the parent report.
  insert into public.reports (target_type, target_id, category, hit_count, last_reported_at)
       values (p_target_type, p_target_id, p_category, 1, now())
  on conflict (target_type, target_id, category)
    do update set hit_count = public.reports.hit_count + 1,
                  last_reported_at = now()
  returning id into v_report_id;

  -- Add the submission (or do nothing if this user already reported).
  insert into public.report_submissions (report_id, reporter_id, reason_text)
       values (v_report_id, v_reporter, nullif(p_reason_text, ''))
  on conflict (report_id, reporter_id) do nothing;

  return v_report_id;
end;
$$;


-- ---------------------------- 4. YOUTH SAFEGUARDING ----------------------------
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists parental_consent_email text;
alter table public.profiles add column if not exists parental_consent_confirmed_at timestamptz;

alter table public.teams add column if not exists has_youth_players boolean default false;
alter table public.teams add column if not exists safeguarding_contact_name text;
alter table public.teams add column if not exists safeguarding_contact_email text;

-- Helper: age in years.
create or replace function public.age_years(p_dob date)
returns int language sql immutable as $$
  select case when p_dob is null then null
              else extract(year from age(current_date, p_dob))::int
         end;
$$;

-- Constraint: profiles must be 13+ at the moment of insert/update.
-- Enforced via trigger so we can return a friendly error.
create or replace function public.enforce_min_age()
returns trigger language plpgsql as $$
begin
  if new.date_of_birth is not null and public.age_years(new.date_of_birth) < 13 then
    raise exception 'min_age_13' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_min_age on public.profiles;
create trigger trg_enforce_min_age
  before insert or update of date_of_birth on public.profiles
  for each row execute function public.enforce_min_age();


-- ---------------------------- 5. PRIVACY SETTINGS ----------------------------
-- Single JSON column; default mirrors the spec.
alter table public.profiles add column if not exists privacy_settings jsonb default jsonb_build_object(
  'who_can_dm',           'everyone',   -- 'everyone' | 'follows' | 'nobody'
  'who_can_see_follows',  'everyone',   -- 'everyone' | 'me'
  'who_can_see_teams',    'everyone',
  'who_can_see_matches',  'everyone',   -- 'everyone' | 'follows' | 'me'
  'who_can_comment',      'everyone',   -- 'everyone' | 'follows' | 'nobody'
  'who_can_tag',          'everyone',   -- 'everyone' | 'follows' | 'nobody'
  'read_receipts',        true
);


-- ---------------------------- 6. ACCOUNT DELETION (GDPR) ----------------------------
alter table public.profiles add column if not exists deletion_requested_at timestamptz;
alter table public.profiles add column if not exists deleted_at timestamptz;

-- Helper: anonymize a user record. Called by the purge cron after the 30-day
-- recovery window expires. Replaces identifying fields with anonymous values
-- and frees the username for reuse.
create or replace function public.anonymize_profile(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set username       = 'deleted-user-' || substr(p_user_id::text, 1, 8),
         full_name      = 'Deleted user',
         avatar_url     = null,
         bio            = null,
         phone          = null,
         date_of_birth  = null,
         parental_consent_email = null,
         is_active      = false,
         deleted_at     = now()
   where id = p_user_id;
end;
$$;

-- Purge helper for accounts whose deletion was requested >30 days ago.
create or replace function public.purge_deleted_accounts()
returns int language plpgsql security definer set search_path = public as $$
declare
  rec record;
  n int := 0;
begin
  for rec in
    select id from public.profiles
     where deletion_requested_at is not null
       and deleted_at is null
       and deletion_requested_at < now() - interval '30 days'
  loop
    perform public.anonymize_profile(rec.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;


-- ---------------------------- 7. MESSAGING FOUNDATION ----------------------------
create table if not exists public.dm_conversations (
  id          uuid primary key default gen_random_uuid(),
  is_group    boolean default false,
  title       text,
  created_by  uuid references public.profiles(id),
  last_message_at timestamptz default now(),
  created_at  timestamptz default now()
);

create index if not exists dm_conv_last_idx on public.dm_conversations (last_message_at desc);

create table if not exists public.dm_participants (
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text default 'member' check (role in ('member','admin')),
  status          text default 'active' check (status in ('active','muted','archived','left')),
  joined_at       timestamptz default now(),
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists dm_part_user_idx on public.dm_participants (user_id, status);

create table if not exists public.dm_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text check (char_length(body) <= 4000),
  attachment_url  text,
  attachment_kind text check (attachment_kind in ('image','video','file')),
  created_at      timestamptz default now(),
  deleted_at      timestamptz
);

create index if not exists dm_msg_conv_idx on public.dm_messages (conversation_id, created_at);
create index if not exists dm_msg_sender_idx on public.dm_messages (sender_id);

-- Message requests: a pending invitation to start a conversation. When the
-- recipient does not follow the sender, the first message goes here instead
-- of dm_messages. Recipient accepts/declines/blocks.
create table if not exists public.dm_message_requests (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  preview_body  text check (char_length(preview_body) <= 500),
  status        text default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at    timestamptz default now(),
  reviewed_at   timestamptz,
  unique (sender_id, recipient_id, status)  -- one open request per pair
);

create index if not exists dm_req_recipient_idx on public.dm_message_requests (recipient_id, status);

alter table public.dm_conversations     enable row level security;
alter table public.dm_participants      enable row level security;
alter table public.dm_messages          enable row level security;
alter table public.dm_message_requests  enable row level security;

drop policy if exists "dm_conv read by participants" on public.dm_conversations;
create policy "dm_conv read by participants" on public.dm_conversations
  for select using (
    exists (select 1 from public.dm_participants p where p.conversation_id = id and p.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "dm_part read self" on public.dm_participants;
create policy "dm_part read self" on public.dm_participants
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.dm_participants p
       where p.conversation_id = dm_participants.conversation_id
         and p.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "dm_msg read by participants" on public.dm_messages;
create policy "dm_msg read by participants" on public.dm_messages
  for select using (
    exists (
      select 1 from public.dm_participants p
       where p.conversation_id = dm_messages.conversation_id
         and p.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "dm_msg send by participant" on public.dm_messages;
create policy "dm_msg send by participant" on public.dm_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.dm_participants p
       where p.conversation_id = dm_messages.conversation_id
         and p.user_id = auth.uid()
         and p.status = 'active'
    )
  );

drop policy if exists "dm_req read by participants" on public.dm_message_requests;
create policy "dm_req read by participants" on public.dm_message_requests
  for select using (
    auth.uid() = sender_id
    or auth.uid() = recipient_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "dm_req send self" on public.dm_message_requests;
create policy "dm_req send self" on public.dm_message_requests
  for insert with check (auth.uid() = sender_id);
drop policy if exists "dm_req review by recipient" on public.dm_message_requests;
create policy "dm_req review by recipient" on public.dm_message_requests
  for update using (auth.uid() = recipient_id);


-- ---------------------------- BLOCK ENFORCEMENT IN RLS ----------------------------
-- Apply user_blocks check to user-discoverable content. Profiles, follows,
-- reels, comments, DM requests all hide content where the viewer has been
-- blocked OR has blocked the author.

drop policy if exists "Profiles readable by all" on public.profiles;
create policy "Profiles readable by all" on public.profiles
  for select using (
    deleted_at is null
    and (auth.uid() is null or not public.is_blocked(auth.uid(), id))
  );

drop policy if exists "Published reels readable by all" on public.reels;
create policy "Published reels readable by all" on public.reels
  for select using (
    (is_published = true and deleted_at is null
     and (auth.uid() is null or not public.is_blocked(auth.uid(), author_id)))
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "reel_comments readable by all" on public.reel_comments;
create policy "reel_comments readable by all" on public.reel_comments
  for select using (
    (deleted_at is null
     and (auth.uid() is null or not public.is_blocked(auth.uid(), author_id)))
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- ---------------------------- SCALE: KEY INDEXES ----------------------------
-- Indexes for the hot paths called out in the gap analysis (1M user scale).
-- Most are no-ops if duplicates already exist via earlier migrations.
create index if not exists idx_reels_country_sport_created on public.reels (country_code, sport, created_at desc) where is_published = true and deleted_at is null;
create index if not exists idx_events_state_date          on public.events (state_province, start_datetime) where is_published = true;
create index if not exists idx_team_members_player_active on public.team_members (player_id) where is_active = true;
create index if not exists idx_team_members_team_active   on public.team_members (team_id) where is_active = true;
create index if not exists idx_follows_follower           on public.follows (follower_id, subject_type, subject_id);
create index if not exists idx_profiles_country_active    on public.profiles (country_code) where is_active = true;


-- ---------------------------- VERIFY ----------------------------
-- select count(*) from public.user_blocks;
-- select target_type, target_id, category, hit_count from public.reports order by last_reported_at desc;
-- select id, deletion_requested_at from public.profiles where deletion_requested_at is not null;
