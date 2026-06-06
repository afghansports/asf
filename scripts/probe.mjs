import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const t of ["wall_posts","discussions","feature_flags","federations","clubs","sports","reels","tournaments","team_followers"]) {
  const { error, count } = await sb.from(t).select("*", { count: "exact", head: true });
  console.log(`${t.padEnd(20)} ${error ? `ERR ${error.code}` : `OK count=${count}`}`);
}
