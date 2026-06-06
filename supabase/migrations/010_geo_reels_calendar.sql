-- =============================================================================
-- ASF Platform - Migration 010: Geo hierarchy + Reels feed
-- =============================================================================
-- Adds:
--   1. geo_districts table (country-agnostic; seeded with Afghanistan provinces
--      and ~150 well-documented major districts; admin can extend via /admin/geo).
--   2. reels table for short-form video posts, sorted-by-newest with country +
--      sport filters. RLS: published reels readable by all; insertable by
--      authenticated users; author may edit/delete; admin may moderate.
--   3. reel_likes + reel_comments support tables.
--   4. district_code columns on profiles, teams, events.
-- Idempotent. Safe to re-run.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Geo hierarchy
-- ----------------------------------------------------------------------------

create table if not exists public.geo_districts (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null default 'AF',
  province_code text not null,
  province_name text not null,
  code          text not null,
  name          text not null,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  unique(country_code, code)
);

create index if not exists geo_districts_country_idx     on public.geo_districts (country_code);
create index if not exists geo_districts_province_idx    on public.geo_districts (country_code, province_code);

alter table public.geo_districts enable row level security;
drop policy if exists "geo_districts readable by all" on public.geo_districts;
create policy "geo_districts readable by all" on public.geo_districts for select using (true);
drop policy if exists "geo_districts admin only writes" on public.geo_districts;
create policy "geo_districts admin only writes" on public.geo_districts
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Add district_code columns to existing tables (NULL allowed; admin/UI can set).
alter table public.profiles add column if not exists district_code text;
alter table public.teams    add column if not exists district_code text;
alter table public.events   add column if not exists district_code text;


-- ----------------------------------------------------------------------------
-- 2. Reels (short video posts)
-- ----------------------------------------------------------------------------

