-- 030_content_translations.sql
-- Cache for AI (Azure Translator) translations of user/admin content. Keyed by a
-- hash of the source text + target locale, so identical strings translate once
-- and re-translate automatically when the source changes (its hash changes).
-- Writes go through the service role (server-side translate-on-read), so RLS
-- only needs to allow public reads.
create table if not exists public.content_translations (
  id              uuid primary key default gen_random_uuid(),
  source_hash     text not null,
  target_locale   text not null,          -- app locale code: 'fa-AF' (Dari) | 'ps' (Pashto)
  source_text     text not null,
  translated_text text not null,
  created_at      timestamptz not null default now(),
  unique (source_hash, target_locale)
);

create index if not exists content_translations_lookup_idx
  on public.content_translations (target_locale, source_hash);

alter table public.content_translations enable row level security;
drop policy if exists "Translations readable by all" on public.content_translations;
create policy "Translations readable by all" on public.content_translations for select using (true);
-- No public insert/update policy: translations are written by the service role.
