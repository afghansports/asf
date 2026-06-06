import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Pin, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { FillImage } from "@/components/shared/optimized-image";
import { ReplyForm } from "./reply-form";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.slug };
}

export default async function DiscussionDetailPage({ params }: Props) {
  if (!(await isFeatureEnabled("module.discussions"))) {
    return <ModuleDisabled name="Discussions" />;
  }
  const supabase = await createClient();
  const { data: thread } = await supabase
    .from("discussions")
    .select("id, slug, title, body, category, is_pinned, is_locked, author_id, created_at, reply_count")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!thread) notFound();

  const { data: replies } = await supabase
    .from("discussion_replies")
    .select("id, body, author_id, created_at, parent_reply_id")
    .eq("discussion_id", thread.id)
    .order("created_at", { ascending: true });

  const authorIds = Array.from(
    new Set([thread.author_id, ...((replies ?? []).map((r) => r.author_id))]),
  );
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const threadAuthor = authorMap.get(thread.author_id);

  return (
    <section className="w-full bg-asf-off min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <Link
          href="/discussions"
          className="inline-flex items-center gap-1.5 text-sm text-asf-muted hover:text-asf-red mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to discussions
        </Link>

        <article className="rounded-lg bg-white border border-asf-border p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-asf-muted">
            <span className="px-1.5 py-0.5 rounded bg-asf-off-2 text-asf-text font-condensed font-bold tracking-[0.16em] uppercase text-[0.6rem]">
              {thread.category}
            </span>
            {thread.is_pinned ? (
              <span className="inline-flex items-center gap-1 text-asf-red text-[0.65rem] font-condensed font-bold tracking-[0.16em] uppercase">
                <Pin className="w-3 h-3" /> pinned
              </span>
            ) : null}
            {thread.is_locked ? (
              <span className="inline-flex items-center gap-1 text-asf-muted text-[0.65rem] font-condensed font-bold tracking-[0.16em] uppercase">
                <Lock className="w-3 h-3" /> locked
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-display font-black text-2xl sm:text-3xl text-asf-text leading-tight">
            {thread.title}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-[0.65rem] overflow-hidden">
              {threadAuthor?.avatar_url ? (
                <FillImage src={cdnUrl(threadAuthor.avatar_url)} alt="" className="object-cover" sizes="32px" />
              ) : (
                <span>{(threadAuthor?.full_name ?? threadAuthor?.username ?? "?").charAt(0).toUpperCase()}</span>
              )}
            </span>
            <span className="text-asf-muted">
              {threadAuthor ? (
                <Link href={`/profile/${threadAuthor.username}`} className="text-asf-text font-medium hover:text-asf-red">
                  {threadAuthor.full_name ?? threadAuthor.username}
                </Link>
              ) : (
                <span className="text-asf-text">Deleted user</span>
              )}
              {" · "}
              {new Date(thread.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          {thread.body ? (
            <div className="mt-4 text-asf-text/90 leading-relaxed whitespace-pre-line">{thread.body}</div>
          ) : null}
        </article>

        {/* Replies */}
        <h2 className="mt-8 mb-3 font-display font-bold text-base text-asf-text inline-flex items-center gap-2">
          <MessageSquare className="w-4 h-4" aria-hidden />
          {(replies ?? []).length} {(replies ?? []).length === 1 ? "reply" : "replies"}
        </h2>
        <ul className="space-y-3">
          {(replies ?? []).map((r) => {
            const a = authorMap.get(r.author_id);
            return (
              <li key={r.id} className="rounded-md bg-white border border-asf-border p-4">
                <div className="flex items-center gap-2 text-xs text-asf-muted mb-2">
                  <span className="relative inline-flex w-7 h-7 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-[0.6rem] overflow-hidden">
                    {a?.avatar_url ? (
                      <FillImage src={cdnUrl(a.avatar_url)} alt="" className="object-cover" sizes="28px" />
                    ) : (
                      <span>{(a?.full_name ?? a?.username ?? "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  {a ? (
                    <Link href={`/profile/${a.username}`} className="text-asf-text font-medium hover:text-asf-red">
                      {a.full_name ?? a.username}
                    </Link>
                  ) : (
                    <span className="text-asf-text">Deleted user</span>
                  )}
                  <span>· {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </div>
                <p className="text-sm text-asf-text/90 leading-relaxed whitespace-pre-line">{r.body}</p>
              </li>
            );
          })}
        </ul>

        {/* Reply form */}
        {thread.is_locked ? (
          <p className="mt-6 text-sm text-asf-muted italic">This thread is locked.</p>
        ) : user ? (
          <div className="mt-6">
            <ReplyForm discussionId={thread.id} />
          </div>
        ) : (
          <p className="mt-6 text-sm text-asf-muted">
            <Link href="/login" className="text-asf-red underline underline-offset-4">
              Sign in
            </Link>{" "}
            to reply.
          </p>
        )}
      </div>
    </section>
  );
}