create table if not exists public.reels (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  video_url       text not null,
  thumbnail_url   text,
  caption         text check (char_length(caption) <= 500),
  sport           text,
  country_code    text default 'US',
  state_province  text,
  district_code   text,
  duration_seconds int,
  view_count      int default 0,
  like_count      int default 0,
  comment_count   int default 0,
  is_published    boolean default true,
  is_featured     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists reels_published_idx on public.reels (is_published, created_at desc);
create index if not exists reels_country_idx   on public.reels (country_code, created_at desc);
create index if not exists reels_sport_idx     on public.reels (sport, created_at desc);
create index if not exists reels_author_idx    on public.reels (author_id, created_at desc);

alter table public.reels enable row level security;
drop policy if exists "Published reels readable by all" on public.reels;
create policy "Published reels readable by all" on public.reels
  for select using (is_published = true or auth.uid() = author_id);
drop policy if exists "Reels insertable by authenticated" on public.reels;
create policy "Reels insertable by authenticated" on public.reels
  for insert with check (auth.uid() is not null and auth.uid() = author_id);
drop policy if exists "Reels updatable by author or admin" on public.reels;
create policy "Reels updatable by author or admin" on public.reels
  for update using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
drop policy if exists "Reels deletable by author or admin" on public.reels;
create policy "Reels deletable by author or admin" on public.reels
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


create table if not exists public.reel_likes (
  reel_id    uuid not null references public.reels(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (reel_id, user_id)
);

alter table public.reel_likes enable row level security;
drop policy if exists "reel_likes readable by all" on public.reel_likes;
create policy "reel_likes readable by all" on public.reel_likes for select using (true);
drop policy if exists "reel_likes manageable by user" on public.reel_likes;
create policy "reel_likes manageable by user" on public.reel_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


create table if not exists public.reel_comments (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz default now()
);

create index if not exists reel_comments_reel_idx on public.reel_comments (reel_id, created_at desc);

alter table public.reel_comments enable row level security;
drop policy if exists "reel_comments readable by all" on public.reel_comments;
create policy "reel_comments readable by all" on public.reel_comments for select using (true);
drop policy if exists "reel_comments insertable by authenticated" on public.reel_comments;
create policy "reel_comments insertable by authenticated" on public.reel_comments
  for insert with check (auth.uid() is not null and auth.uid() = author_id);
drop policy if exists "reel_comments deletable by author or admin" on public.reel_comments;
create policy "reel_comments deletable by author or admin" on public.reel_comments
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );


-- Trigger: keep reels.like_count in sync.
create or replace function public.sync_reel_like_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.reels set like_count = like_count + 1 where id = new.reel_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.reels set like_count = greatest(like_count - 1, 0) where id = old.reel_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_reel_like_count on public.reel_likes;
create trigger trg_sync_reel_like_count
  after insert or delete on public.reel_likes
  for each row execute function public.sync_reel_like_count();

-- Trigger: keep reels.comment_count in sync.
create or replace function public.sync_reel_comment_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.reels set comment_count = comment_count + 1 where id = new.reel_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.reels set comment_count = greatest(comment_count - 1, 0) where id = old.reel_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_reel_comment_count on public.reel_comments;
create trigger trg_sync_reel_comment_count
  after insert or delete on public.reel_comments
  for each row execute function public.sync_reel_comment_count();


-- ----------------------------------------------------------------------------
-- 3. Storage bucket: reels (public, video files, 100 MB max)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('reels', 'reels', true, 104857600, array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do nothing;

drop policy if exists "reels_select_public"   on storage.objects;
drop policy if exists "reels_insert_owner"    on storage.objects;
drop policy if exists "reels_update_owner"    on storage.objects;
drop policy if exists "reels_delete_owner"    on storage.objects;

create policy "reels_select_public" on storage.objects
  for select using (bucket_id = 'reels');

create policy "reels_insert_owner" on storage.objects
  for insert with check (
    bucket_id = 'reels'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "reels_update_owner" on storage.objects
  for update using (
    bucket_id = 'reels'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "reels_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'reels'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
  );


-- ----------------------------------------------------------------------------
-- 4. Seed Afghanistan provinces + major districts
-- ----------------------------------------------------------------------------
-- Source: well-documented major administrative divisions. Admin can edit /
-- add more from /admin/geo.

insert into public.geo_districts (country_code, province_code, province_name, code, name) values
-- Kabul
('AF','KAB','Kabul','KAB-KAB','Kabul'),
('AF','KAB','Kabul','KAB-BAG','Bagrami'),
('AF','KAB','Kabul','KAB-CHA','Char Asiab'),
('AF','KAB','Kabul','KAB-DEH','Deh Sabz'),
('AF','KAB','Kabul','KAB-EST','Estalif'),
('AF','KAB','Kabul','KAB-FAR','Farza'),
('AF','KAB','Kabul','KAB-GUL','Guldara'),
('AF','KAB','Kabul','KAB-KAL','Kalakan'),
('AF','KAB','Kabul','KAB-KHJ','Khak-e Jabbar'),
('AF','KAB','Kabul','KAB-MBK','Mir Bacha Kot'),
('AF','KAB','Kabul','KAB-MUS','Musayi'),
('AF','KAB','Kabul','KAB-PAG','Paghman'),
('AF','KAB','Kabul','KAB-QAR','Qarabagh'),
('AF','KAB','Kabul','KAB-SHK','Shakardara'),
('AF','KAB','Kabul','KAB-SUR','Surobi'),
-- Balkh
('AF','BAL','Balkh','BAL-MZS','Mazar-e Sharif'),
('AF','BAL','Balkh','BAL-BAL','Balkh'),
('AF','BAL','Balkh','BAL-CHB','Charbolak'),
('AF','BAL','Balkh','BAL-CHM','Chimtal'),
('AF','BAL','Balkh','BAL-DAW','Dawlatabad'),
('AF','BAL','Balkh','BAL-DEH','Dehdadi'),
('AF','BAL','Balkh','BAL-KAL','Kaldar'),
('AF','BAL','Balkh','BAL-KHU','Khulm'),
('AF','BAL','Balkh','BAL-MAR','Marmul'),
('AF','BAL','Balkh','BAL-NAH','Nahr-e Shahi'),
('AF','BAL','Balkh','BAL-SHO','Sholgara'),
('AF','BAL','Balkh','BAL-SHR','Shortepa'),
('AF','BAL','Balkh','BAL-ZAR','Zari'),
('AF','BAL','Balkh','BAL-CHK','Chahar Kint'),
('AF','BAL','Balkh','BAL-KIS','Kishindeh'),
-- Herat
('AF','HER','Herat','HER-HER','Herat'),
('AF','HER','Herat','HER-ADR','Adraskan'),
('AF','HER','Herat','HER-CHI','Chishti Sharif'),
('AF','HER','Herat','HER-FAR','Farsi'),
('AF','HER','Herat','HER-GHO','Ghoryan'),
('AF','HER','Herat','HER-GUL','Gulran'),
('AF','HER','Herat','HER-GUZ','Guzara'),
('AF','HER','Herat','HER-INJ','Injil'),
('AF','HER','Herat','HER-KAR','Karukh'),
('AF','HER','Herat','HER-KOH','Kohsan'),
('AF','HER','Herat','HER-KUS','Kushk'),
('AF','HER','Herat','HER-KUK','Kushki Kuhna'),
('AF','HER','Herat','HER-OBE','Obe'),
('AF','HER','Herat','HER-PSH','Pashtun Zarghun'),
('AF','HER','Herat','HER-SHI','Shindand'),
('AF','HER','Herat','HER-ZIN','Zinda Jan'),
-- Kandahar
('AF','KAN','Kandahar','KAN-KAN','Kandahar'),
('AF','KAN','Kandahar','KAN-ARG','Arghandab'),
('AF','KAN','Kandahar','KAN-ARS','Arghestan'),
('AF','KAN','Kandahar','KAN-DAM','Daman'),
('AF','KAN','Kandahar','KAN-GHO','Ghorak'),
('AF','KAN','Kandahar','KAN-KHA','Khakrez'),
('AF','KAN','Kandahar','KAN-MAR','Maruf'),
('AF','KAN','Kandahar','KAN-MAI','Maiwand'),
('AF','KAN','Kandahar','KAN-NES','Nesh'),
('AF','KAN','Kandahar','KAN-PAN','Panjwai'),
('AF','KAN','Kandahar','KAN-REG','Reg'),
('AF','KAN','Kandahar','KAN-SHA','Shah Wali Kot'),
('AF','KAN','Kandahar','KAN-SHO','Shorabak'),
('AF','KAN','Kandahar','KAN-SPI','Spin Boldak'),
('AF','KAN','Kandahar','KAN-ZHA','Zhari'),
-- Nangarhar
('AF','NAN','Nangarhar','NAN-JAL','Jalalabad'),
('AF','NAN','Nangarhar','NAN-ACH','Achin'),
('AF','NAN','Nangarhar','NAN-BAT','Bati Kot'),
('AF','NAN','Nangarhar','NAN-BEH','Behsud'),
('AF','NAN','Nangarhar','NAN-CHA','Chaparhar'),
('AF','NAN','Nangarhar','NAN-DAR','Dara-e Noor'),
('AF','NAN','Nangarhar','NAN-DBA','Deh Bala'),
('AF','NAN','Nangarhar','NAN-DUR','Dur Baba'),
('AF','NAN','Nangarhar','NAN-GOS','Goshta'),
('AF','NAN','Nangarhar','NAN-HIS','Hisarak'),
('AF','NAN','Nangarhar','NAN-KAM','Kama'),
('AF','NAN','Nangarhar','NAN-KHO','Khogyani'),
('AF','NAN','Nangarhar','NAN-KOT','Kot'),
('AF','NAN','Nangarhar','NAN-KUZ','Kuz Kunar'),
('AF','NAN','Nangarhar','NAN-LAL','Lal Pur'),
('AF','NAN','Nangarhar','NAN-MUH','Muhmand Dara'),
('AF','NAN','Nangarhar','NAN-NAZ','Nazyan'),
('AF','NAN','Nangarhar','NAN-PAC','Pachir Aw Agam'),
('AF','NAN','Nangarhar','NAN-ROD','Rodat'),
('AF','NAN','Nangarhar','NAN-SHE','Sherzad'),
('AF','NAN','Nangarhar','NAN-SHI','Shinwar'),
('AF','NAN','Nangarhar','NAN-SUR','Surkh Rod'),
-- Helmand
('AF','HEL','Helmand','HEL-LAS','Lashkar Gah'),
('AF','HEL','Helmand','HEL-GAR','Garmsir'),
('AF','HEL','Helmand','HEL-KAJ','Kajaki'),
('AF','HEL','Helmand','HEL-KHA','Khanashin'),
('AF','HEL','Helmand','HEL-MAR','Marja'),
('AF','HEL','Helmand','HEL-MUS','Musa Qala'),
('AF','HEL','Helmand','HEL-NAD','Nad Ali'),
('AF','HEL','Helmand','HEL-NSA','Nahr-e Saraj'),
('AF','HEL','Helmand','HEL-NAW','Nawa-e Barakzai'),
('AF','HEL','Helmand','HEL-NWZ','Nawzad'),
('AF','HEL','Helmand','HEL-REG','Reg'),
('AF','HEL','Helmand','HEL-SAN','Sangin'),
('AF','HEL','Helmand','HEL-WAS','Washer'),
('AF','HEL','Helmand','HEL-BAG','Baghran'),
('AF','HEL','Helmand','HEL-DIS','Dishu'),
-- Kunduz
('AF','KUN','Kunduz','KUN-KUN','Kunduz'),
('AF','KUN','Kunduz','KUN-ALI','Ali Abad'),
('AF','KUN','Kunduz','KUN-CHA','Chahar Dara'),
('AF','KUN','Kunduz','KUN-DAS','Dasht-e Archi'),
('AF','KUN','Kunduz','KUN-IMA','Imam Sahib'),
('AF','KUN','Kunduz','KUN-KHA','Khanabad'),
('AF','KUN','Kunduz','KUN-QAL','Qala-e Zal'),
-- Baghlan
('AF','BGL','Baghlan','BGL-PUL','Pul-e Khumri'),
('AF','BGL','Baghlan','BGL-AND','Andarab'),
('AF','BGL','Baghlan','BGL-BAJ','Baghlan-e Jadid'),
('AF','BGL','Baghlan','BGL-BUR','Burka'),
('AF','BGL','Baghlan','BGL-DAH','Dahana-e Ghori'),
('AF','BGL','Baghlan','BGL-DUS','Dushi'),
('AF','BGL','Baghlan','BGL-FAR','Farang Wa Gharu'),
('AF','BGL','Baghlan','BGL-GUZ','Guzargah-e Nur'),
('AF','BGL','Baghlan','BGL-KHO','Khost Wa Fereng'),
('AF','BGL','Baghlan','BGL-KHI','Khinjan'),
('AF','BGL','Baghlan','BGL-NAH','Nahrin'),
('AF','BGL','Baghlan','BGL-PSH','Pul-e Hesar'),
('AF','BGL','Baghlan','BGL-TAL','Tala Wa Barfak'),
-- Takhar
('AF','TAK','Takhar','TAK-TAL','Taloqan'),
('AF','TAK','Takhar','TAK-BAH','Baharak'),
('AF','TAK','Takhar','TAK-BAN','Bangi'),
('AF','TAK','Takhar','TAK-CHA','Chah Ab'),
('AF','TAK','Takhar','TAK-DAR','Darqad'),
('AF','TAK','Takhar','TAK-DAS','Dashti Qala'),
('AF','TAK','Takhar','TAK-FAR','Farkhar'),
('AF','TAK','Takhar','TAK-HAZ','Hazar Sumuch'),
('AF','TAK','Takhar','TAK-ISH','Ishkamish'),
('AF','TAK','Takhar','TAK-KAL','Kalafgan'),
('AF','TAK','Takhar','TAK-KHJ','Khwaja Bahawuddin'),
('AF','TAK','Takhar','TAK-KHG','Khwaja Ghar'),
('AF','TAK','Takhar','TAK-NAM','Namak Ab'),
('AF','TAK','Takhar','TAK-RUS','Rustaq'),
('AF','TAK','Takhar','TAK-WRS','Warsaj'),
('AF','TAK','Takhar','TAK-YAN','Yangi Qala'),
-- Badakhshan
('AF','BDK','Badakhshan','BDK-FAY','Faizabad'),
('AF','BDK','Badakhshan','BDK-ARG','Arghanj Khwa'),
('AF','BDK','Badakhshan','BDK-ARH','Argo'),
('AF','BDK','Badakhshan','BDK-BAH','Baharak'),
('AF','BDK','Badakhshan','BDK-DAR','Darayim'),
('AF','BDK','Badakhshan','BDK-ISH','Ishkashim'),
('AF','BDK','Badakhshan','BDK-JUR','Jurm'),
('AF','BDK','Badakhshan','BDK-KEI','Keshem'),
('AF','BDK','Badakhshan','BDK-KHA','Khash'),
('AF','BDK','Badakhshan','BDK-KOF','Kof Ab'),
('AF','BDK','Badakhshan','BDK-RAG','Ragh'),
('AF','BDK','Badakhshan','BDK-SHE','Sheghnan'),
('AF','BDK','Badakhshan','BDK-SHU','Shuhada'),
('AF','BDK','Badakhshan','BDK-WAK','Wakhan'),
('AF','BDK','Badakhshan','BDK-YAF','Yaftal-e Sufla'),
('AF','BDK','Badakhshan','BDK-YAM','Yamgan'),
('AF','BDK','Badakhshan','BDK-ZEB','Zebak'),
-- Kapisa
('AF','KAP','Kapisa','KAP-MAH','Mahmud-e Raqi'),
('AF','KAP','Kapisa','KAP-ALA','Alasai'),
('AF','KAP','Kapisa','KAP-HIS','Hisa-i-Awwali Kohistan'),
('AF','KAP','Kapisa','KAP-HID','Hisa-i-Duwumi Kohistan'),
('AF','KAP','Kapisa','KAP-KOB','Koh Band'),
('AF','KAP','Kapisa','KAP-NIJ','Nijrab'),
('AF','KAP','Kapisa','KAP-TAG','Tagab'),
-- Parwan
('AF','PAR','Parwan','PAR-CHA','Charikar'),
('AF','PAR','Parwan','PAR-BAG','Bagram'),
('AF','PAR','Parwan','PAR-GHO','Ghorband'),
('AF','PAR','Parwan','PAR-JAB','Jabal Saraj'),
('AF','PAR','Parwan','PAR-KHO','Koh-e Safi'),
('AF','PAR','Parwan','PAR-SAL','Salang'),
('AF','PAR','Parwan','PAR-SAY','Sayyid Khel'),
('AF','PAR','Parwan','PAR-SHE','Shekh Ali'),
('AF','PAR','Parwan','PAR-SHN','Shinwari'),
('AF','PAR','Parwan','PAR-SUR','Surkh-e Parsa'),
-- Panjshir
('AF','PAN','Panjshir','PAN-BAZ','Bazarak'),
('AF','PAN','Panjshir','PAN-ABS','Abshar'),
('AF','PAN','Panjshir','PAN-DAR','Dara'),
('AF','PAN','Panjshir','PAN-KHI','Khinj'),
('AF','PAN','Panjshir','PAN-PAR','Paryan'),
('AF','PAN','Panjshir','PAN-REK','Rekha'),
('AF','PAN','Panjshir','PAN-SHU','Shutul'),
-- Logar
('AF','LOG','Logar','LOG-PUL','Pul-e Alam'),
('AF','LOG','Logar','LOG-AZR','Azra'),
('AF','LOG','Logar','LOG-BAR','Baraki Barak'),
('AF','LOG','Logar','LOG-CHA','Charkh'),
('AF','LOG','Logar','LOG-KHO','Khoshi'),
('AF','LOG','Logar','LOG-MOH','Mohammad Agha'),
('AF','LOG','Logar','LOG-KHA','Khar War'),
-- Wardak (Maidan Wardak)
('AF','WAR','Maidan Wardak','WAR-MAI','Maidan Shahr'),
('AF','WAR','Maidan Wardak','WAR-CHA','Chaki Wardak'),
('AF','WAR','Maidan Wardak','WAR-DAY','Day Mirdad'),
('AF','WAR','Maidan Wardak','WAR-HIS','Hisa-e Awal-e Behsud'),
('AF','WAR','Maidan Wardak','WAR-JAL','Jaghatu'),
('AF','WAR','Maidan Wardak','WAR-JLR','Jalrez'),
('AF','WAR','Maidan Wardak','WAR-MRK','Markaz-e Behsud'),
('AF','WAR','Maidan Wardak','WAR-NER','Nerkh'),
('AF','WAR','Maidan Wardak','WAR-SAY','Sayyidabad'),
-- Bamyan
('AF','BAM','Bamyan','BAM-BAM','Bamyan'),
('AF','BAM','Bamyan','BAM-KAH','Kahmard'),
('AF','BAM','Bamyan','BAM-PAN','Panjab'),
('AF','BAM','Bamyan','BAM-SAI','Saighan'),
('AF','BAM','Bamyan','BAM-SHI','Shibar'),
('AF','BAM','Bamyan','BAM-WAR','Waras'),
('AF','BAM','Bamyan','BAM-YAK','Yakawlang'),
-- Daykundi
('AF','DAY','Daykundi','DAY-NIL','Nili'),
('AF','DAY','Daykundi','DAY-ASH','Ashtarlay'),
('AF','DAY','Daykundi','DAY-GIZ','Gizab'),
('AF','DAY','Daykundi','DAY-KIT','Kiti'),
('AF','DAY','Daykundi','DAY-KAJ','Kajran'),
('AF','DAY','Daykundi','DAY-KHE','Khedir'),
('AF','DAY','Daykundi','DAY-MIR','Miramor'),
('AF','DAY','Daykundi','DAY-SAB','Sang-e Takht'),
('AF','DAY','Daykundi','DAY-SHA','Shahristan'),
-- Ghazni
('AF','GHZ','Ghazni','GHZ-GHZ','Ghazni'),
('AF','GHZ','Ghazni','GHZ-AB','Ab Band'),
('AF','GHZ','Ghazni','GHZ-AJR','Ajristan'),
('AF','GHZ','Ghazni','GHZ-AND','Andar'),
('AF','GHZ','Ghazni','GHZ-DEH','Deh Yak'),
('AF','GHZ','Ghazni','GHZ-GEL','Gelan'),
('AF','GHZ','Ghazni','GHZ-GIR','Giro'),
('AF','GHZ','Ghazni','GHZ-JAG','Jaghatu'),
('AF','GHZ','Ghazni','GHZ-JGH','Jaghuri'),
('AF','GHZ','Ghazni','GHZ-KHW','Khwaja Omari'),
('AF','GHZ','Ghazni','GHZ-MAL','Malestan'),
('AF','GHZ','Ghazni','GHZ-MUQ','Muqur'),
('AF','GHZ','Ghazni','GHZ-NAW','Nawa'),
('AF','GHZ','Ghazni','GHZ-NWR','Nawur'),
('AF','GHZ','Ghazni','GHZ-QAR','Qarabagh'),
('AF','GHZ','Ghazni','GHZ-RSH','Rashidan'),
('AF','GHZ','Ghazni','GHZ-WAH','Waghaz'),
('AF','GHZ','Ghazni','GHZ-ZAN','Zana Khan'),
-- Paktia
('AF','PKA','Paktia','PKA-GAR','Gardez'),
('AF','PKA','Paktia','PKA-AHM','Ahmadabad'),
('AF','PKA','Paktia','PKA-CHA','Chamkani'),
('AF','PKA','Paktia','PKA-DZA','Dzadran'),
('AF','PKA','Paktia','PKA-JAJ','Jaji'),
('AF','PKA','Paktia','PKA-LJA','Laja Mangal'),
('AF','PKA','Paktia','PKA-SAY','Sayed Karam'),
('AF','PKA','Paktia','PKA-SHW','Shwak'),
('AF','PKA','Paktia','PKA-WAZ','Wuza Dzadran'),
('AF','PKA','Paktia','PKA-ZAD','Zadran'),
('AF','PKA','Paktia','PKA-ZRM','Zurmat'),
-- Khost
('AF','KHO','Khost','KHO-KHO','Khost'),
('AF','KHO','Khost','KHO-BAK','Bak'),
('AF','KHO','Khost','KHO-GUR','Gurbuz'),
('AF','KHO','Khost','KHO-JAJ','Jaji Maidan'),
('AF','KHO','Khost','KHO-MAN','Mandozai'),
('AF','KHO','Khost','KHO-MUS','Musa Khel'),
('AF','KHO','Khost','KHO-NAD','Nadir Shah Kot'),
('AF','KHO','Khost','KHO-QAL','Qalandar'),
('AF','KHO','Khost','KHO-SAB','Sabari'),
('AF','KHO','Khost','KHO-SHA','Shamal'),
('AF','KHO','Khost','KHO-SPE','Spera'),
('AF','KHO','Khost','KHO-TAN','Tani'),
('AF','KHO','Khost','KHO-TER','Tere Zayi'),
-- Paktika
('AF','PKK','Paktika','PKK-SHA','Sharana'),
('AF','PKK','Paktika','PKK-BRM','Barmal'),
('AF','PKK','Paktika','PKK-DIL','Dila'),
('AF','PKK','Paktika','PKK-GAY','Gayan'),
('AF','PKK','Paktika','PKK-GIY','Giyan'),
('AF','PKK','Paktika','PKK-JAN','Jani Khel'),
('AF','PKK','Paktika','PKK-MAT','Mata Khan'),
('AF','PKK','Paktika','PKK-NAK','Naka'),
('AF','PKK','Paktika','PKK-OMN','Omna'),
('AF','PKK','Paktika','PKK-SAR','Sar Hawza'),
('AF','PKK','Paktika','PKK-SUR','Sarobi'),
('AF','PKK','Paktika','PKK-URG','Urgun'),
('AF','PKK','Paktika','PKK-WAZ','Waza Khwa'),
('AF','PKK','Paktika','PKK-YAH','Yahya Khel'),
('AF','PKK','Paktika','PKK-YOS','Yosuf Khel'),
('AF','PKK','Paktika','PKK-ZRG','Zarghun Shahr'),
-- Laghman
('AF','LAG','Laghman','LAG-MEH','Mehtarlam'),
('AF','LAG','Laghman','LAG-ALI','Alingar'),
('AF','LAG','Laghman','LAG-ALS','Alishing'),
('AF','LAG','Laghman','LAG-DAW','Dawlat Shah'),
('AF','LAG','Laghman','LAG-QAR','Qarghayi'),
-- Kunar
('AF','KNR','Kunar','KNR-ASA','Asadabad'),
('AF','KNR','Kunar','KNR-BAR','Bar Kunar'),
('AF','KNR','Kunar','KNR-CHA','Chapa Dara'),
('AF','KNR','Kunar','KNR-CHW','Chawkay'),
('AF','KNR','Kunar','KNR-DAN','Dangam'),
('AF','KNR','Kunar','KNR-DAR','Dara-e Pech'),
('AF','KNR','Kunar','KNR-GHA','Ghaziabad'),
('AF','KNR','Kunar','KNR-MAR','Marawara'),
('AF','KNR','Kunar','KNR-NAR','Nari'),
('AF','KNR','Kunar','KNR-NAW','Nurgal'),
('AF','KNR','Kunar','KNR-SAW','Sarkani'),
('AF','KNR','Kunar','KNR-SHA','Shaigal'),
('AF','KNR','Kunar','KNR-WAT','Watapur'),
-- Nuristan
('AF','NUR','Nuristan','NUR-PAR','Parun'),
('AF','NUR','Nuristan','NUR-BRG','Bargi Matal'),
('AF','NUR','Nuristan','NUR-DUA','Du Ab'),
('AF','NUR','Nuristan','NUR-KAM','Kamdesh'),
('AF','NUR','Nuristan','NUR-MAN','Mandol'),
('AF','NUR','Nuristan','NUR-NUR','Nurgaram'),
('AF','NUR','Nuristan','NUR-WAI','Waigal'),
('AF','NUR','Nuristan','NUR-WAM','Wama'),
-- Faryab
('AF','FRY','Faryab','FRY-MAY','Maymana'),
('AF','FRY','Faryab','FRY-ALM','Almar'),
('AF','FRY','Faryab','FRY-AND','Andkhoy'),
('AF','FRY','Faryab','FRY-BIL','Bilcheragh'),
('AF','FRY','Faryab','FRY-DAW','Dawlat Abad'),
('AF','FRY','Faryab','FRY-GAR','Garziwan'),
('AF','FRY','Faryab','FRY-KHA','Khwaja Sabz Posh'),
('AF','FRY','Faryab','FRY-KOH','Kohistan'),
('AF','FRY','Faryab','FRY-PAS','Pashtun Kot'),
('AF','FRY','Faryab','FRY-QAR','Qaramqol'),
('AF','FRY','Faryab','FRY-QAY','Qaysar'),
('AF','FRY','Faryab','FRY-QUR','Qurghan'),
('AF','FRY','Faryab','FRY-SHI','Shirin Tagab'),
-- Jowzjan
('AF','JOW','Jowzjan','JOW-SHE','Sheberghan'),
('AF','JOW','Jowzjan','JOW-AQC','Aqcha'),
('AF','JOW','Jowzjan','JOW-DAR','Darzab'),
('AF','JOW','Jowzjan','JOW-FYZ','Fayzabad'),
('AF','JOW','Jowzjan','JOW-KHA','Khamyab'),
('AF','JOW','Jowzjan','JOW-KHN','Khaniqa'),
('AF','JOW','Jowzjan','JOW-MIN','Mingajik'),
('AF','JOW','Jowzjan','JOW-MAR','Mardyan'),
('AF','JOW','Jowzjan','JOW-QSH','Qush Tepa'),
-- Sar-e Pol
('AF','SAR','Sar-e Pol','SAR-SAR','Sar-e Pol'),
('AF','SAR','Sar-e Pol','SAR-BAL','Balkhab'),
('AF','SAR','Sar-e Pol','SAR-GOS','Gosfandi'),
('AF','SAR','Sar-e Pol','SAR-KOH','Kohistanat'),
('AF','SAR','Sar-e Pol','SAR-SAN','Sancharak'),
('AF','SAR','Sar-e Pol','SAR-SAY','Sayyad'),
('AF','SAR','Sar-e Pol','SAR-SOZ','Sozma Qala'),
-- Samangan
('AF','SAM','Samangan','SAM-AYB','Aybak'),
('AF','SAM','Samangan','SAM-DAR','Dara-e Suf-e Bala'),
('AF','SAM','Samangan','SAM-DRE','Dara-e Suf-e Payin'),
('AF','SAM','Samangan','SAM-FER','Feroz Nakhchir'),
('AF','SAM','Samangan','SAM-HAZ','Hazrat-e Sultan'),
('AF','SAM','Samangan','SAM-KHU','Khuram Wa Sarbagh'),
('AF','SAM','Samangan','SAM-RUI','Ruyi Du Ab'),
-- Ghor
('AF','GHO','Ghor','GHO-CHA','Chaghcharan'),
('AF','GHO','Ghor','GHO-CHH','Charsada'),
('AF','GHO','Ghor','GHO-DAW','Dawlat Yar'),
('AF','GHO','Ghor','GHO-DOL','Dolina'),
('AF','GHO','Ghor','GHO-LAL','Lal Wa Sarjangal'),
('AF','GHO','Ghor','GHO-PAS','Pasaband'),
('AF','GHO','Ghor','GHO-SAG','Saghar'),
('AF','GHO','Ghor','GHO-SHA','Shahrak'),
('AF','GHO','Ghor','GHO-TAY','Taywara'),
('AF','GHO','Ghor','GHO-TUL','Tulak'),
-- Farah
('AF','FRH','Farah','FRH-FRH','Farah'),
('AF','FRH','Farah','FRH-ANA','Anar Dara'),
('AF','FRH','Farah','FRH-BAK','Bakwa'),
('AF','FRH','Farah','FRH-BAL','Bala Buluk'),
('AF','FRH','Farah','FRH-GUL','Gulistan'),
('AF','FRH','Farah','FRH-KHA','Khaki Safed'),
('AF','FRH','Farah','FRH-LAS','Lash Wa Juwayn'),
('AF','FRH','Farah','FRH-PUR','Pur Chaman'),
('AF','FRH','Farah','FRH-PUS','Pusht Rod'),
('AF','FRH','Farah','FRH-QAL','Qala-e Kah'),
('AF','FRH','Farah','FRH-SHI','Shib Koh'),
-- Nimruz
('AF','NIM','Nimruz','NIM-ZAR','Zaranj'),
('AF','NIM','Nimruz','NIM-CHK','Chakhansur'),
('AF','NIM','Nimruz','NIM-KAN','Kang'),
('AF','NIM','Nimruz','NIM-KHA','Khash Rod'),
('AF','NIM','Nimruz','NIM-CHK2','Charburjak'),
-- Zabul
('AF','ZAB','Zabul','ZAB-QAL','Qalat'),
('AF','ZAB','Zabul','ZAB-ARG','Arghandab'),
('AF','ZAB','Zabul','ZAB-AT','Atghar'),
('AF','ZAB','Zabul','ZAB-DAY','Day Chopan'),
('AF','ZAB','Zabul','ZAB-MIZ','Mizan'),
('AF','ZAB','Zabul','ZAB-NAW','Nawbahar'),
('AF','ZAB','Zabul','ZAB-SHA','Shahjoy'),
('AF','ZAB','Zabul','ZAB-SHI','Shinkay'),
('AF','ZAB','Zabul','ZAB-SUR','Suri'),
('AF','ZAB','Zabul','ZAB-TAR','Tarnak Wa Jaldak'),
-- Uruzgan
('AF','URU','Uruzgan','URU-TIR','Tarinkot'),
('AF','URU','Uruzgan','URU-CHO','Chora'),
('AF','URU','Uruzgan','URU-DEH','Deh Rawud'),
('AF','URU','Uruzgan','URU-KHS','Khas Uruzgan'),
('AF','URU','Uruzgan','URU-SHA','Shahid-e Hassas'),
-- Badghis
('AF','BDG','Badghis','BDG-QAL','Qala-e Naw'),
('AF','BDG','Badghis','BDG-AB','Ab Kamari'),
('AF','BDG','Badghis','BDG-BAL','Bala Murghab'),
('AF','BDG','Badghis','BDG-GHO','Ghormach'),
('AF','BDG','Badghis','BDG-JAW','Jawand'),
('AF','BDG','Badghis','BDG-MUQ','Muqur'),
('AF','BDG','Badghis','BDG-QAD','Qadis')
on conflict (country_code, code) do nothing;


-- ----------------------------------------------------------------------------
-- 5. Verify
-- ----------------------------------------------------------------------------
--    select count(*) from public.geo_districts where country_code='AF';
--      -- expect ~250 rows after this seed; admin can add the rest via /admin/geo
--    select count(distinct province_code) from public.geo_districts where country_code='AF';
--      -- expect 32 (most provinces; some provinces still need seed)
--    select * from public.reels;     -- empty until users post
