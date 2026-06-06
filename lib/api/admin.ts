import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AdminApiContext =
  | { ok: true; supabase: ReturnType<typeof createServiceClient> }
  | { ok: false; status: number; message: string };

export async function requireAdminApi(): Promise<AdminApiContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return { ok: false, status: 403, message: "Admin required." };
  }

  return { ok: true, supabase: createServiceClient() };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
