import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request, returns the authed
 * user, the user's is_admin flag, the maintenance flag, AND the user's active
 * suspension if any. The middleware uses all four to enforce auth, admin,
 * maintenance, and suspension gates.
 */

export type ActiveSuspension = {
  id: string;
  type: "posting_only" | "full" | "permanent";
  ends_at: string | null;
  reason: string;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: do not put logic between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile (admin flag) + maintenance + suspension in parallel.
  const [profileRes, maintRes, suspRes] = await Promise.all([
    user
      ? supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "maintenance_mode")
      .maybeSingle(),
    user
      ? supabase
          .from("user_suspensions")
          .select("id, type, ends_at, reason, lifted_at")
          .eq("user_id", user.id)
          .is("lifted_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null }),
  ]);

  const isAdmin = !!(profileRes.data as { is_admin?: boolean } | null)?.is_admin;
  const maintRow = maintRes as { data: { setting_value: string } | null };
  const maintenanceOn = maintRow.data?.setting_value === "true";

  const suspension: ActiveSuspension | null = (() => {
    const row = (suspRes.data as Array<{ id: string; type: string; ends_at: string | null; reason: string; lifted_at: string | null }> | null)?.[0];
    if (!row) return null;
    if (row.ends_at && new Date(row.ends_at).getTime() < Date.now()) return null;
    return {
      id: row.id,
      type: row.type as "posting_only" | "full" | "permanent",
      ends_at: row.ends_at,
      reason: row.reason,
    };
  })();

  return { response, user, isAdmin, maintenanceOn, suspension };
}
