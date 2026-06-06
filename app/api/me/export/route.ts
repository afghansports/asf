import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/me/export
 *
 * GDPR right-to-data-portability: returns the authenticated user's full
 * dataset as a single JSON download. Includes profile, follows, team
 * memberships, reels, reel comments, news posts they authored, events they
 * organized, contact submissions, and DM message history.
 *
 * The response is served as an attachment so the browser downloads it.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [
    profile,
    follows,
    memberships,
    reels,
    comments,
    news,
    events,
    submissions,
    blocks,
    likes,
    dmConvs,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("follows").select("*").eq("follower_id", user.id),
    supabase.from("team_members").select("*").eq("player_id", user.id),
    supabase.from("reels").select("*").eq("author_id", user.id),
    supabase.from("reel_comments").select("*").eq("author_id", user.id),
    supabase.from("news_posts").select("*").eq("author_id", user.id),
    supabase.from("events").select("*").eq("organizer_id", user.id),
    supabase.from("contact_submissions").select("*").eq("email", user.email ?? ""),
    supabase.from("user_blocks").select("*").eq("blocker_id", user.id),
    supabase.from("reel_likes").select("*").eq("user_id", user.id),
    supabase
      .from("dm_participants")
      .select("conversation_id, joined_at, role, status, last_read_at")
      .eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    profile: profile.data ?? null,
    follows: follows.data ?? [],
    team_memberships: memberships.data ?? [],
    reels: reels.data ?? [],
    reel_comments: comments.data ?? [],
    news_posts: news.data ?? [],
    events: events.data ?? [],
    contact_submissions: submissions.data ?? [],
    blocks: blocks.data ?? [],
    reel_likes: likes.data ?? [],
    dm_conversations: dmConvs.data ?? [],
    note:
      "This export contains your data only. Other users in shared content (e.g. team rosters, conversations) are not included.",
  };

  const filename = `asf-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
