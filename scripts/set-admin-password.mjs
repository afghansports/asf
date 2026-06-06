/**
 * Set (reset) a user's password via the service role. Local/admin use only.
 * Usage:  node scripts/set-admin-password.mjs <email> <newPassword>
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("usage: node scripts/set-admin-password.mjs <email> <newPassword>");
  process.exit(1);
}

const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listErr) { console.error(listErr.message); process.exit(1); }
const user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) { console.error(`✗ No auth user with email ${email}.`); process.exit(1); }

const { error } = await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true });
if (error) { console.error("✗ Could not set password:", error.message); process.exit(1); }

const { data: profile } = await sb.from("profiles").select("username, is_admin").eq("id", user.id).maybeSingle();
console.log(`✓ Password set for ${email} (id ${user.id})`);
console.log(`  admin: ${profile?.is_admin ? "yes" : "NO — run make-admin.mjs"}  username: @${profile?.username ?? "?"}`);
