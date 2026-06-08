import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json(
      {
        authenticated: false,
        error: userError?.message ?? "No logged-in Supabase user.",
        supabaseProjectHost: getSupabaseHost(),
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, full_name, is_admin, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  return Response.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile ?? null,
    profileError: profileError?.message ?? null,
    adminAllowed: !!profile?.is_admin,
    supabaseProjectHost: getSupabaseHost(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}

function getSupabaseHost() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return "invalid-url";
  }
}
