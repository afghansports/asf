/**
 * Idempotent seed runner. Fills the new tables (feature_flags, federations,
 * clubs, sports definitions, chapters, profile_roles) when the migrations
 * created them but their seed inserts didn't land. Safe to re-run.
 *
 * Run from project root:  node scripts/seed-all.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function log(label, result) {
  if (result.error) console.error(`  ✗ ${label}:`, result.error.message);
  else console.log(`  ✓ ${label}`);
}

// ---------------------------- FEATURE FLAGS ----------------------------
const FLAGS = [
  ["module.signup",          "Sign-up open",          "New users can register accounts.",                   "core",   true],
  ["module.oauth.google",    "Google OAuth",          "Allow signing in with a Google account.",            "core",   true],
  ["module.mfa",             "Two-factor auth",       "TOTP authenticator app for accounts.",                "core",   true],
  ["module.profile.edit",    "Profile editing",       "Users can edit their profile.",                       "core",   true],
  ["module.follow",          "Following",             "Follow / unfollow users and teams.",                  "social", true],
  ["module.dm",              "Direct messages",       "1:1 and group direct messages.",                      "social", true],
  ["module.dm.requests",     "Message requests",      "Strangers can send message requests.",                "social", true],
  ["module.dm.groups",       "Group DMs",             "Multi-party direct messages.",                        "social", true],
  ["module.notifications",   "Notifications",         "In-app notifications.",                               "social", true],
  ["module.push",            "Web push",              "Browser push notifications.",                         "social", true],
  ["module.mentions",        "Mentions",              "Parse and link @mentions in posts.",                  "social", true],
  ["module.hashtags",        "Hashtags",              "Parse and link #hashtags + follow tags.",             "social", true],
  ["module.bookmarks",       "Bookmarks",             "Save posts / reels for later.",                       "social", true],
  ["module.reels",           "Reels",                 "Vertical video reel feed.",                           "content",true],
  ["module.reels.upload",    "Reel upload",           "Members can upload new reels.",                       "content",true],
  ["module.polls",           "Polls",                 "Create and vote in community polls.",                 "content",true],
  ["module.gallery",         "Gallery",               "Photo gallery.",                                       "content",true],
  ["module.news",            "News",                  "News articles.",                                       "content",true],
  ["module.sponsors",        "Sponsors",              "Sponsor showcase.",                                    "content",true],
  ["module.events",          "Events",                "Event calendar + RSVPs.",                              "content",true],
  ["module.events.create",   "Event creation",        "Members can submit events for approval.",             "content",true],
  ["module.matches",         "Matches",               "Match schedule + results.",                            "content",true],
  ["module.tournaments",     "Tournaments",           "Tournament hosting + brackets.",                       "content",true],
  ["module.leaderboards",    "Leaderboards",          "Top scorers and stat rankings.",                       "content",true],
  ["module.free_agents",     "Free agents",           "Free agent listing board.",                            "content",true],
  ["module.achievements",    "Achievements",          "Earn and display achievement badges.",                 "content",true],
  ["module.search",          "Search",                "Global search.",                                       "content",true],
  ["module.federations",     "Federations",           "Top-level federation entities.",                       "core",   true],
  ["module.chapters",        "Chapters",              "Regional chapters.",                                   "core",   true],
  ["module.clubs",           "Clubs",                 "Multi-team clubs.",                                    "core",   true],
  ["module.teams",           "Teams",                 "Teams (rosters + matches).",                           "core",   true],
  ["module.teams.create",    "Team creation",         "Members can start new teams.",                         "core",   true],
  ["module.reports",         "Reports",               "User-submitted content reports.",                      "safety", true],
  ["module.blocks",          "Block users",           "Block and mute other users.",                          "safety", true],
  ["module.appeals",         "Appeals",               "Members can appeal moderation actions.",               "safety", true],
  ["module.parental_consent","Parental consent",      "Under-16 accounts require guardian consent.",          "safety", true],
  ["module.gdpr.export",     "GDPR data export",      "Users can download all their data.",                   "safety", true],
  ["module.gdpr.delete",     "Account deletion",      "Users can soft-delete their account.",                 "safety", true],
  ["module.mux",             "Mux video",             "Use Mux for video ingest.",                            "integration", false],
  ["module.cdn.cloudflare",  "Cloudflare CDN",        "Route media through Cloudflare.",                      "integration", false],
  ["module.sentry",          "Sentry",                "Send errors to Sentry.",                               "integration", false],
  ["module.plausible",       "Plausible analytics",   "Cookieless analytics.",                                "integration", true],
  ["module.external_sports", "External sports feed",  "Pull pro fixtures + news from public APIs.",           "integration", true],
  ["module.payments",        "Payments",              "Stripe payments for events + memberships.",            "monetization", false],
  ["module.donations",       "Donations",             "Accept donations.",                                    "monetization", false],
  ["module.merch",           "Merchandise",           "Team and federation merch shop.",                      "monetization", false],
  ["module.locale.fa_AF",    "Dari",                  "Show Dari language option.",                           "core",   true],
  ["module.locale.ps",       "Pashto",                "Show Pashto language option.",                         "core",   true],
];

async function seedFeatureFlags() {
  const rows = FLAGS.map(([key, label, description, category, enabled]) => ({
    key, label, description, category, is_enabled: enabled, default_value: enabled,
  }));
  return sb.from("feature_flags").upsert(rows, { onConflict: "key", ignoreDuplicates: false });
}

// ---------------------------- SPORTS ----------------------------
const SPORTS = [
  ["soccer",       "Soccer",        "team",       true,  "soccer-90",          "⚽", 10],
  ["futsal",       "Futsal",        "team",       true,  "futsal-40",          "⚽", 20],
  ["basketball",   "Basketball",    "team",       true,  "basketball-fiba",    "🏀", 30],
  ["volleyball",   "Volleyball",    "team",       true,  "volleyball-bo5",     "🏐", 40],
  ["cricket",      "Cricket",       "team",       true,  "cricket-t20",        "🏏", 50],
  ["tennis",       "Tennis",        "racket",     false, "tennis-bo3",         "🎾", 60],
  ["table_tennis", "Table tennis",  "racket",     false, "tabletennis-bo5",    "🏓", 70],
  ["badminton",    "Badminton",     "racket",     false, "badminton-bo3",      "🏸", 80],
  ["bowling",      "Bowling",       "individual", false, "bowling-frames",     "🎳", 90],
  ["wrestling",    "Wrestling",     "combat",     false, "wrestling-3rd",      "🤼", 100],
  ["boxing",       "Boxing",        "combat",     false, "boxing-3rd",         "🥊", 110],
  ["athletics",    "Athletics",     "track",      false, null,                  "🏃", 120],
  ["chess",        "Chess",         "board",      false, "chess-classic",      "♟️", 130],
];

async function seedSports() {
  const rows = SPORTS.map(([code, name, category, is_team_sport, default_format, emoji, sort_order]) => ({
    code, name, category, is_team_sport, default_format, emoji, sort_order, is_active: true,
  }));
  return sb.from("sports").upsert(rows, { onConflict: "code" });
}

const POSITIONS = [
  ["soccer","goalkeeper","Goalkeeper","GK",10],
  ["soccer","center_back","Centre back","CB",20],
  ["soccer","full_back","Full back","FB",30],
  ["soccer","def_mid","Defensive midfielder","DM",40],
  ["soccer","center_mid","Central midfielder","CM",50],
  ["soccer","att_mid","Attacking midfielder","AM",60],
  ["soccer","winger","Winger","W",70],
  ["soccer","striker","Striker","ST",80],
  ["futsal","goalkeeper","Goalkeeper","GK",10],
  ["futsal","defender","Fixo","FX",20],
  ["futsal","wing","Ala","AL",30],
  ["futsal","pivot","Pivô","PV",40],
  ["basketball","point_guard","Point guard","PG",10],
  ["basketball","shooting_guard","Shooting guard","SG",20],
  ["basketball","small_forward","Small forward","SF",30],
  ["basketball","power_forward","Power forward","PF",40],
  ["basketball","center","Center","C",50],
  ["volleyball","outside_hitter","Outside hitter","OH",10],
  ["volleyball","middle_blocker","Middle blocker","MB",20],
  ["volleyball","opposite","Opposite","OPP",30],
  ["volleyball","setter","Setter","S",40],
  ["volleyball","libero","Libero","L",50],
  ["cricket","batter","Batter","BAT",10],
  ["cricket","bowler","Bowler","BWL",20],
  ["cricket","all_rounder","All-rounder","AR",30],
  ["cricket","wicketkeeper","Wicketkeeper","WK",40],
  ["tennis","singles","Singles","S",10],
  ["tennis","doubles","Doubles","D",20],
];

async function seedPositions() {
  const rows = POSITIONS.map(([sport_code, code, name, abbrev, sort_order]) => ({
    sport_code, code, name, abbrev, sort_order,
  }));
  return sb.from("sport_positions").upsert(rows, { onConflict: "sport_code,code" });
}

const STATS = [
  ["soccer","matches_played","Matches","count",true,10],
  ["soccer","minutes_played","Minutes","minutes",true,20],
  ["soccer","goals","Goals","count",true,30],
  ["soccer","assists","Assists","count",true,40],
  ["soccer","yellow_cards","Yellow cards","count",false,90],
  ["soccer","red_cards","Red cards","count",false,100],
  ["soccer","clean_sheets","Clean sheets","count",true,110],
  ["soccer","saves","Saves","count",true,120],
  ["basketball","matches_played","Games","count",true,10],
  ["basketball","points","Points","count",true,30],
  ["basketball","rebounds","Rebounds","count",true,40],
  ["basketball","assists","Assists","count",true,50],
  ["basketball","steals","Steals","count",true,60],
  ["basketball","blocks","Blocks","count",true,70],
  ["volleyball","matches_played","Matches","count",true,10],
  ["volleyball","kills","Kills","count",true,30],
  ["volleyball","digs","Digs","count",true,70],
  ["volleyball","aces","Aces","count",true,80],
  ["cricket","matches_played","Matches","count",true,10],
  ["cricket","runs","Runs","count",true,20],
  ["cricket","wickets","Wickets","count",true,60],
  ["tennis","matches_played","Matches","count",true,10],
  ["tennis","aces","Aces","count",true,50],
];

async function seedStats() {
  const rows = STATS.map(([sport_code, stat_key, label, unit, higher_is_better, sort_order]) => ({
    sport_code, stat_key, label, unit, higher_is_better, sort_order,
  }));
  return sb.from("sport_stats").upsert(rows, { onConflict: "sport_code,stat_key" });
}

const FORMATS = [
  ["soccer-90",        "soccer",       "Standard 90 min",        2, "half",    45, "goals",  null],
  ["futsal-40",        "futsal",       "Standard 40 min",        2, "half",    20, "goals",  null],
  ["basketball-fiba",  "basketball",   "FIBA (4x10)",            4, "quarter", 10, "points", null],
  ["basketball-nba",   "basketball",   "NBA (4x12)",             4, "quarter", 12, "points", null],
  ["volleyball-bo5",   "volleyball",   "Best of 5 sets to 25",   5, "set",     null,"sets",   3],
  ["cricket-t20",      "cricket",      "T20 (20 overs)",         2, "innings", null,"runs",   null],
  ["tennis-bo3",       "tennis",       "Best of 3 sets",         3, "set",     null,"sets",   2],
  ["tabletennis-bo5",  "table_tennis", "Best of 5 (to 11)",      5, "set",     null,"sets",   3],
  ["badminton-bo3",    "badminton",    "Best of 3 (to 21)",      3, "set",     null,"sets",   2],
  ["bowling-frames",   "bowling",      "10 frames",              10,"frame",   null,"pins",   null],
  ["wrestling-3rd",    "wrestling",    "Two periods, 3-min",     2, "period",  3,  "points", null],
  ["boxing-3rd",       "boxing",       "Three rounds, 3-min",    3, "round",   3,  "points", null],
  ["chess-classic",    "chess",        "Classical",              1, "period",  null,"points", null],
];

async function seedFormats() {
  const rows = FORMATS.map(([code, sport_code, label, period_count, period_label, period_minutes, scoring_rule, best_of]) => ({
    code, sport_code, label, period_count, period_label, period_minutes, scoring_rule, best_of,
  }));
  return sb.from("sport_match_formats").upsert(rows, { onConflict: "code" });
}

// ---------------------------- FEDERATIONS + CHAPTERS + CLUBS ----------------------------
async function seedHierarchy() {
  // Federation
  const fedUpsert = await sb.from("federations").upsert(
    [{
      slug: "asf",
      name: "Afghan Sports Federation",
      short_name: "ASF",
      description: "The global federation connecting Afghan athletes, teams, and chapters across the diaspora. Founded 1998.",
      scope: "global",
      country_code: null,
      founded_year: 1998,
      is_active: true,
    }],
    { onConflict: "slug" },
  ).select("id, slug");
  if (fedUpsert.error) return fedUpsert;
  const asfId = fedUpsert.data?.[0]?.id;
  if (!asfId) return { error: { message: "no federation id returned" } };

  // National chapters
  const NATIONAL = [
    ["asf-usa",       "ASF USA",       "US", 1998],
    ["asf-germany",   "ASF Germany",   "DE", 2002],
    ["asf-canada",    "ASF Canada",    "CA", 2004],
    ["asf-uk",        "ASF UK",        "GB", 2008],
    ["asf-australia", "ASF Australia", "AU", 2010],
  ];
  const natRows = NATIONAL.map(([slug, name, country_code, founded_year]) => ({
    slug, name, country_code, federation_id: asfId, tier: "national",
    is_active: true, founded_year,
  }));
  const natRes = await sb.from("chapters").upsert(natRows, { onConflict: "slug" });
  if (natRes.error) return natRes;

  // Look up national IDs to seed regional children
  const chRefs = await sb.from("chapters").select("id, slug").in("slug", NATIONAL.map((n) => n[0]));
  if (chRefs.error) return chRefs;
  const bySlug = Object.fromEntries((chRefs.data ?? []).map((c) => [c.slug, c.id]));

  const REGIONAL = [
    ["asf-bay-area",          "ASF Bay Area",          "US", "CA",  bySlug["asf-usa"]],
    ["asf-northern-virginia", "ASF Northern Virginia", "US", "VA",  bySlug["asf-usa"]],
    ["asf-toronto",           "ASF Toronto",           "CA", "ON",  bySlug["asf-canada"]],
    ["asf-hamburg",           "ASF Hamburg",           "DE", null,  bySlug["asf-germany"]],
    ["asf-frankfurt",         "ASF Frankfurt",         "DE", null,  bySlug["asf-germany"]],
    ["asf-london",            "ASF London",            "GB", null,  bySlug["asf-uk"]],
    ["asf-sydney",            "ASF Sydney",            "AU", "NSW", bySlug["asf-australia"]],
  ];
  const regRows = REGIONAL.map(([slug, name, country_code, state_province, parent_chapter_id]) => ({
    slug, name, country_code, state_province, parent_chapter_id,
    federation_id: asfId, tier: "regional", is_active: true,
  }));
  const regRes = await sb.from("chapters").upsert(regRows, { onConflict: "slug" });
  if (regRes.error) return regRes;

  // Clubs (one per regional chapter)
  const allCh = await sb.from("chapters").select("id, slug");
  const chById = Object.fromEntries((allCh.data ?? []).map((c) => [c.slug, c.id]));
  const CLUBS = [
    ["khorasan-fc-fremont",      "Khorasan FC",      "Khorasan FC", "asf-bay-area",          "US", "CA", "Fremont", 2005,
      "Senior soccer club rooted in the Bay Area diaspora since 2005."],
    ["hindukush-united-toronto", "Hindukush United", "Hindukush",   "asf-toronto",           "CA", "ON", "Toronto", 2010,
      "Multi-sport club operating soccer, futsal, and volleyball programs across the GTA."],
    ["pamir-sc-hamburg",         "Pamir SC",         "Pamir SC",    "asf-hamburg",           "DE", null, "Hamburg", 2007,
      "Hamburg-based community club known for its youth pathways."],
    ["kabul-athletic-london",    "Kabul Athletic",   "Kabul AC",    "asf-london",            "GB", null, "London",  2012,
      "London-based club with senior and women's sides competing in regional leagues."],
    ["koh-e-noor-sydney",        "Koh-e-Noor Sports","Koh-e-Noor",  "asf-sydney",            "AU", "NSW","Sydney",  2014,
      "Cricket-focused club running senior and junior programs in greater Sydney."],
  ];
  const clubRows = CLUBS.map(([slug, name, short_name, chapter_slug, country_code, state_province, city, founded_year, description]) => ({
    slug, name, short_name, chapter_id: chById[chapter_slug], federation_id: asfId,
    country_code, state_province, city, founded_year, description, is_active: true,
  }));
  return sb.from("clubs").upsert(clubRows, { onConflict: "slug" });
}

// ---------------------------- BACKFILL profile_roles ----------------------------
async function backfillRoles() {
  const profiles = await sb.from("profiles").select("id");
  if (profiles.error) return profiles;
  if (!profiles.data || profiles.data.length === 0) return { error: null };
  const rows = profiles.data.map((p) => ({
    profile_id: p.id, kind: "user", status: "active", is_primary: true,
  }));
  return sb.from("profile_roles").upsert(rows, { onConflict: "profile_id,kind" });
}

// ---------------------------- RUN ----------------------------
console.log("Seeding...");
log("feature_flags", await seedFeatureFlags());
log("sports",        await seedSports());
log("positions",     await seedPositions());
log("stats",         await seedStats());
log("match formats", await seedFormats());
log("federations + chapters + clubs", await seedHierarchy());
log("backfill profile_roles", await backfillRoles());

console.log("\nFinal counts:");
for (const t of ["feature_flags","sports","sport_positions","sport_stats","sport_match_formats","federations","chapters","clubs","profile_roles"]) {
  const { count } = await sb.from(t).select("*", { count: "exact", head: true });
  console.log(`  ${t}: ${count ?? 0}`);
}
console.log("\nDone.");
