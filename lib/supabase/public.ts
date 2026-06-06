import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Public, cookie-free Supabase client for anonymous reads.
 *
 * Use this for public CMS/content queries so public pages do not touch
 * `cookies()` during static build attempts. RLS still applies because this
 * uses the publishable anon key.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
