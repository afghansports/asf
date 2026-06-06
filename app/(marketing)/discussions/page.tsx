import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Pin, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { getLocale, translateMany, isTranslatable } from "@/lib/i18n/translate";

export const metadata: Metadata = {
  title: "Discussions",
  description: "Community threads on tactics, recruitment, rules, and everything else.",
};

const CATEGORIES: { code: string; label: string }[] = [
  { code: "",              label: "All" },
  { code: "general",       label: "General" },
  { code: "announcements", label: "Announcements" },
  { code: "rules",         label: "Rules" },
  { code: "tactics",       label: "Tactics" },
  { code: "recruitment",   label: "Recruitment" },
  { code: "events",        label: "Events" },
  { code: "off_topic",     label: "Off-topic" },
];

type Search = { cat?: string };

export default async function DiscussionsListPage({
  searchParams,
}: {
  searchParams?: Promise<Search> | Search;
}) {
  if (!(await isFeatureEnabled("module.discussions"))) {
    return <ModuleDisabled name="Discussions" />;
  }
  const sp = (searchParams ? await searchParams : {}) as Search;
  const cat = sp.cat ?? "";

  const supabase = await createClient();
  let q = supabase
    .from("discussions")
    .select("id, slug, title, body, category, sport, is_pinned, is_locked, reply_count, last_reply_at, last_reply_by, author_id, created_at")
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false })
    .limit(50);
  if (cat) q = q.eq("category", cat);
  const { data: threads } = await q;

  const authorIds = Array.from(
    new Set(
      (threads ?? []).flatMap((t) => [t.author_id, t.last_reply_by].filter((id): id is string => !!id)),
    ),
  );
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  // Auto-translate visible thread title + preview for Dari/Pashto readers (cached).
  const locale = await getLocale();
  const list = threads ?? [];
  let items = list;
  if (isTranslatable(locale) && list.length) {
    const n = list.length;
    const tx = await translateMany(
      [...list.map((x) => x.title ?? ""), ...list.map((x) => x.body ?? "")],
      locale,
    );
    items = list.map((x, i) => ({ ...x, title: tx[i] || x.title, body: tx[n + i] || x.body }));
  }

  return (
    <>
      <PageHero
        eyebrow="Community"
        title="Discussions"
        subtitle="Threaded conversations across the ASF community. Pick a category, jump in."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          {/* Category chips */}
          <nav className="flex flex-wrap gap-2 mb-6" aria-label="Discussion categories">
            {CATEGORIES.map((c) => (
              <Link
                key={c.code || "all"}
                href={c.code ? `/discussions?cat=${c.code}` : `/discussions`}
                className={
                  cat === c.code
                    ? "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-asf-navy text-white"
                    : "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
                }
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {!threads || threads.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-5 h-5" />}
              title="No threads yet in this category."
              description="Start one — the first message is always the hardest."
            />
          ) : (
            <ul className="space-y-3">
              {items.map((t) => {
                const author = authorMap.get(t.author_id);
                const lastBy = t.last_reply_by ? authorMap.get(t.last_reply_by) : null;
                return (
                  <li
                    key={t.id}
                    className="rounded-lg bg-white border border-asf-border hover:border-asf-red/40 hover:shadow-sm transition-all"
                  >
                    <Link href={`/discussions/${t.slug}`} className="block p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-asf-muted">
                            <span className="px-1.5 py-0.5 rounded bg-asf-off-2 text-asf-text font-condensed font-bold tracking-[0.16em] uppercase text-[0.6rem]">
                              {t.category}
                            </span>
                            {t.is_pinned ? (
                              <span className="inline-flex items-center gap-1 text-asf-red text-[0.65rem] font-condensed font-bold tracking-[0.16em] uppercase">
                                <Pin className="w-3 h-3" /> pinned
                              </span>
                            ) : null}
                            {t.is_locked ? (
                              <span className="inline-flex items-center gap-1 text-asf-muted text-[0.65rem] font-condensed font-bold tracking-[0.16em] uppercase">
                                <Lock className="w-3 h-3" /> locked
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 font-display font-bold text-base text-asf-text leading-snug">
                            {t.title}
                          </p>
                          {t.body ? (
                            <p className="mt-1 text-sm text-asf-muted line-clamp-2">{t.body}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-asf-muted">
                            by{" "}
                            <span className="text-asf-text font-medium">
                              {author?.full_name ?? author?.username ?? "—"}
                            </span>
                            {" · "}
                            {t.reply_count ?? 0} {(t.reply_count ?? 0) === 1 ? "reply" : "replies"}
                            {lastBy ? (
                              <>
                                {" · last by "}
                                <span className="text-asf-text">{lastBy.full_name ?? lastBy.username}</span>
                              </>
                            ) : null}
                            {" · "}
                            {new Date(t.last_reply_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-asf-navy text-white text-xs font-condensed font-bold">
                            <MessageSquare className="w-3 h-3" />
                            {t.reply_count ?? 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
