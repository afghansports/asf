import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SLUG_RX = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const state = searchParams.get("state");
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "24") || 24, 1), 100);

  const supabase = await createClient();
  let query = supabase
    .from("teams")
    .select(
      "id, name, slug, sport, city, state_province, country_code, logo_url, member_count, follower_count, is_looking_for_players, is_asf_affiliate, created_at"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sport) query = query.eq("sport", sport);
  if (state) query = query.eq("state_province", state);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, teams: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    sport?: string;
    state?: string;
    city?: string;
    description?: string;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    isLookingForPlayers?: boolean;
  };

  const name = (body.name ?? "").trim();
  const slug = (body.slug || slugify(name)).toLowerCase();
  const city = (body.city ?? "").trim();

  if (!name) return NextResponse.json({ success: false, error: "Team name is required." }, { status: 400 });
  if (!SLUG_RX.test(slug)) return NextResponse.json({ success: false, error: "Invalid slug." }, { status: 400 });
  if (!body.sport) return NextResponse.json({ success: false, error: "Sport is required." }, { status: 400 });
  if (!body.state) return NextResponse.json({ success: false, error: "State is required." }, { status: 400 });
  if (!city) return NextResponse.json({ success: false, error: "City is required." }, { status: 400 });

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name,
      slug,
      sport: body.sport,
      state_province: body.state,
      country_code: "US",
      city,
      description: (body.description ?? "").trim().slice(0, 500) || null,
      logo_url: body.logoUrl ?? null,
      banner_url: body.bannerUrl ?? null,
      captain_id: user.id,
      is_looking_for_players: !!body.isLookingForPlayers,
    })
    .select("*")
    .single();

  if (error || !team) {
    return NextResponse.json({ success: false, error: error?.message ?? "Could not create team." }, { status: 400 });
  }

  await supabase.from("team_members").insert({ team_id: team.id, player_id: user.id, role: "captain" });

  return NextResponse.json({ success: true, team }, { status: 201 });
}
