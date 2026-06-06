/**
 * Promote a user to admin by email.
 * Usage:  node scripts/make-admin.mjs <email>
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const email = process.argv[2];
if (!email) {
  console.error("usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}

// Find the auth user by email
const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listErr) { console.error(listErr); process.exit(1); }
const user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`✗ No auth user with email ${email}.`);
  console.error(`  The user must sign up at /signup first, then re-run this script.`);
  process.exit(1);
}
console.log(`✓ Found auth user: ${user.id} (${user.email})`);

// Ensure profile exists
const { data: profile } = await sb.from("profiles").select("id, username, is_admin").eq("id", user.id).maybeSingle();
if (!profile) {
  // Create a minimal profile row
  const username = (user.email ?? "").split("@")[0].replace(/[^a-z0-9]/gi, "_").toLowerCase() || `user${user.id.slice(0,6)}`;
  const { error: insErr } = await sb.from("profiles").insert({
    id: user.id,
    username,
    full_name: user.user_metadata?.full_name ?? username,
    is_admin: true,
    onboarding_completed: true,
  });
  if (insErr) { console.error("Could not create profile:", insErr.message); process.exit(1); }
  console.log(`✓ Created profile with admin = true (username: ${username})`);
} else {
  if (profile.is_admin) {
    console.log(`  Already admin — username: @${profile.username}`);
  } else {
    const { error } = await sb.from("profiles").update({ is_admin: true }).eq("id", user.id);
    if (error) { console.error(error); process.exit(1); }
    console.log(`✓ Promoted @${profile.username} to admin.`);
  }
}

console.log(`\nSign in at /login as ${email} → visit /admin`);
