import { createClient } from "@/lib/supabase/server";
import { ModerationAdmin, type ProfileLite } from "./moderation-admin";

export const metadata = { title: "Admin moderation" };

type SearchParams = { q?: string };

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const q = (sp.q ?? "").trim();

  const supabase = await createClient();
  let usersQ = supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, country_code, is_active, shadow_banned, verification_status, false_report_count, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) usersQ = usersQ.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
  const { data: users } = await usersQ;

  // Active suspensions, last 100 strikes — for context in the table.
  const { data: activeSuspensions } = await supabase
    .from("user_suspensions")
    .select("id, user_id, type, ends_at, reason, created_at")
    .is("lifted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const suspensionMap = new Map<string, (typeof activeSuspensions extends (infer T)[] | null ? T : never)>();
  for (const s of activeSuspensions ?? []) {
    if (!suspensionMap.has(s.user_id)) suspensionMap.set(s.user_id, s);
  }

  const { data: strikeRows } = await supabase
    .from("user_strikes")
    .select("user_id, severity")
    .order("created_at", { ascending: false })
    .limit(500);
  const strikeCount = new Map<string, number>();
  for (const s of strikeRows ?? []) {
    strikeCount.set(s.user_id, (strikeCount.get(s.user_id) ?? 0) + 1);
  }

  const profiles: ProfileLite[] = (users ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    country_code: u.country_code,
    is_active: !!u.is_active,
    shadow_banned: !!u.shadow_banned,
    verification_status: u.verification_status,
    false_report_count: u.false_report_count ?? 0,
    strikes: strikeCount.get(u.id) ?? 0,
    suspension: (() => {
      const s = suspensionMap.get(u.id);
      if (!s) return null;
      return { id: s.id, type: s.type, ends_at: s.ends_at, reason: s.reason };
    })(),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Moderation</h1>
        <p className="text-sm text-asf-muted mt-1">
          Issue strikes, suspensions, and shadow bans. Set verification status. View per-user history.
        </p>
      </div>

      <form className="mb-6 flex items-stretch gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by username or name"
          className="h-10 px-3 rounded-md border border-asf-border bg-white text-sm w-72"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase"
        >
          Search
        </button>
      </form>

      <ModerationAdmin profiles={profiles} />
    </div>
  );
}
