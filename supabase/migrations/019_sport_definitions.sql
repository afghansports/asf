-- 019: Sport definitions data layer. Adding a new sport = adding rows to the
-- catalog tables; no schema change. Idempotent. Run after 018.

-- =============================================================================
-- 1. SPORTS CATALOG
-- =============================================================================
create table if not exists public.sports (
  code              text primary key,
  name              text not null,
  category          text not null default 'team'
                    check (category in ('team','individual','racket','combat','track','board','esport')),
  is_team_sport     boolean default true,
  default_format    text,                          -- references sport_match_formats(code)
  emoji             text,                          -- shown when an icon component isn't mapped
  sort_order        int default 0,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

alter table public.sports enable row level security;
drop policy if exists "Sports readable by all" on public.sports;
create policy "Sports readable by all" on public.sports for select using (true);
drop policy if exists "Sports writable by admin" on public.sports;
create policy "Sports writable by admin" on public.sports
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sports (code, name, category, is_team_sport, default_format, emoji, sort_order) values
  ('soccer',       'Soccer',        'team',       true,  'soccer-90',    '⚽', 10),
  ('futsal',       'Futsal',        'team',       true,  'futsal-40',    '⚽', 20),
  ('basketball',   'Basketball',    'team',       true,  'basketball-fiba', '🏀', 30),
  ('volleyball',   'Volleyball',    'team',       true,  'volleyball-bo5', '🏐', 40),
  ('cricket',      'Cricket',       'team',       true,  'cricket-t20',   '🏏', 50),
  ('tennis',       'Tennis',        'racket',     false, 'tennis-bo3',    '🎾', 60),
  ('table_tennis', 'Table tennis',  'racket',     false, 'tabletennis-bo5','🏓', 70),
  ('badminton',    'Badminton',     'racket',     false, 'badminton-bo3', '🏸', 80),
  ('bowling',      'Bowling',       'individual', false, 'bowling-frames','🎳', 90),
  ('wrestling',    'Wrestling',     'combat',     false, 'wrestling-3rd', '🤼', 100),
  ('boxing',       'Boxing',        'combat',     false, 'boxing-3rd',    '🥊', 110),
  ('athletics',    'Athletics',     'track',      false, null,            '🏃', 120),
  ('chess',        'Chess',         'board',      false, 'chess-classic', '♟️', 130)
on conflict (code) do nothing;


-- =============================================================================
-- 2. POSITIONS
-- =============================================================================
create table if not exists public.sport_positions (
  sport_code  text not null references public.sports(code) on delete cascade,
  code        text not null,
  name        text not null,
  abbrev      text,
  sort_order  int default 0,
  primary key (sport_code, code)
);

alter table public.sport_positions enable row level security;
drop policy if exists "Sport positions readable by all" on public.sport_positions;
create policy "Sport positions readable by all" on public.sport_positions for select using (true);
drop policy if exists "Sport positions writable by admin" on public.sport_positions;
create policy "Sport positions writable by admin" on public.sport_positions
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_positions (sport_code, code, name, abbrev, sort_order) values
  -- Soccer
  ('soccer','goalkeeper','Goalkeeper','GK',10),
  ('soccer','center_back','Centre back','CB',20),
  ('soccer','full_back','Full back','FB',30),
  ('soccer','def_mid','Defensive midfielder','DM',40),
  ('soccer','center_mid','Central midfielder','CM',50),
  ('soccer','att_mid','Attacking midfielder','AM',60),
  ('soccer','winger','Winger','W',70),
  ('soccer','striker','Striker','ST',80),
  -- Futsal
  ('futsal','goalkeeper','Goalkeeper','GK',10),
  ('futsal','defender','Fixo','FX',20),
  ('futsal','wing','Ala','AL',30),
  ('futsal','pivot','Pivô','PV',40),
  -- Basketball
  ('basketball','point_guard','Point guard','PG',10),
  ('basketball','shooting_guard','Shooting guard','SG',20),
  ('basketball','small_forward','Small forward','SF',30),
  ('basketball','power_forward','Power forward','PF',40),
  ('basketball','center','Center','C',50),
  -- Volleyball
  ('volleyball','outside_hitter','Outside hitter','OH',10),
  ('volleyball','middle_blocker','Middle blocker','MB',20),
  ('volleyball','opposite','Opposite','OPP',30),
  ('volleyball','setter','Setter','S',40),
  ('volleyball','libero','Libero','L',50),
  ('volleyball','defensive_specialist','Defensive specialist','DS',60),
  -- Cricket
  ('cricket','batter','Batter','BAT',10),
  ('cricket','bowler','Bowler','BWL',20),
  ('cricket','all_rounder','All-rounder','AR',30),
  ('cricket','wicketkeeper','Wicketkeeper','WK',40),
  -- Tennis
  ('tennis','singles','Singles','S',10),
  ('tennis','doubles','Doubles','D',20),
  -- Wrestling
  ('wrestling','freestyle','Freestyle','FS',10),
  ('wrestling','greco_roman','Greco-Roman','GR',20)
on conflict (sport_code, code) do nothing;


-- =============================================================================
-- 3. STATS CATALOG
-- =============================================================================
create table if not exists public.sport_stats (
  sport_code        text not null references public.sports(code) on delete cascade,
  stat_key          text not null,
  label             text not null,
  unit              text,                                -- 'count', 'minutes', 'percent', 'meters', 'seconds'
  higher_is_better  boolean default true,
  is_aggregate      boolean default false,               -- true for derived stats (avg, percentage)
  sort_order        int default 0,
  primary key (sport_code, stat_key)
);

alter table public.sport_stats enable row level security;
drop policy if exists "Sport stats readable by all" on public.sport_stats;
create policy "Sport stats readable by all" on public.sport_stats for select using (true);
drop policy if exists "Sport stats writable by admin" on public.sport_stats;
create policy "Sport stats writable by admin" on public.sport_stats
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_stats (sport_code, stat_key, label, unit, higher_is_better, sort_order) values
  -- Soccer
  ('soccer','matches_played','Matches','count',true,10),
  ('soccer','minutes_played','Minutes','minutes',true,20),
  ('soccer','goals','Goals','count',true,30),
  ('soccer','assists','Assists','count',true,40),
  ('soccer','shots','Shots','count',true,50),
  ('soccer','shots_on_target','Shots on target','count',true,60),
  ('soccer','passes','Passes','count',true,70),
  ('soccer','tackles','Tackles','count',true,80),
  ('soccer','yellow_cards','Yellow cards','count',false,90),
  ('soccer','red_cards','Red cards','count',false,100),
  ('soccer','clean_sheets','Clean sheets','count',true,110),
  ('soccer','saves','Saves','count',true,120),
  -- Basketball
  ('basketball','matches_played','Games','count',true,10),
  ('basketball','minutes_played','Minutes','minutes',true,20),
  ('basketball','points','Points','count',true,30),
  ('basketball','rebounds','Rebounds','count',true,40),
  ('basketball','assists','Assists','count',true,50),
  ('basketball','steals','Steals','count',true,60),
  ('basketball','blocks','Blocks','count',true,70),
  ('basketball','turnovers','Turnovers','count',false,80),
  ('basketball','fouls','Fouls','count',false,90),
  ('basketball','field_goals_made','FG made','count',true,100),
  ('basketball','field_goals_attempted','FG att','count',true,110),
  ('basketball','three_pointers_made','3PT made','count',true,120),
  ('basketball','free_throws_made','FT made','count',true,130),
  -- Volleyball
  ('volleyball','matches_played','Matches','count',true,10),
  ('volleyball','sets_played','Sets','count',true,20),
  ('volleyball','kills','Kills','count',true,30),
  ('volleyball','attack_errors','Attack errors','count',false,40),
  ('volleyball','blocks_solo','Solo blocks','count',true,50),
  ('volleyball','blocks_assist','Block assists','count',true,60),
  ('volleyball','digs','Digs','count',true,70),
  ('volleyball','aces','Aces','count',true,80),
  ('volleyball','service_errors','Service errors','count',false,90),
  ('volleyball','reception_errors','Reception errors','count',false,100),
  -- Cricket
  ('cricket','matches_played','Matches','count',true,10),
  ('cricket','runs','Runs','count',true,20),
  ('cricket','balls_faced','Balls faced','count',true,30),
  ('cricket','fours','Fours','count',true,40),
  ('cricket','sixes','Sixes','count',true,50),
  ('cricket','wickets','Wickets','count',true,60),
  ('cricket','overs_bowled','Overs bowled','count',true,70),
  ('cricket','catches','Catches','count',true,80),
  -- Tennis
  ('tennis','matches_played','Matches','count',true,10),
  ('tennis','matches_won','Wins','count',true,20),
  ('tennis','sets_won','Sets won','count',true,30),
  ('tennis','games_won','Games won','count',true,40),
  ('tennis','aces','Aces','count',true,50),
  ('tennis','double_faults','Double faults','count',false,60),
  ('tennis','first_serve_pct','1st serve %','percent',true,70),
  ('tennis','breakpoints_won','Break points won','count',true,80)
on conflict (sport_code, stat_key) do nothing;


-- =============================================================================
-- 4. MATCH FORMATS
-- =============================================================================
create table if not exists public.sport_match_formats (
  code              text primary key,                  -- 'soccer-90', 'basketball-fiba'
  sport_code        text not null references public.sports(code) on delete cascade,
  label             text not null,
  period_count      int default 2,                     -- halves / quarters / sets
  period_label      text default 'half',               -- 'half','quarter','set','round','innings','frame'
  period_minutes    int,                               -- null for sets-based
  scoring_rule      text,                              -- 'goals','points','sets','runs'
  best_of           int,                               -- for tennis-style: best-of-3 / best-of-5
  notes             text
);

alter table public.sport_match_formats enable row level security;
drop policy if exists "Match formats readable by all" on public.sport_match_formats;
create policy "Match formats readable by all" on public.sport_match_formats for select using (true);
drop policy if exists "Match formats writable by admin" on public.sport_match_formats;
create policy "Match formats writable by admin" on public.sport_match_formats
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_match_formats (code, sport_code, label, period_count, period_label, period_minutes, scoring_rule, best_of, notes) values
  ('soccer-90',         'soccer',       'Standard 90 min',           2, 'half',     45, 'goals',  null, '2x45 with extra time + penalties as needed'),
  ('soccer-80',         'soccer',       'Youth 80 min',              2, 'half',     40, 'goals',  null, null),
  ('futsal-40',         'futsal',       'Standard 40 min',           2, 'half',     20, 'goals',  null, null),
  ('basketball-nba',    'basketball',   'NBA (4x12)',                4, 'quarter',  12, 'points', null, null),
  ('basketball-fiba',   'basketball',   'FIBA (4x10)',               4, 'quarter',  10, 'points', null, null),
  ('basketball-3x3',    'basketball',   '3x3 (10 min or 21)',        1, 'period',   10, 'points', null, null),
  ('volleyball-bo5',    'volleyball',   'Best of 5 sets to 25',      5, 'set',      null,'sets',   3,    null),
  ('cricket-t20',       'cricket',      'T20 (20 overs)',            2, 'innings',  null,'runs',   null, null),
  ('cricket-odi',       'cricket',      'ODI (50 overs)',            2, 'innings',  null,'runs',   null, null),
  ('cricket-t10',       'cricket',      'T10 (10 overs)',            2, 'innings',  null,'runs',   null, null),
  ('tennis-bo3',        'tennis',       'Best of 3 sets',            3, 'set',      null,'sets',   2,    null),
  ('tennis-bo5',        'tennis',       'Best of 5 sets',            5, 'set',      null,'sets',   3,    null),
  ('tabletennis-bo5',   'table_tennis', 'Best of 5 (to 11)',         5, 'set',      null,'sets',   3,    null),
  ('badminton-bo3',     'badminton',    'Best of 3 (to 21)',         3, 'set',      null,'sets',   2,    null),
  ('bowling-frames',    'bowling',      '10 frames',                 10, 'frame',   null,'pins',   null, null),
  ('wrestling-3rd',     'wrestling',    'Two periods, 3-min',        2, 'period',   3,   'points', null, null),
  ('boxing-3rd',        'boxing',       'Three rounds, 3-min',       3, 'round',    3,   'points', null, null),
  ('chess-classic',     'chess',        'Classical',                 1, 'period',   null,'points', null, null)
on conflict (code) do nothing;


-- =============================================================================
-- 5. MATCH EVENT TYPES (timeline of what happens during a match)
-- =============================================================================
create table if not exists public.sport_match_event_types (
  sport_code   text not null references public.sports(code) on delete cascade,
  code         text not null,                         -- 'goal', 'foul', 'sub', 'ace', 'set_won'
  label        text not null,
  points_delta int default 0,                         -- if non-zero, applies to score
  is_negative  boolean default false,                 -- yellow/red cards / faults
  sort_order   int default 0,
  primary key (sport_code, code)
);

alter table public.sport_match_event_types enable row level security;
drop policy if exists "Match event types readable by all" on public.sport_match_event_types;
create policy "Match event types readable by all" on public.sport_match_event_types for select using (true);
drop policy if exists "Match event types writable by admin" on public.sport_match_event_types;
create policy "Match event types writable by admin" on public.sport_match_event_types
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

insert into public.sport_match_event_types (sport_code, code, label, points_delta, is_negative, sort_order) values
  -- Soccer
  ('soccer','kickoff','Kick-off',0,false,10),
  ('soccer','goal','Goal',1,false,20),
  ('soccer','own_goal','Own goal',1,false,30),
  ('soccer','penalty','Penalty',1,false,40),
  ('soccer','penalty_missed','Penalty missed',0,true,50),
  ('soccer','yellow_card','Yellow card',0,true,60),
  ('soccer','red_card','Red card',0,true,70),
  ('soccer','substitution','Substitution',0,false,80),
  ('soccer','half_time','Half-time',0,false,90),
  ('soccer','full_time','Full-time',0,false,100),
  -- Basketball
  ('basketball','field_goal_2','2-point FG',2,false,10),
  ('basketball','field_goal_3','3-point FG',3,false,20),
  ('basketball','free_throw','Free throw',1,false,30),
  ('basketball','foul','Foul',0,true,40),
  ('basketball','technical_foul','Technical foul',0,true,50),
  ('basketball','substitution','Substitution',0,false,60),
  ('basketball','timeout','Timeout',0,false,70),
  -- Volleyball
  ('volleyball','point','Point',1,false,10),
  ('volleyball','ace','Ace',1,false,20),
  ('volleyball','service_error','Service error',0,true,30),
  ('volleyball','set_won','Set won',0,false,40),
  -- Cricket
  ('cricket','run','Run',0,false,10),
  ('cricket','four','Four',4,false,20),
  ('cricket','six','Six',6,false,30),
  ('cricket','wicket','Wicket',0,false,40),
  ('cricket','wide','Wide',1,true,50),
  ('cricket','no_ball','No-ball',1,true,60),
  -- Tennis
  ('tennis','game_won','Game won',0,false,10),
  ('tennis','set_won','Set won',0,false,20),
  ('tennis','ace','Ace',1,false,30),
  ('tennis','double_fault','Double fault',0,true,40),
  ('tennis','break_of_serve','Break of serve',0,false,50)
on conflict (sport_code, code) do nothing;


-- =============================================================================
-- 6. MATCH EVENTS (instances on actual matches)
-- =============================================================================
-- Adds a timeline of events for any match. The match table already exists
-- (from 011); we add an events table linked to it.
create table if not exists public.match_events (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  sport_code   text not null references public.sports(code),
  event_code   text not null,                              -- references sport_match_event_types(code)
  team_id      uuid references public.teams(id) on delete set null,
  player_id    uuid references public.profiles(id) on delete set null,
  assist_player_id uuid references public.profiles(id) on delete set null,
  minute       int,                                        -- 0-90+ for soccer; null for sports without clock
  period       int,                                        -- 1, 2, 3, 4 …
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now()
);

create index if not exists match_events_match_idx  on public.match_events (match_id, period, minute);
create index if not exists match_events_player_idx on public.match_events (player_id);
create index if not exists match_events_sport_idx  on public.match_events (sport_code);

alter table public.match_events enable row level security;
drop policy if exists "Match events readable by all" on public.match_events;
create policy "Match events readable by all" on public.match_events for select using (true);
drop policy if exists "Match events writable by team manager or admin" on public.match_events;
create policy "Match events writable by team manager or admin" on public.match_events
  for all using (
    exists (
      select 1 from public.team_members tm
       where tm.team_id = match_events.team_id
         and tm.player_id = auth.uid()
         and tm.role in ('manager','captain','coach','vice_captain')
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
