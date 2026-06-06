-- =============================================================================
-- ASF Platform - Migration 008: Management storage bucket
-- =============================================================================
-- Adds the `management` bucket used by /admin/team-members for board and
-- volunteer photos. Public read, admin/authenticated write.
-- Idempotent.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('management', 'management', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Public read
drop policy if exists "management_select_public" on storage.objects;
create policy "management_select_public" on storage.objects
  for select using (bucket_id = 'management');

-- Authenticated insert (admin checks happen at the route level via service-role
-- client; this policy keeps RLS sane if a non-service client ever writes).
drop policy if exists "management_insert_authed" on storage.objects;
create policy "management_insert_authed" on storage.objects
  for insert with check (
    bucket_id = 'management' and auth.role() = 'authenticated'
  );

drop policy if exists "management_update_authed" on storage.objects;
create policy "management_update_authed" on storage.objects
  for update using (
    bucket_id = 'management' and auth.role() = 'authenticated'
  );

drop policy if exists "management_delete_authed" on storage.objects;
create policy "management_delete_authed" on storage.objects
  for delete using (
    bucket_id = 'management' and auth.role() = 'authenticated'
  );

-- Verify:
--   select id, name, public from storage.buckets where id = 'management';
