import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FillImage } from "@/components/shared/optimized-image";
import { ThreadView } from "./thread-view";

type Props = { params: { id: string } };

export const metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  // Confirm the user is a participant.
  const { data: part } = await supabase
    .from("dm_participants")
    .select("conversation_id, last_read_at, dm_conversations!inner(id, title, is_group)")
    .eq("conversation_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!part) notFound();

  // Other participants (with their last_read_at for read receipts).
  const { data: others } = await supabase
    .from("dm_participants")
    .select("user_id, last_read_at, profiles(id, username, full_name, avatar_url)")
    .eq("conversation_id", params.id)
    .neq("user_id", user.id);

  const { data: messages } = await supabase
    .from("dm_messages")
    .select("id, sender_id, body, created_at, deleted_at")
    .eq("conversation_id", params.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(500);

  // Mark this conversation as read.
  await supabase
    .from("dm_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", params.id)
    .eq("user_id", user.id);

  type OtherRow = {
    user_id: string;
    last_read_at: string | null;
    profiles: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null;
  };
  const otherList = ((others ?? []) as unknown as OtherRow[]).filter((o) => o.profiles);
  // For read receipts: timestamp of the earliest "last_read_at" across others.
  // If everyone else has read up to T, then any of my messages with created_at <= T are "Read".
  const othersMinReadAt = otherList.length === 0
    ? null
    : otherList
        .map((o) => o.last_read_at)
        .filter((t): t is string => !!t)
        .sort()[0] ?? null;
  const headerName = otherList.length === 1
    ? (otherList[0].profiles!.full_name ?? otherList[0].profiles!.username ?? "Conversation")
    : `${otherList.length} participants`;

  return (
    <section className="w-full bg-asf-off min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-asf-muted hover:text-asf-red mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to inbox
        </Link>

        <div className="flex items-center gap-3 p-4 rounded-t-lg bg-white border border-asf-border border-b-0">
          {otherList.length === 1 ? (
            <Link
              href={`/profile/${otherList[0].profiles!.username}`}
              className="flex items-center gap-3 hover:text-asf-red"
            >
              <span className="relative inline-flex w-10 h-10 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                {otherList[0].profiles!.avatar_url ? (
                  <FillImage src={otherList[0].profiles!.avatar_url} alt="" className="object-cover" sizes="40px" />
                ) : (
                  <span aria-hidden>{headerName.charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span>
                <span className="block text-sm text-asf-text">{headerName}</span>
                <span className="block text-xs text-asf-muted">@{otherList[0].profiles!.username}</span>
              </span>
            </Link>
          ) : (
            <p className="text-sm font-medium text-asf-text">{headerName}</p>
          )}
        </div>

        <ThreadView
          conversationId={params.id}
          currentUserId={user.id}
          othersReadThrough={othersMinReadAt}
          initialMessages={(messages ?? []).map((m) => ({
            id: m.id,
            sender_id: m.sender_id,
            body: m.body ?? "",
            created_at: m.created_at,
          }))}
        />
      </div>
    </section>
  );
}
