/**
 * Mega demo seed. Creates a populated, realistic-looking platform.
 *
 * 100 users (Afghan diaspora names across 25 cities)
 * 25 teams (5 sports, 5 countries, rosters of 6-12)
 * 60+ events  · 60+ news articles · 30+ polls (with options + votes)
 * 80+ reels (mix of file URLs + REAL sport YouTube ids: soccer, basketball,
 *             cricket, volleyball, tennis highlights)
 * 50+ matches (past + upcoming, confirmed + scheduled)
 * 70+ discussion threads + ~400 replies + 800+ reel likes + 600+ follows
 * 150+ reel comments
 *
 * Triggers from migration 023 automatically write each insert to wall_posts.
 *
 * Run:  node scripts/seed-demo.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// =============================================================================
// CONTENT POOLS
// =============================================================================

const FIRST = [
  "Ahmad","Mohammad","Ali","Hassan","Hussain","Khalid","Rashid","Faisal","Hamid","Karim",
  "Najib","Omar","Rahim","Sami","Tariq","Wahid","Yousuf","Zahir","Bilal","Junaid",
  "Mustafa","Nasir","Sayed","Habib","Jamil","Latif","Nadir","Qais","Reza","Shahid",
  "Abdul","Ihsan","Naveed","Sohail","Adel","Imran","Murad","Roshan","Wali","Salim",
  "Fariba","Lida","Maryam","Nargis","Parisa","Roya","Sara","Zahra","Diba","Farida",
  "Habiba","Khadija","Laila","Mahnaz","Nilofar","Parwana","Roshan","Shabnam","Tahmina","Yasmin",
  "Adela","Bahar","Fatima","Gulalai","Hila","Iman","Jamila","Lema","Mahbouba","Nasreen",
];

const LAST = [
  "Karzai","Ghani","Massoud","Khan","Hekmatyar","Rasul","Atmar","Stanikzai","Wardak","Noori",
  "Faizi","Sherzai","Ahmadi","Jalali","Saleh","Daoudzai","Akhundzada","Wahidi","Mohaqiq","Halim",
  "Hashimi","Mirwais","Yousufzai","Pashtun","Hazara","Tajik","Uzbek","Baluchi","Nuristani","Aimaq",
  "Rahmani","Sharifi","Ibrahimi","Maiwandi","Niazi","Popalzai","Safi","Tareen","Kakar","Mangal",
  "Faqiri","Habibi","Mojadidi","Rahimi","Sarwary","Sediqi","Tokhi","Wakil","Yari","Zaheer",
];

const CITIES = [
  { city: "Fremont",        state: "CA",   country: "US", chapter: "asf-bay-area" },
  { city: "Hayward",        state: "CA",   country: "US", chapter: "asf-bay-area" },
  { city: "Sacramento",     state: "CA",   country: "US", chapter: "asf-bay-area" },
  { city: "San Jose",       state: "CA",   country: "US", chapter: "asf-bay-area" },
  { city: "Alexandria",     state: "VA",   country: "US", chapter: "asf-northern-virginia" },
  { city: "Fairfax",        state: "VA",   country: "US", chapter: "asf-northern-virginia" },
  { city: "Sterling",       state: "VA",   country: "US", chapter: "asf-northern-virginia" },
  { city: "Silver Spring",  state: "MD",   country: "US", chapter: "asf-northern-virginia" },
  { city: "Houston",        state: "TX",   country: "US", chapter: "asf-usa" },
  { city: "Toronto",        state: "ON",   country: "CA", chapter: "asf-toronto" },
  { city: "Mississauga",    state: "ON",   country: "CA", chapter: "asf-toronto" },
  { city: "Brampton",       state: "ON",   country: "CA", chapter: "asf-toronto" },
  { city: "Vancouver",      state: "BC",   country: "CA", chapter: "asf-canada" },
  { city: "Hamburg",        state: null,   country: "DE", chapter: "asf-hamburg" },
  { city: "Frankfurt",      state: null,   country: "DE", chapter: "asf-frankfurt" },
  { city: "Berlin",         state: null,   country: "DE", chapter: "asf-germany" },
  { city: "Munich",         state: null,   country: "DE", chapter: "asf-germany" },
  { city: "London",         state: null,   country: "GB", chapter: "asf-london" },
  { city: "Manchester",     state: null,   country: "GB", chapter: "asf-uk" },
  { city: "Sydney",         state: "NSW",  country: "AU", chapter: "asf-sydney" },
  { city: "Melbourne",      state: "VIC",  country: "AU", chapter: "asf-australia" },
  { city: "Stockholm",      state: null,   country: "SE", chapter: null },
  { city: "Oslo",           state: null,   country: "NO", chapter: null },
  { city: "The Hague",      state: null,   country: "NL", chapter: null },
  { city: "Vienna",         state: null,   country: "AT", chapter: null },
];

const SPORTS = ["soccer","futsal","basketball","volleyball","cricket","tennis","table_tennis"];

const POSITIONS = {
  soccer:      ["goalkeeper","center_back","full_back","def_mid","center_mid","att_mid","winger","striker"],
  futsal:      ["goalkeeper","defender","wing","pivot"],
  basketball:  ["point_guard","shooting_guard","small_forward","power_forward","center"],
  volleyball:  ["outside_hitter","middle_blocker","opposite","setter","libero"],
  cricket:     ["batter","bowler","all_rounder","wicketkeeper"],
  tennis:      ["singles","doubles"],
  table_tennis:["singles","doubles"],
};

// Real CC0 / royalty-free sport video clips
const SAMPLE_VIDEOS = [
  "https://cdn.pixabay.com/video/2024/06/12/216138_large.mp4",
  "https://cdn.pixabay.com/video/2024/05/03/210010_large.mp4",
  "https://cdn.pixabay.com/video/2022/03/29/112577-696167587_large.mp4",
  "https://cdn.pixabay.com/video/2020/03/10/33134-397142724_large.mp4",
  "https://cdn.pixabay.com/video/2021/09/30/89685-625810099_large.mp4",
  "https://cdn.pixabay.com/video/2024/04/02/206406_large.mp4",
  "https://cdn.pixabay.com/video/2023/04/26/160861-820831043_large.mp4",
  "https://cdn.pixabay.com/video/2021/04/15/70583-538102375_large.mp4",
];

// Real sport YouTube highlight reels (short, public, embed-friendly)
// Mixed: pro highlights, skills, training. Each entry is { id, sport, caption }.
const YT_REELS = [
  { id: "5fkh4eThlcM", sport: "soccer",     caption: "Top 10 Premier League goals of the season. Best strike at 1:42." },
  { id: "fEM5z-Q2Z2k", sport: "soccer",     caption: "Free-kick masterclass. Watch the run-up." },
  { id: "0WBgFEHWUSE", sport: "soccer",     caption: "Best dribbles compilation. Skill move at 0:35 is unreal." },
  { id: "F0PUWfsPgkk", sport: "basketball", caption: "Top 50 NBA dunks of all time." },
  { id: "Hgt2WIDuIxc", sport: "basketball", caption: "Crossover compilation. The hesi at 2:10." },
  { id: "ZyhrYis509A", sport: "basketball", caption: "Step-back jumpers — Curry, Doncic, Tatum." },
  { id: "qD5UFEukcCY", sport: "cricket",    caption: "Best T20 sixes of 2024. Massive." },
  { id: "RJ_Da5pUjbU", sport: "cricket",    caption: "Yorker compilation — perfect line and length." },
  { id: "iAKQHd4QwGo", sport: "volleyball", caption: "Best spikes in international volleyball." },
  { id: "FN5LZ7Pkk2s", sport: "volleyball", caption: "Libero saves — incredible defense." },
  { id: "9MyhU5gpQbk", sport: "tennis",     caption: "Federer best points in slow motion." },
  { id: "VAW6CmPiBqI", sport: "tennis",     caption: "Djokovic vs Nadal — top 10 rallies." },
  { id: "8h9Fk9DOyZk", sport: "soccer",     caption: "Bicycle kicks. The Ibrahimovic one still hits." },
  { id: "y32hkk0xUC4", sport: "futsal",     caption: "Futsal skills compilation. Touches at 1:15." },
  { id: "VWfqgnzmnEU", sport: "table_tennis", caption: "Crazy table tennis rally — 41 shots." },
  { id: "MZ_jNi9_kPg", sport: "basketball", caption: "Best blocks of the 2024 season." },
  { id: "kF0HM7K4_xY", sport: "soccer",     caption: "Long-range goals — Beckham still the king." },
  { id: "VKxBZTBwklM", sport: "soccer",     caption: "Goalkeeper highlights — saves of the year." },
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
];

// pravatar.cc returns deterministic faces by id 1-70
const avatarUrl = (i) => `https://i.pravatar.cc/200?img=${(i % 70) + 1}`;

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBool(p = 0.5) { return Math.random() < p; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}
function slugify(s) {
  return (s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 80);
}
function shortId() { return Math.random().toString(36).slice(2, 8); }
function daysAgo(d) { return new Date(Date.now() - d * 24 * 60 * 60 * 1000); }
function daysFromNow(d) { return new Date(Date.now() + d * 24 * 60 * 60 * 1000); }

// =============================================================================
// SEEDERS
// =============================================================================

async function checkSchema() {
  console.log("Checking required tables + columns...");
  // The seed only needs these. Other tables (feature_flags, federations, clubs,
  // sports, team_followers, external_*) are optional — we'll skip features
  // that depend on them rather than block the whole seed.
  const required = ["reels","wall_posts","discussions","discussion_replies"];
  const missing = [];
  for (const t of required) {
    const { error } = await sb.from(t).select("*").limit(1);
    if (error) missing.push(`${t} (${error.code})`);
  }
  // Verify migration 022 columns are on reels
  const probeReels = await sb
    .from("reels")
    .insert({
      author_id: "00000000-0000-0000-0000-000000000000",
      video_url: "test", caption: "probe", sport: "soccer",
      country_code: "US", is_published: false,
      video_kind: "file", processing_state: "ready",
    })
    .select("id")
    .single();
  if (probeReels.error?.code === "PGRST204") {
    missing.push("reels.video_kind / reels.processing_state");
  }
  if (missing.length > 0) {
    console.error("\n✗ Missing tables / columns:");
    for (const m of missing) console.error("    - " + m);
    console.error("\n  Paste supabase/migrations/URGENT_FIX.sql in Supabase SQL editor first.\n");
    process.exit(1);
  }
  // Tell the user what's gonna be skipped (optional dependencies).
  const optional = ["feature_flags","federations","clubs","sports","team_followers","external_fixtures"];
  const skipping = [];
  for (const t of optional) {
    const { error } = await sb.from(t).select("*").limit(1);
    if (error) skipping.push(t);
  }
  if (skipping.length > 0) {
    console.log(`  ✓ core tables present (skipping ${skipping.join(", ")})`);
  } else {
    console.log("  ✓ all tables present");
  }
}

async function seedUsers(target = 100) {
  console.log(`\n[users] seeding ${target}...`);
  const { data: existing } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  const haveByEmail = new Map((existing?.users ?? []).map((u) => [u.email, u]));

  const created = [];
  for (let i = 1; i <= target; i++) {
    const idx = i - 1;
    const first = FIRST[idx % FIRST.length];
    const last = LAST[(idx * 7) % LAST.length];
    const username = `${first.toLowerCase()}_${last.toLowerCase()}_${i}`;
    const email = `demo${i.toString().padStart(3, "0")}@asf.example`;
    const fullName = `${first} ${last}`;
    const loc = CITIES[idx % CITIES.length];
    const sport = SPORTS[idx % SPORTS.length];
    const positions = POSITIONS[sport];
    const position = positions ? positions[(idx * 3) % positions.length] : null;
    const isFreeAgent = randomBool(0.18);
    const isPlayer = randomBool(0.78);
    const avatar = avatarUrl(idx);

    let u = haveByEmail.get(email);
    if (!u) {
      const { data, error } = await sb.auth.admin.createUser({
        email,
        password: "demoUserPass123!",
        email_confirm: true,
        user_metadata: { full_name: fullName, username },
      });
      if (error) {
        if (error.message?.includes("already")) {
          const { data: re } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
          u = (re?.users ?? []).find((x) => x.email === email);
        } else { console.warn(`  ! createUser ${email}: ${error.message}`); continue; }
      } else u = data.user;
    }
    if (!u) continue;

    await sb.from("profiles").upsert(
      {
        id: u.id,
        username, full_name: fullName, avatar_url: avatar,
        bio: `${isPlayer ? `Player based in ${loc.city}` : `Member based in ${loc.city}`}. Sport: ${sport}.${isFreeAgent ? " Looking for a team." : ""} Part of the ${loc.country} chapter.`,
        country_code: loc.country, state_province: loc.state, city: loc.city,
        is_player: isPlayer, sport: isPlayer ? sport : null,
        position: isPlayer ? position : null,
        is_free_agent: isFreeAgent, onboarding_completed: true,
      },
      { onConflict: "id" },
    );
    created.push({
      id: u.id, username, fullName, city: loc.city, state: loc.state, country: loc.country,
      sport, position, isPlayer, chapter: loc.chapter,
    });
    if (i % 20 === 0) console.log(`  ${i}/${target}`);
  }
  console.log(`[users] ${created.length} ready.`);
  return created;
}

async function seedTeams(users, target = 25) {
  console.log(`\n[teams] seeding ${target}...`);
  const TEAM_NAMES = [
    "Khorasan Wolves","Hindukush Eagles","Pamir Lions","Kabul Stars","Herat United",
    "Bay Area Storm","NoVA Eagles","Toronto Tigers","Hamburg Falcons","Frankfurt Phoenix",
    "London Snow Leopards","Sydney Buzkashis","Melbourne Mountains","Berlin Bandits","Stockholm Saqis",
    "Mazar Magic","Kandahar Kings","Bamyan Bisons","Balkh Bears","Ghazni Giants",
    "Maryland Marauders","Fairfax Flames","Houston Hawks","Vancouver Vipers","Manchester Massif",
  ];
  const { data: existing } = await sb.from("teams").select("id, slug, name, captain_id, sport, city");
  const haveSlug = new Map((existing ?? []).map((t) => [t.slug, t]));
  const created = [];

  for (let i = 0; i < target; i++) {
    const name = TEAM_NAMES[i % TEAM_NAMES.length] + (i >= TEAM_NAMES.length ? ` ${shortId()}` : "");
    const slug = slugify(name);
    if (haveSlug.has(slug)) { created.push(haveSlug.get(slug)); continue; }

    const captain = rand(users);
    const sport = captain.isPlayer ? captain.sport : rand(SPORTS);
    const { data, error } = await sb.from("teams").insert({
      slug, name, sport,
      country_code: captain.country, state_province: captain.state, city: captain.city,
      description: `${name} — competing in ${sport} since ${2010 + (i % 14)}. Captained from ${captain.city}. ${randomBool() ? "ASF Cup contenders." : "Community-first roster welcoming all skill levels."}`,
      banner_url: rand(SAMPLE_IMAGES),
      captain_id: captain.id,
      founded_year: 2010 + (i % 14),
      is_looking_for_players: randomBool(0.35),
      is_asf_affiliate: randomBool(0.65),
      contact_email: `team${slug}@asf.example`,
    }).select("id, slug, name, captain_id, sport, city").single();
    if (error) { console.warn(`  ! ${slug}: ${error.message}`); continue; }
    created.push(data);

    await sb.from("team_members").upsert(
      { team_id: data.id, player_id: captain.id, role: "captain" },
      { onConflict: "team_id,player_id" },
    );
    const pool = users.filter((u) => u.id !== captain.id && u.isPlayer && u.sport === sport);
    const chosen = pick(pool, randInt(6, 12));
    for (const p of chosen) {
      await sb.from("team_members").upsert(
        { team_id: data.id, player_id: p.id, role: randomBool(0.15) ? "vice_captain" : "player", position: p.position },
        { onConflict: "team_id,player_id" },
      );
    }
  }
  console.log(`[teams] ${created.length} ready.`);
  return created;
}

async function seedEvents(users, teams, target = 60) {
  console.log(`\n[events] seeding ${target}...`);
  const TYPES = ["tournament","match","camp","community","other"];
  const TITLE_FRAGS = [
    "Spring Cup","Summer Showcase","Open Practice","Coaching Clinic","Friendly Match",
    "Community Day","Iftar + Pickup","Youth Camp","Winter Indoor League","Tournament Finals",
    "Try-outs","Skills Workshop","Charity Match","Festival Tournament","Sunday Pickup",
    "Diaspora Cup","Goalkeeper Clinic","Ramadan Tournament","New Year Friendly","Watch Party",
  ];
  const DESCRIPTIONS = [
    "Open to all ASF members. Spectators welcome. Refreshments available on site.",
    "Players + coaches only. Bring water and proper kit.",
    "Family-friendly event. Kids under 12 free. Food trucks on site.",
    "Streamed live on the chapter feed. Limited bleacher seating, arrive early.",
    "Free for chapter members. Registration closes 48h before kickoff.",
    "Charity event — proceeds go to youth scholarship fund.",
    "All ages welcome. Beginner-friendly morning session, advanced in the afternoon.",
  ];
  let count = 0;
  for (let i = 0; i < target; i++) {
    const team = rand(teams);
    const organizer = rand(users);
    const type = rand(TYPES);
    const title = `${rand(TITLE_FRAGS)} — ${team.city ?? "TBD"} ${i + 1}`;
    const slug = slugify(`${title}-${shortId()}`);
    const start = new Date();
    start.setDate(start.getDate() + randInt(-30, 90));
    start.setHours(randInt(9, 19), 0, 0, 0);
    const end = new Date(start.getTime() + randInt(1, 6) * 60 * 60 * 1000);
    const { error } = await sb.from("events").insert({
      slug, title, event_type: type, sport: team.sport,
      description: `${rand(DESCRIPTIONS)} ${rand(DESCRIPTIONS)}`,
      banner_url: rand(SAMPLE_IMAGES),
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      country_code: team.city === "Toronto" ? "CA" : team.city === "Hamburg" ? "DE" : team.city === "London" ? "GB" : team.city === "Sydney" ? "AU" : "US",
      city: team.city ?? "Fremont",
      state_province: team.city === "Fremont" ? "CA" : team.city === "Toronto" ? "ON" : team.city === "Sydney" ? "NSW" : null,
      venue_name: `${team.city ?? "Local"} Sports Centre`,
      organizer_id: organizer.id, organizer_team_id: team.id,
      is_published: true, is_featured: randomBool(0.15), is_free: randomBool(0.55),
    });
    if (!error) count++;
  }
  console.log(`[events] ${count} ready.`);
}

async function seedNews(users, target = 60) {
  console.log(`\n[news] seeding ${target}...`);
  const TOPICS = [
    ["Spring Cup recap", "Goals, dramatic finishes, and the moment of the tournament."],
    ["New chapter opens in Stockholm", "Growing the European network with a fifth Nordic city."],
    ["Youth program expands to Maryland", "More kids, more pitches, more coaches."],
    ["Coaching course graduates 24 new chapter coaches", "A bigger pipeline means stronger sessions everywhere."],
    ["Volunteer drive: sign up for the Cup", "We need 80 volunteers across three days."],
    ["Sponsor renewal: Khorasan Tech extends to 2027", "Three more years of platform infrastructure support."],
    ["Diaspora Trophy results", "Toronto Tigers lift the trophy after a five-goal thriller."],
    ["Community event highlights", "Bay Area iftar drew 600 attendees and raised funds for youth scholarships."],
    ["Player of the month: a hat-trick to remember", "Forward of the year leads the scoring chart."],
    ["Women's league update", "Sign-ups doubled this season — six teams, two divisions."],
    ["Refereeing workshop wraps in Hamburg", "Eighteen new officials qualified for Saturday duty."],
    ["Anti-doping seminar for coaches", "Required annual refresher per ASF safeguarding rules."],
    ["Cup draw announcement", "Sixteen teams, four groups, group stage starts in 30 days."],
    ["International friendly in Frankfurt", "Hamburg vs Berlin — first-ever derby between the two chapters."],
    ["Charity match raises 18,000 EUR", "Funds split between scholarships and equipment."],
    ["Safeguarding policy update for 2026", "Stronger consent flow, faster moderation."],
    ["Live streaming partnership signed", "Mux joining as our streaming provider."],
    ["New club charter: Pamir SC Hamburg", "Senior + youth pathways, women's side launching in spring."],
    ["Free agent board: ten new listings this week", "Goalkeepers in demand across three chapters."],
    ["First-aid certifications open", "Every chapter coach must hold a current certification."],
    ["Mental health resources launched", "Localized hotlines and chapter-level support."],
    ["U-16 Cup results", "Bay Area Storm U-16 takes the title in penalties."],
    ["Stadium booking partnership", "Discounted rates for ASF chapter events nationwide."],
    ["Cricket squad selection for the Cup", "Twenty-two-player squad announced; first XI to follow."],
    ["Volunteer coaches of the year", "Eight long-serving coaches recognized."],
    ["Women's pickup launching Sundays in Toronto", "Open to all skill levels, free for the first month."],
    ["Player transfer window opens", "Mid-season window opens for verified clubs only."],
    ["Spring Classic — registration extended", "One more week to enter; fee waiver requests welcome."],
    ["Volleyball clinic open to the public", "Two-day clinic with FIVB-licensed coaches."],
    ["ASF Cricket Cup 2026 — venues confirmed", "Lord's, Edgbaston, plus two community grounds."],
  ];
  let count = 0;
  for (let i = 0; i < target; i++) {
    const [title, excerpt] = TOPICS[i % TOPICS.length];
    const titleI = i >= TOPICS.length ? `${title} (${i + 1})` : title;
    const slug = slugify(`${titleI}-${shortId()}`);
    const author = rand(users);
    const { error } = await sb.from("news_posts").insert({
      slug, title: titleI, excerpt,
      content: `## ${titleI}\n\n${excerpt}\n\n### What happened\n\n${rand([
        "Across three days, players from twelve chapters competed at a level rarely seen in community-level Afghan sports outside the diaspora.",
        "The event drew families, sponsors, and members from across four countries to a single ground.",
        "Organizers credit the chapter coordinators for delivering a logistics-heavy program on a tight budget.",
        "Live coverage on chapter channels reached over 8,000 viewers — a record for an ASF event.",
      ])}\n\n### Quote of the day\n\n> "${rand([
        "We have been waiting for a moment like this for ten years. The kids deserve this.",
        "When you grow up watching your parents juggle work and weekend coaching, days like today are the payoff.",
        "Half the team didn't even know each other six months ago. Now look at them.",
        "If we can do this in five cities, we can do it in fifty.",
      ])}" — ${rand(FIRST)} ${rand(LAST)}, ${rand(["captain","coach","organizer","chapter manager"])}\n\n### What's next\n\nFollow ASF channels and the chapter newsletters for registration windows and event updates.`,
      image_url: rand(SAMPLE_IMAGES),
      author_id: author.id,
      is_published: true,
      published_at: daysAgo(randInt(0, 90)).toISOString(),
    });
    if (!error) count++;
  }
  console.log(`[news] ${count} ready.`);
}

async function seedPolls(users, teams, target = 30) {
  console.log(`\n[polls] seeding ${target}...`);
  const QUESTIONS = [
    "Who wins the next Cup?",
    "Best Afghan diaspora team this season?",
    "Most exciting sport for youth?",
    "Should ASF host a women's league?",
    "Where should the next national meetup be?",
    "Favorite tournament format?",
    "Add esports to ASF?",
    "Best pickup venue in the Bay Area?",
    "Premier sponsor of 2026?",
    "Which night for weekly pickup — Wed or Fri?",
    "Should chapter dues be 50, 75, or 100 USD?",
    "Best player of the diaspora era?",
    "Should we run a winter indoor league?",
    "Cricket: T20 or T10 for chapter cups?",
    "Volleyball: 6v6 or 4v4 for short fields?",
  ];
  let count = 0;
  for (let i = 0; i < target; i++) {
    const author = rand(users);
    const question = QUESTIONS[i % QUESTIONS.length] + (i >= QUESTIONS.length ? ` (${i})` : "");
    const { data, error } = await sb.from("polls").insert({
      author_id: author.id, question, is_published: true,
      closes_at: daysFromNow(randInt(3, 30)).toISOString(),
    }).select("id").single();
    if (error || !data) continue;
    // 3-5 options
    const optionPool = teams.map((t) => t.name).concat(["Yes — let's do it", "No — focus elsewhere", "Maybe — needs more thought", "Wednesday", "Friday", "50 USD", "75 USD", "100 USD", "T20", "T10", "6v6", "4v4"]);
    const opts = pick(optionPool, randInt(3, 5)).map((label, idx) => ({
      poll_id: data.id, label, sort_order: idx * 10,
    }));
    const optsRes = await sb.from("poll_options").insert(opts).select("id");
    if (optsRes.error) continue;
    const voters = pick(users, randInt(8, 30));
    for (const v of voters) {
      const opt = rand(optsRes.data);
      // Schema is poll_id + user_id (NOT voter_id) — see migration 013.
      await sb.from("poll_votes").upsert(
        { poll_id: data.id, option_id: opt.id, user_id: v.id },
        { onConflict: "poll_id,user_id" },
      );
    }
    count++;
  }
  console.log(`[polls] ${count} ready.`);
}

async function seedReels(users, target = 80) {
  console.log(`\n[reels] seeding ${target}...`);
  const CAPTIONS = [
    "Bay Area training — full-speed warmup before the weekend fixture.",
    "Futsal night highlights from the Hamburg pickup. #futsal",
    "Kids first basketball clinic — proudest moment as a coach.",
    "Volleyball serve receive drills. Working on platform timing.",
    "Cricket nets in London. Big swing connecting — keep an eye on the wrists.",
    "Coach's view, opening match. Watch the back-line shape.",
    "Penalty drill — goalkeeper saves them all. Reflexes are unreal.",
    "3-on-3 streetball, Toronto chapter. Last shot at the buzzer.",
    "Hamburg cricket squad, post-match. Win number 4 in a row.",
    "Friendly match recap — Sydney chapter. Two-goal comeback.",
    "Sunday pickup attendance hit 24 this week. Bring a friend next time.",
    "Goalkeeper distribution drill. Throw vs kick — which is your preference?",
    "Pre-match team talk. Always the most important 5 minutes.",
    "Volleyball setter practice. The hands are everything.",
    "Cricket fielding drills — slip catches.",
  ];
  let count = 0;
  for (let i = 0; i < target; i++) {
    const author = rand(users);
    const useYoutube = i % 3 === 0; // ~33% YouTube
    let videoUrl, thumbUrl, ytId = null, caption;
    if (useYoutube) {
      const yt = rand(YT_REELS);
      ytId = yt.id;
      videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
      thumbUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      caption = yt.caption;
    } else {
      videoUrl = rand(SAMPLE_VIDEOS);
      thumbUrl = rand(SAMPLE_IMAGES);
      caption = rand(CAPTIONS);
    }
    const { error } = await sb.from("reels").insert({
      author_id: author.id,
      video_url: videoUrl, thumbnail_url: thumbUrl,
      youtube_id: ytId, video_kind: useYoutube ? "youtube" : "file",
      caption, sport: author.sport ?? rand(SPORTS),
      country_code: author.country, state_province: author.state,
      is_published: true, processing_state: "ready",
      view_count: randInt(40, 5000), like_count: randInt(0, 350), comment_count: 0,
      created_at: daysAgo(randInt(0, 60)).toISOString(),
    });
    if (!error) count++;
  }
  console.log(`[reels] ${count} ready.`);
}

async function seedReelComments(users, target = 200) {
  console.log(`\n[reel_comments] seeding ${target}...`);
  const { data: reels } = await sb.from("reels").select("id").limit(120);
  if (!reels || reels.length === 0) return;
  const COMMENTS = [
    "Filthy strike, mate. What a connection.",
    "Did anyone clip the assist? That run was unreal.",
    "Need that warm-up routine for our team.",
    "+1 — when's the next session?",
    "Best touch I've seen all season.",
    "Coach, can we do this drill on Sunday?",
    "Bay Area, when are we doing this again?",
    "Forwarded to my U-16 squad — they need to see this.",
    "Bro is built different.",
    "Sets up the volley perfectly.",
    "Body shape on the keeper saving the penalty — chef's kiss.",
    "How long was that rally?? Insane.",
    "More clips from this match please.",
    "Posted to our chapter group, hope you don't mind.",
    "Goal of the season nominee.",
    "What's the playlist intro song?",
    "Toronto chapter representing 🔥",
    "Add me to the lineup next time.",
    "Watching this on repeat.",
    "Anyone else's wifi blame the Pelé bicycle kick comparison? Same energy.",
  ];
  let count = 0;
  for (let i = 0; i < target; i++) {
    const reel = rand(reels);
    const author = rand(users);
    const { error } = await sb.from("reel_comments").insert({
      reel_id: reel.id, author_id: author.id, body: rand(COMMENTS),
      created_at: daysAgo(randInt(0, 30)).toISOString(),
    });
    if (!error) count++;
  }
  console.log(`[reel_comments] ${count} ready.`);
}

async function seedMatches(teams, users, target = 50) {
  console.log(`\n[matches] seeding ${target}...`);
  let count = 0;
  for (let i = 0; i < target; i++) {
    const home = rand(teams);
    let away = rand(teams);
    let tries = 0;
    while (away.id === home.id && tries++ < 5) away = rand(teams);
    if (away.id === home.id) continue;
    const isPast = i < target * 0.65;
    const when = new Date();
    when.setDate(when.getDate() + (isPast ? -randInt(1, 60) : randInt(1, 45)));
    const homeScore = isPast ? randInt(0, 5) : null;
    const awayScore = isPast ? randInt(0, 5) : null;
    const someAdmin = users[0]?.id;
    const { error } = await sb.from("matches").insert({
      sport: home.sport,
      home_team_id: home.id, away_team_id: away.id,
      scheduled_for: when.toISOString(),
      played_at: isPast ? when.toISOString() : null,
      venue: `${home.city ?? "Home"} Sports Centre`,
      city: home.city,
      status: isPast ? "confirmed" : "scheduled",
      home_score: homeScore, away_score: awayScore,
      reported_by: isPast ? rand(users).id : null,
      confirmed_by: isPast ? someAdmin : null,
      reported_at: isPast ? when.toISOString() : null,
      confirmed_at: isPast ? when.toISOString() : null,
      notes: isPast && randomBool(0.4)
        ? rand(["Hat-trick from striker.", "Penalty in the 92nd.", "Clean sheet for the keeper.", "Two reds. Heated game.", "MOTM: midfield general.", "Brace from the captain."])
        : null,
    });
    if (!error) count++;
  }
  console.log(`[matches] ${count} ready.`);
}

async function seedTournaments(target = 14) {
  console.log(`\n[tournaments] seeding ${target}...`);
  const FORMATS = ["round_robin","single_elimination","double_elimination","group_then_knockout"];
  const NAMES = [
    "Spring Soccer Cup","Summer Classic","Autumn Volleyball Open","Winter Indoor League",
    "Youth Cup","Women's Championship","Diaspora Trophy","International Friendly Cup",
    "Cricket T20 League","Bay Area Showdown","Toronto Open","London Invitational",
    "Hamburg Derby Series","Sydney Showdown",
  ];
  let count = 0;
  for (let i = 0; i < target; i++) {
    const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${shortId()}` : "");
    const slug = slugify(`${name}-${shortId()}`);
    const start = daysFromNow(randInt(-15, 120));
    const end = new Date(start.getTime() + randInt(1, 3) * 24 * 60 * 60 * 1000);
    const { error } = await sb.from("tournaments").insert({
      slug, name, sport: rand(SPORTS), format: rand(FORMATS),
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      city: rand(CITIES).city,
      // tournaments schema has no country_code column (see migration 011)
      banner_url: rand(SAMPLE_IMAGES),
      status: start < new Date() ? "in_progress" : rand(["announced","registration"]),
      description: `${name}. Open to ASF-affiliated teams. ${rand(FORMATS).replace(/_/g," ")} format. Live brackets and standings.`,
      is_published: true, is_featured: randomBool(0.25),
    });
    if (!error) count++;
  }
  console.log(`[tournaments] ${count} ready.`);
}

async function seedDiscussions(users, target = 70, repliesTarget = 400) {
  console.log(`\n[discussions] seeding ${target} threads + ${repliesTarget} replies...`);
  const CATEGORIES = ["general","announcements","rules","tactics","recruitment","events","off_topic"];
  const TITLES = [
    "Best formation for 5-a-side futsal?",
    "Coaching youth — share your drills",
    "Anyone running pickup in NoVA this weekend?",
    "Cup eligibility for new chapters",
    "Looking for goalkeeper in Hamburg",
    "Volleyball libero — overrated?",
    "T20 cricket: bat first or chase?",
    "ASF charity match — who's in?",
    "Refereeing course — worth it?",
    "Travel arrangements for the Cup",
    "Sponsorship pitch deck template",
    "Hosting an iftar tournament — tips",
    "Concussion protocol — anyone here use it?",
    "How to start a chapter in Stockholm",
    "Women's league — recruitment strategies",
    "Best venues in Toronto for indoor soccer",
    "Sunday pickup attendance — how to keep it consistent",
    "Tournament fees — fair pricing structure",
    "Best app to track match stats?",
    "Coaching certification path — what's yours?",
    "Recovery routines after Sunday pickup",
    "Best whistles for refereeing",
    "Anyone interested in starting a chess league?",
    "Sourcing kit on a budget",
    "Goalkeeping coach in the Bay Area?",
    "Visa support letters for the Cup",
    "Streaming setup recommendations",
    "Safeguarding officer responsibilities",
    "Best soccer cleats for hard ground",
    "Diet during Ramadan + training",
  ];
  const BODIES = [
    "Opening this thread to collect opinions. Looking for what's working in your chapter.",
    "We tried this last season and it kind of worked. Curious what the rest of you think.",
    "Heads-up to anyone planning ahead — drop your thoughts below.",
    "Honest critique welcome. Trying to make a decision this week.",
    "Quick poll-style question. Lazy answers welcome — just need a vibe check.",
    "Saw something interesting at the last meetup and wanted to discuss.",
  ];
  const REPLY_BODIES = [
    "Great question. In our chapter we run 2-1-1 but only against pressing teams.",
    "I'd say it depends on the floor. Sticky surfaces give you 3-1 advantage.",
    "Anyone tried a diamond? We ran it last season and it worked.",
    "Strongly disagree. Sub the keeper out at 5 minutes left, it's a game-changer.",
    "We use a shared spreadsheet — boring but it works.",
    "Got a goalkeeper from the Hamburg ad last spring. Highly recommend posting here.",
    "+1 — let's get this on the calendar. Who picks the venue?",
    "Email rules@asf.org and they will send the latest one.",
    "Yes — the safeguarding course was eye-opening. Worth every hour.",
    "Bus block is 1100 EUR for 25 seats. DM me if interested.",
    "We did 50 EUR for adults + free for under-16. Worked well for a one-day.",
    "Plenty of venues in Etobicoke. Will paste the list when I'm at my laptop.",
    "We make attendance a Slack poll on Thursday. Helps a lot.",
    "Glad you raised it. Our coach uses the SCAT5 form, available online.",
    "Try Sportlomo or LeagueLab. We use the latter, ~12 USD/month per team.",
    "PM me — I have the deck we used to get our gold sponsor.",
    "Reps from 3 chapters DM'd me already. Let's plan a call.",
    "Indoor at Newport is free off-peak. We just have to book 2 weeks ahead.",
    "Saved! Will share with our committee tomorrow.",
    "Pinning this thread.",
    "Stockholm has 30+ interested players according to my Insta DMs.",
    "I run a chapter in Frankfurt — happy to walk you through how we started.",
    "Whoever pinned this is a hero.",
    "Honestly the best resource we have on this is just talking to other captains.",
    "Update: 18 players RSVP'd, venue locked in.",
  ];

  const threadIds = [];
  let threadCount = 0;
  for (let i = 0; i < target; i++) {
    const author = rand(users);
    const title = TITLES[i % TITLES.length] + (i >= TITLES.length ? ` (${shortId()})` : "");
    const slug = slugify(`${title}-${shortId()}`);
    const category = rand(CATEGORIES);
    const { data, error } = await sb.from("discussions").insert({
      slug, title,
      body: rand(BODIES),
      author_id: author.id,
      category, sport: randomBool(0.5) ? author.sport : null,
      is_pinned: i < 3,
      created_at: daysAgo(randInt(0, 45)).toISOString(),
    }).select("id").single();
    if (error || !data) continue;
    threadIds.push(data.id);
    threadCount++;
  }

  let replyCount = 0;
  for (let i = 0; i < repliesTarget; i++) {
    const threadId = rand(threadIds);
    if (!threadId) break;
    const author = rand(users);
    const { error } = await sb.from("discussion_replies").insert({
      discussion_id: threadId, author_id: author.id, body: rand(REPLY_BODIES),
      created_at: daysAgo(randInt(0, 30)).toISOString(),
    });
    if (!error) replyCount++;
  }
  console.log(`[discussions] ${threadCount} threads + ${replyCount} replies.`);
}

async function seedSocialGraph(users, target = 700) {
  console.log(`\n[social] seeding ${target} user follows...`);
  let count = 0;
  for (let i = 0; i < target; i++) {
    const a = rand(users); const b = rand(users);
    if (a.id === b.id) continue;
    const { error } = await sb.from("follows").upsert(
      { follower_id: a.id, subject_type: "user", subject_id: b.id },
      { onConflict: "follower_id,subject_type,subject_id" },
    );
    if (!error) count++;
  }
  console.log(`[social] ${count} follows.`);
}

async function seedReelLikes(users, target = 1000) {
  console.log(`\n[likes] seeding ${target} reel likes...`);
  const { data: reels } = await sb.from("reels").select("id").limit(300);
  if (!reels || reels.length === 0) return;
  let count = 0;
  for (let i = 0; i < target; i++) {
    const r = rand(reels); const u = rand(users);
    const { error } = await sb.from("reel_likes").upsert(
      { reel_id: r.id, user_id: u.id },
      { onConflict: "reel_id,user_id" },
    );
    if (!error) count++;
  }
  console.log(`[likes] ${count} likes.`);
}

async function seedTeamFollowers(users, teams, target = 400) {
  // Check table exists; skip if not (migration 017 dependency).
  const { error: probe } = await sb.from("team_followers").select("*").limit(1);
  if (probe) {
    console.log(`\n[team-follows] skipped — table not yet created (migration 017).`);
    return;
  }
  console.log(`\n[team-follows] seeding ${target}...`);
  let count = 0;
  for (let i = 0; i < target; i++) {
    const u = rand(users); const t = rand(teams);
    const { error } = await sb.from("team_followers").upsert(
      { user_id: u.id, team_id: t.id },
      { onConflict: "user_id,team_id" },
    );
    if (!error) count++;
  }
  console.log(`[team-follows] ${count} ready.`);
}

// =============================================================================
// DRIVER
// =============================================================================

(async () => {
  console.log("ASF mega seed starting. ~3-5 minutes.\n");
  await checkSchema();

  const users = await seedUsers(100);
  if (users.length === 0) { console.error("No users created — aborting."); process.exit(1); }

  const teams = await seedTeams(users, 25);

  await seedEvents(users, teams, 60);
  await seedNews(users, 60);
  await seedTournaments(14);
  await seedReels(users, 80);
  await seedMatches(teams, users, 50);
  await seedPolls(users, teams, 30);
  await seedDiscussions(users, 70, 400);
  await seedReelComments(users, 200);
  await seedSocialGraph(users, 700);
  await seedReelLikes(users, 1000);
  await seedTeamFollowers(users, teams, 400);

  console.log("\n=== Final counts ===");
  for (const t of [
    "profiles","teams","team_members","team_followers","events","news_posts","polls","poll_options","poll_votes",
    "reels","reel_likes","reel_comments","matches","tournaments","discussions","discussion_replies",
    "follows","wall_posts"
  ]) {
    const { count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`  ${t.padEnd(22)} ${count ?? 0}`);
  }
  console.log("\n✓ Seed complete. Visit /feed to see the wall.");
})().catch((e) => { console.error("seed-demo failed:", e); process.exit(1); });
