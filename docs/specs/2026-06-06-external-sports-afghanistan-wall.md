# External sports feed → Afghanistan + World Cup 2026 wall

**Module:** `module.external_sports` · **Date:** 2026-06-06 · **Status:** approved, building

## Goal
Pull pro fixtures + results + news from free public APIs, focused on **anything connected to Afghanistan** plus **FIFA World Cup 2026**, and feed it **daily into the activity wall** (`/feed`). Refocus the existing global `/scores` feed onto the same. Give admins **full management** of wall entries (delete / hide / pin / manual post / bulk-clear).

## Sources (all free; no required keys)
| Source | Key? | Content | feed_tag |
|---|---|---|---|
| TheSportsDB | no (key `3`) | Afghanistan national + domestic team fixtures/results; WC2026 league `4429` | `afghanistan` / `wc2026` |
| Google News RSS | no | Afghanistan sports news (all sports) + WC2026 news | `afghanistan` / `wc2026` |
| ESPN Cricinfo RSS | no | cricket headlines, filtered to "Afghan*" | `afghanistan` |
| Football-Data.org | optional | WC2026 standings/groups (competition `WC`) | `wc2026` |

Verified live IDs: WC2026 league `4429`; AFG football `140156`, U23 `149431`, cricket `137147`, + Shpageeza franchises (`146014/15/18/29`, `150085/86/87`).

## Data model — migration `028_external_sports_wall.sql` (idempotent)
- `external_fixtures` + `external_news`: add `feed_tag text` (+ indexes).
- `wall_posts`: add `dedupe_key text` (full unique index — NULLs allowed for trigger rows), `is_hidden boolean default false`, `is_pinned boolean default false` (+ visibility index). Extend `kind` CHECK with `external_fixture`, `external_news`, `announcement`.

## Dedup (3 layers)
1. Per-source: `external_news` unique `(provider, provider_id)`.
2. Content key: `contentKey(title)` — lowercase, strip Google `" - Publisher"` suffix, strip diacritics/punct/stopwords, first 10 tokens joined by `-`. Same story from Google + ESPN → same key.
3. DB-enforced at the wall: `dedupe_key = news:{contentKey}` or `fixture:{provider}:{id}:{scheduled|final}`; unique index + `upsert(onConflict: dedupe_key, ignoreDuplicates)` makes a double entry impossible.

## Pipeline
- `lib/sports/adapters/thesportsdb.ts` (rewrite): AFG teams (`eventslast` + `eventsnext`) + WC league. Tags rows.
- `lib/sports/adapters/rss-news.ts` (new, replaces espn-rss): Google News AF + WC, ESPN Cricinfo (AFG-filtered), content-key deduped.
- `lib/sports/adapters/football-data.ts` (repurpose → WC only, optional).
- `lib/sports/adapters/balldontlie.ts`: removed (NBA, irrelevant).
- `lib/sports/normalize.ts` (new): `contentKey()`.
- `lib/sports/afghanistan-teams.ts` (new): team IDs + WC league const.
- `lib/sports/sync.ts`: new adapter set, gated by `module.external_sports`.
- `lib/sports/wall.ts` (new): `projectToWall()` — reads tagged cache rows, builds dedupe keys, upserts `external_fixture`/`external_news` posts (`actor_id = null`).

## Cron
- existing `/api/cron/sync-sports` (every 30 min) → keeps cache fresh.
- new `/api/cron/sports-wall` (daily `0 6 * * *`) → `projectToWall()`. Header `x-asf-cron-key: CRON_SECRET`. Add to `vercel.json`.

## Admin — `/admin/wall` (full management)
`app/admin/_wall-actions.ts` (requireAdmin + service client): `deleteWallPost`, `toggleWallHidden`, `toggleWallPinned`, `clearExternalWall`, `createAnnouncement`. Page lists recent posts (filter by kind) with per-row Delete/Hide/Pin, a "clear all external" button, and a manual announcement form. New sidebar nav item. `revalidatePath('/admin/wall')` + `('/feed')`.

## Public surfaces
- `/feed`: add the 3 kinds to `KIND_META` + filter chips; query excludes `is_hidden`, orders `is_pinned desc, created_at desc`; external links open in a new tab.
- `/scores`: filter cache by `feed_tag in ('afghanistan','wc2026')`; Afghanistan + World Cup sections instead of EPL/NBA.

## Out of scope
CricketData.org (dropped — redundant with Google/ESPN). No new required env keys.
