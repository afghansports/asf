import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox, MessageCircle, MailQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { FillImage } from "@/components/shared/optimized-image";
import { MessageRequestRow } from "./request-row";

export const metadata: Metadata = { title: "Messages" };

type SearchParams = { tab?: string };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const tab = sp.tab === "requests" ? "requests" : "inbox";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  // Conversations the user is in.
  const { data: parts } = await supabase
    .from("dm_participants")
    .select("conversation_id, last_read_at, dm_conversations!inner(id, is_group, title, last_message_at)")
    .eq("user_id", user.id)
    .eq("status", "active");

  type Row = {
    conversation_id: string;
    last_read_at: string | null;
    dm_conversations: { id: string; is_group: boolean; title: string | null; last_message_at: string };
  };
  const conversations = ((parts ?? []) as unknown as Row[]).sort((a, b) =>
    b.dm_conversations.last_message_at.localeCompare(a.dm_conversations.last_message_at),
  );

  // For each conversation, pull the other participant (1:1) + last message.
  const convIds = conversations.map((c) => c.conversation_id);
  const [othersRes, lastMsgsRes] = await Promise.all([
    convIds.length
      ? supabase
          .from("dm_participants")
          .select("conversation_id, user_id, profiles(id, username, full_name, avatar_url, verification_status)")
          .in("conversation_id", convIds)
          .neq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    convIds.length
      ? supabase
          .from("dm_messages")
          .select("conversation_id, body, sender_id, created_at")
          .in("conversation_id", convIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  type Other = {
    conversation_id: string;
    user_id: string;
    profiles: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; verification_status: string | null } | null;
  };
  const otherByConv = new Map<string, Other>();
  for (const o of (othersRes.data ?? []) as unknown as Other[]) {
    if (!otherByConv.has(o.conversation_id)) otherByConv.set(o.conversation_id, o);
  }
  const lastMsgByConv = new Map<string, { body: string | null; sender_id: string; created_at: string }>();
  for (const m of (lastMsgsRes.data ?? []) as Array<{ conversation_id: string; body: string | null; sender_id: string; created_at: string }>) {
    if (!lastMsgByConv.has(m.conversation_id)) lastMsgByConv.set(m.conversation_id, m);
  }

  // Pending message requests for this user.
  const { data: requests } = await supabase
    .from("dm_message_requests")
    .select("id, sender_id, preview_body, created_at, profiles!dm_message_requests_sender_id_fkey(username, full_name, avatar_url)")
    .eq("recipient_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  type Req = {
    id: string;
    sender_id: string;
    preview_body: string | null;
    created_at: string;
    profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
  };
  const pendingRequests = ((requests ?? []) as unknown as Req[]).filter((r) => r.profiles);
  const requestCount = pendingRequests.length;

  return (
    <>
      <PageHero
        eyebrow="Messages"
        title="Inbox."
        subtitle={tab === "requests" ? "Conversation requests from people you do not follow." : "Conversations sorted newest first."}
      >
        <div className="inline-flex rounded-md border border-white/30 bg-white/10 backdrop-blur-sm overflow-hidden">
          <Link
            href="/messages"
            className={
              tab === "inbox"
                ? "h-9 px-3 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-white text-asf-navy"
                : "h-9 px-3 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-white/85 hover:bg-white/10"
            }
          >
            <Inbox className="w-3.5 h-3.5" aria-hidden />
            Inbox
          </Link>
          <Link
            href="/messages?tab=requests"
            className={
              tab === "requests"
                ? "h-9 px-3 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-white text-asf-navy"
                : "h-9 px-3 inline-flex items-center gap-1.5 text-xs font-condensed font-bold tracking-[0.16em] uppercase text-white/85 hover:bg-white/10"
            }
          >
            <MailQuestion className="w-3.5 h-3.5" aria-hidden />
            Requests
            {requestCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-asf-red text-white text-[0.6rem] font-bold leading-none">
                {requestCount}
              </span>
            ) : null}
          </Link>
        </div>
      </PageHero>

      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
          {tab === "inbox" ? (
            conversations.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="w-5 h-5" aria-hidden />}
                title="No conversations yet."
                description="Open a profile and tap Message to start a conversation."
              />
            ) : (
              <ul className="rounded-lg border border-asf-border bg-white divide-y divide-asf-border">
                {conversations.map((c) => {
                  const other = otherByConv.get(c.conversation_id);
                  const last = lastMsgByConv.get(c.conversation_id);
                  const unread =
                    !!last &&
                    last.sender_id !== user.id &&
                    (!c.last_read_at || c.last_read_at < last.created_at);
                  return (
                    <li key={c.conversation_id}>
                      <Link
                        href={`/messages/${c.conversation_id}`}
                        className="flex items-center gap-3 p-4 hover:bg-asf-off-2"
                      >
                        <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                          {other?.profiles?.avatar_url ? (
                            <FillImage src={other.profiles.avatar_url} alt="" className="object-cover" sizes="40px" />
                          ) : (
                            <span aria-hidden>
                              {(other?.profiles?.full_name ?? other?.profiles?.username ?? "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-asf-text truncate">
                            {other?.profiles?.full_name ?? other?.profiles?.username ?? "Conversation"}
                          </p>
                          <p className="text-xs text-asf-muted truncate">
                            {last?.body ?? "(no messages yet)"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[0.65rem] text-asf-muted">
                            {last ? new Date(last.created_at).toLocaleDateString("en-US") : ""}
                          </span>
                          {unread ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-asf-red" aria-hidden />
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <ul className="space-y-3">
              {pendingRequests.length === 0 ? (
                <EmptyState
                  icon={<MailQuestion className="w-5 h-5" aria-hidden />}
                  title="No pending requests."
                  description="Conversations from people you don't follow appear here."
                />
              ) : (
                pendingRequests.map((r) => (
                  <MessageRequestRow
                    key={r.id}
                    request={{
                      id: r.id,
                      preview_body: r.preview_body,
                      created_at: r.created_at,
                      sender: {
                        username: r.profiles!.username,
                        full_name: r.profiles!.full_name,
                        avatar_url: r.profiles!.avatar_url,
                      },
                    }}
                  />
                ))
              )}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
