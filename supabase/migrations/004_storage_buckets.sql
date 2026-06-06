-- =============================================================================
-- ASF Platform - Migration 004: Storage Buckets + Storage RLS
-- =============================================================================
-- Per ASF_LAUNCH_PRD.md > STEP 1 > Storage buckets (all public).
-- Run AFTER 001/002/003.
--
-- Buckets created: avatars, team-logos, gallery, events, news, sponsors.
-- Default policy: public read, authed insert, owner update/delete on user-owned
-- buckets (avatars), captain-checked for team-logos, admin-only for the rest.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Create buckets (public = true so storage URLs are publicly readable)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',     'avatars',     true,  2097152,  array['image/jpeg','image/png','image/webp']),         -- 2 MB
  ('team-logos',  'team-logos',  true,  2097152,  array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('gallery',     'gallery',     true,  10485760, array['image/jpeg','image/png','image/webp']),         -- 10 MB
  ('events',      'events',      true,  5242880,  array['image/jpeg','image/png','image/webp']),         -- 5 MB
  ('news',        'news',        true,  5242880,  array['image/jpeg','image/png','image/webp']),         -- 5 MB
  ('sponsors',    'sponsors',    true,  2097152,  array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Storage object policies
-- -----------------------------------------------------------------------------
-- Pattern: convention-over-config. The first path segment is the owning user id
-- so RLS can enforce ownership: e.g. avatars/<auth.uid()>/avatar.jpg
-- -----------------------------------------------------------------------------

-- Avatars: public read, owner write (path prefix = user id)
drop policy if exists "avatars_select_public"   on storage.objects;
drop policy if exists "avatars_insert_owner"    on storage.objects;
drop policy if exists "avatars_update_owner"    on storage.objects;
drop policy if exists "avatars_delete_owner"    on storage.objects;

create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_owner" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_owner" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- Team-logos: public read, captain write
-- Path convention: team-logos/<team_id>/logo.png
drop policy if exists "team_logos_select_public"   on storage.objects;
drop policy if exists "team_logos_insert_captain"  on storage.objects;
drop policy if exists "team_logos_update_captain"  on storage.objects;
drop policy if exists "team_logos_delete_captain"  on storage.objects;

create policy "team_logos_select_public" on storage.objects
  for select using (bucket_id = 'team-logos');

create policy "team_logos_insert_captain" on storage.objects
  for insert with check (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.teams t
      where t.id::text = (storage.foldername(name))[1]
        and t.captain_id = auth.uid()
    )
  );

create policy "team_logos_update_captain" on storage.objects
  for update using (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.teams t
      where t.id::text = (storage.foldername(name))[1]
        and t.captain_id = auth.uid()
    )
  );

create policy "team_logos_delete_captain" on storage.objects
  for delete using (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.teams t
      where t.id::text = (storage.foldername(name))[1]
        and t.captain_id = auth.uid()
    )
  );


-- Events: public read, organizer write
-- Path convention: events/<event_id>/banner.png
drop policy if exists "events_select_public"        on storage.objects;
drop policy if exists "events_insert_organizer"     on storage.objects;
drop policy if exists "events_update_organizer"     on storage.objects;
drop policy if exists "events_delete_organizer"     on storage.objects;

create policy "events_select_public" on storage.objects
  for select using (bucket_id = 'events');

create policy "events_insert_organizer" on storage.objects
  for insert with check (
    bucket_id = 'events'
    and (
      exists (
        select 1 from public.events e
        where e.id::text = (storage.foldername(name))[1]
          and e.organizer_id = auth.uid()
      )
      or public.is_admin(auth.uid())
    )
  );

create policy "events_update_organizer" on storage.objects
  for update using (
    bucket_id = 'events'
    and (
      exists (
        select 1 from public.events e
        where e.id::text = (storage.foldername(name))[1]
          and e.organizer_id = auth.uid()
      )
      or public.is_admin(auth.uid())
    )
  );

create policy "events_delete_organizer" on storage.objects
  for delete using (
    bucket_id = 'events'
    and (
      exists (
        select 1 from public.events e
        where e.id::text = (storage.foldername(name))[1]
          and e.organizer_id = auth.uid()
      )
      or public.is_admin(auth.uid())
    )
  );


-- Gallery / News / Sponsors: public read, admin-only write
do $$
declare
  b text;
begin
  for b in select unnest(array['gallery','news','sponsors']) loop
    execute format($pol$drop policy if exists "%s_select_public" on storage.objects$pol$, b);
    execute format($pol$drop policy if exists "%s_admin_all"     on storage.objects$pol$, b);

    execute format($pol$
      create policy "%s_select_public" on storage.objects
        for select using (bucket_id = %L)
    $pol$, b, b);

    execute format($pol$
      create policy "%s_admin_all" on storage.objects
        for all
        using (bucket_id = %L and public.is_admin(auth.uid()))
        with check (bucket_id = %L and public.is_admin(auth.uid()))
    $pol$, b, b, b);
  end loop;
end $$;
