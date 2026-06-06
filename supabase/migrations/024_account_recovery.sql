-- =============================================================================
-- ASF Platform - Migration 024: Account recovery (lost email access)
-- =============================================================================
-- Adds an admin-assisted account recovery channel for users who can no longer
-- access the email address on their account (so standard password reset, which
-- emails the old address, is useless to them).
--
-- Design (deliberately NOT self-service — self-service email change without the
-- existing email is an account-takeover vector):
--   1. A locked-out user submits a recovery request from a PUBLIC form
--      (they are not signed in). The form posts via a service-role server
--      action, so this table needs no anon RLS policy.
--   2. An admin reviews the request, verifies identity out-of-band, and either
--      approves (which changes the auth email + triggers a password reset to
--      the new address) or denies it.
-- All writes happen through admin-gated / service-role server actions; RLS here
-- only governs the (admin-only) read path. Idempotent.
-- =============================================================================

create table if not exists public.account_recovery_requests (
  id               uuid primary key default gen_random_uuid(),
  -- What the requester claims about the lost account:
  claimed_username text,
  claimed_email    text,
  full_name        text,
  -- The address they currently control and want to move the account to:
  new_email        text not null,
  -- Free-text identity evidence ("I captained team X", recent activity, etc.):
  details          text,
  -- Admin-resolved link to the real account (null until an admin matches it):
  matched_user_id  uuid references public.profiles(id) on delete set null,
  status           text not null default 'pending'
                     check (status in ('pending','approved','denied','cancelled')),
  review_notes     text,
  reviewed_by      uuid references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists account_recovery_status_idx
  on public.account_recovery_requests (status, created_at desc);
create index if not exists account_recovery_new_email_idx
  on public.account_recovery_requests (lower(new_email));

drop trigger if exists trg_account_recovery_updated_at on public.account_recovery_requests;
create trigger trg_account_recovery_updated_at
  before update on public.account_recovery_requests
  for each row execute function public.set_updated_at();

alter table public.account_recovery_requests enable row level security;

-- No anon/user policies: unauthenticated submissions go through a service-role
-- server action (RLS bypassed). Only admins may read or mutate via the client.
drop policy if exists "Recovery requests readable by admin" on public.account_recovery_requests;
create policy "Recovery requests readable by admin" on public.account_recovery_requests
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "Recovery requests writable by admin" on public.account_recovery_requests;
create policy "Recovery requests writable by admin" on public.account_recovery_requests
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
