import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const tables = [
  'profiles','teams','events','news_posts','sponsors','gallery_images','reels','reel_likes','reel_comments',
  'matches','tournaments','chapters','user_blocks','reports','strikes','suspensions','appeals',
  'notifications','user_follows','dm_conversations','polls','bookmarks','hashtags','hashtag_follows',
  'push_subscriptions','feature_flags','profile_roles','team_followers','federations','clubs',
  'club_members','club_followers','federation_followers','sports','sport_positions','sport_stats',
  'sport_match_formats','sport_match_event_types','match_events','external_fixtures','external_standings',
  'external_news','external_sync_log','push_deliveries','user_achievements','player_stats','achievements'
];

const out = { present: [], missing: [] };
for (const t of tables) {
  const { error, count } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) out.missing.push(`${t} (${error.code ?? 'err'})`);
  else out.present.push(`${t} [${count ?? 0}]`);
}
console.log('PRESENT:');
out.present.forEach(t => console.log('  ' + t));
console.log('\nMISSING:');
out.missing.forEach(t => console.log('  ' + t));
