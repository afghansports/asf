-- 022: Allow reels to be either a hosted file (Mux / Supabase Storage) or a
-- YouTube embed. Idempotent. Run after 021.

-- ---------------------------- 1. REELS COLUMNS ----------------------------
alter table public.reels add column if not exists video_kind text default 'file'
  check (video_kind in ('file','youtube','mux'));

-- For YouTube reels we store the raw video id (e.g. "dQw4w9WgXcQ") in this
-- column. video_url remains the public URL we hand to <video> / <iframe>.
alter table public.reels add column if not exists youtube_id text;

create index if not exists reels_kind_idx on public.reels (video_kind);

-- Backfill any reels that were uploaded via Mux before this column existed.
update public.reels set video_kind = 'mux'
 where mux_playback_id is not null and video_kind = 'file';
