import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createPublicClient();
  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!team) return NextResponse.json({ success: false, error: "Team not found." }, { status: 404 });

  const [{ data: members }, { data: events }] = await Promise.all([
    supabase
      .from("team_members")
      .select("role, position, jersey_number, joined_at, profiles(id, username, full_name, avatar_url)")
      .eq("team_id", team.id),
    supabase
      .from("events")
      .select("id, title, slug, event_type, sport, start_datetime, city, state_province, banner_url")
      .eq("organizer_team_id", team.id)
      .eq("is_published", true)
      .order("start_datetime", { ascending: true })
      .limit(10),
  ]);

  return NextResponse.json({ success: true, team, members: members ?? [], events: events ?? [] });
}
