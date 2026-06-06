/**
 * Internal endpoint that fans a notification row out to a user's web push
 * subscriptions. Two ways to call it:
 *
 * 1. From the server in our own code: `await fetch(${APP_URL}/api/push/send, ...)`
 * 2. From Postgres via pg_net (recommended). Add this to a trigger on
 *    notifications insert:
 *
 *    create extension if not exists pg_net;
 *    create or replace function public.fanout_notification_push()
 *    returns trigger language plpgsql security definer set search_path = public as $$
 *    begin
 *      perform net.http_post(
 *        url := current_setting('app.app_url') || '/api/push/send',
 *        headers := jsonb_build_object('Content-Type','application/json',
 *                                       'Authorization', 'Bearer ' || current_setting('app.cron_secret')),
 *        body := jsonb_build_object('notificationId', new.id)::text
 *      );
 *      return new;
 *    end $$;
 *
 * The endpoint is also safe to call manually for backfills.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendNotificationToUser } from "@/lib/push/send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode: allow if no secret is set
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  let body: { notificationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "bad body" }, { status: 400 });
  }
  const id = body.notificationId;
  if (!id) {
    return NextResponse.json({ ok: false, message: "notificationId required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: notif, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, body, link")
    .eq("id", id)
    .maybeSingle();

  if (error || !notif) {
    return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });
  }

  // Honor the recipient's per-type pref before sending push.
  const { data: prof } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", notif.user_id)
    .maybeSingle();

  const prefs = (prof?.notification_prefs ?? {}) as Record<
    string,
    { inapp?: boolean; push?: boolean; email?: boolean }
  >;
  const typePref = prefs[notif.type];
  // Default: push on for everything except low-signal types.
  const NO_PUSH_BY_DEFAULT = new Set(["like_reel"]);
  const allowed =
    typePref?.push ??
    (typePref?.inapp ?? !NO_PUSH_BY_DEFAULT.has(notif.type));

  if (!allowed) {
    return NextResponse.json({ ok: true, sent: 0, skipped: "user pref" });
  }

  const TITLES: Record<string, string> = {
    follow: "New follower",
    like_reel: "Someone liked your reel",
    comment_reel: "New comment",
    mention: "You were mentioned",
    team_invite: "Team activity",
    match_reported: "Match reported",
    match_confirmed: "Match confirmed",
    event_approved: "Event approved",
    event_rejected: "Event rejected",
    announcement: "ASF announcement",
    message: "New message",
    message_request: "New message request",
    strike: "Account strike",
    suspension: "Suspension update",
  };

  const r = await sendNotificationToUser(notif.user_id, notif.id, {
    title: TITLES[notif.type] ?? "ASF",
    body: notif.body ?? "",
    url: notif.link ?? "/notifications",
    tag: notif.type,
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.message }, { status: 200 });
  }
  return NextResponse.json({ ok: true, sent: r.sent });
}
