import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/username/check?u=<candidate>
 * Returns { available: boolean, reason?: 'invalid' | 'taken' }
 *
 * Used by the /signup page for the live username uniqueness check.
 */

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const RESERVED = new Set([
  "admin",
  "administrator",
  "asf",
  "root",
  "support",
  "help",
  "api",
  "www",
  "moderator",
  "system",
  "official",
]);

export async function GET(request: NextRequest) {
  const u = (request.nextUrl.searchParams.get("u") ?? "").trim().toLowerCase();

  if (!u) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }
  if (!USERNAME_RE.test(u) || RESERVED.has(u)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", u)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { available: false, reason: "invalid" },
      { status: 500 }
    );
  }

  return NextResponse.json({ available: !data });
}
