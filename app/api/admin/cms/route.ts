import { NextResponse, type NextRequest } from "next/server";
import { saveContent, saveSettings } from "@/app/admin/cms/_actions";
import { createClient } from "@/lib/supabase/server";

/**
 * GET    /api/admin/cms                — return all site_content rows
 * PATCH  /api/admin/cms                — bulk update site_content
 *   body: { updates: [{ key, value }] }
 *   or   { settings: [{ key, value }] }   to update site_settings instead
 *
 * Both endpoints are admin-only (re-checked here on top of route-level auth).
 */

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.is_admin ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("content_key, content_value, content_type, label, section");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as {
      updates?: { key: string; value: string }[];
      settings?: { key: string; value: string }[];
    };

    let saved = 0;

    if (body.updates && body.updates.length > 0) {
      const r = await saveContent(body.updates);
      if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
      saved += r.saved;
    }
    if (body.settings && body.settings.length > 0) {
      const r = await saveSettings(body.settings);
      if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
      saved += r.saved;
    }

    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    console.error("[api/admin/cms PATCH]", e);
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
}
