import { Users, Calendar, Mail, Newspaper, Send, Shield, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

/**
 * /admin. Per ASF_LAUNCH_PRD.md > STEP 11 > Dashboard.
 * 4 stat cards: Total users, Total teams, Pending events, Unread contacts.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [{ count: totalUsers }, { count: totalTeams }, { count: pendingEvents }, { count: unreadContacts }, { count: subscribers }, { count: newsCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("is_published", false),
    supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("newsletter_signups").select("id", { count: "exact", head: true }),
    supabase.from("news_posts").select("id", { count: "exact", head: true }),
  ]);
  const [{ data: recentContacts }, { data: recentUsers }] = await Promise.all([
    supabase
      .from("contact_submissions")
      .select("id, name, subject, created_at, is_read")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, username, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { icon: Users, label: "Total users", value: totalUsers ?? 0, href: "/admin/users", tone: "bg-asf-navy text-white" },
    { icon: Shield, label: "Total teams", value: totalTeams ?? 0, href: "/admin/teams", tone: "bg-white" },
    { icon: Calendar, label: "Pending events", value: pendingEvents ?? 0, href: "/admin/events", tone: "bg-asf-red text-white" },
    { icon: Mail, label: "Unread contacts", value: unreadContacts ?? 0, href: "/admin/contacts", tone: "bg-asf-gold text-asf-text" },
    { icon: Send, label: "Newsletter subscribers", value: subscribers ?? 0, href: "/admin/newsletter", tone: "bg-white" },
    { icon: Newspaper, label: "News posts", value: newsCount ?? 0, href: "/admin/news", tone: "bg-white" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display font-black text-3xl text-asf-text mb-2">Admin dashboard</h1>

      <Link
        href="/admin/tutorial"
        className="mb-8 group flex items-center gap-3 rounded-lg border border-asf-gold/40 bg-asf-gold-light px-5 py-3 hover:bg-asf-gold/20 transition-colors"
      >
        <span className="inline-flex w-10 h-10 rounded bg-asf-gold text-asf-text items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" aria-hidden />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display font-bold text-base text-asf-text">First time? Read the tutorial.</span>
          <span className="block text-sm text-asf-muted">Step-by-step guides for every admin task — modules, news, events, moderation, hierarchy, sports data, and more.</span>
        </span>
        <ArrowRight className="w-4 h-4 text-asf-text/70 group-hover:translate-x-0.5 transition-transform" aria-hidden />
      </Link>

      <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.label}>
              <a
                href={s.href}
                className={`flex items-center justify-between gap-4 p-5 rounded-lg border border-asf-border ${s.tone} hover:shadow transition-shadow`}
              >
                <div>
                  <p className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase opacity-80">
                    {s.label}
                  </p>
                  <p className="font-display font-black text-3xl mt-1 leading-none">
                    {s.value.toLocaleString()}
                  </p>
                </div>
                <Icon className="w-6 h-6 opacity-90" aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-5 lg:grid-cols-2 mt-8">
        <section className="rounded-lg border border-asf-border bg-white p-5">
          <h2 className="font-display font-bold text-xl text-asf-text mb-4">Recent contacts</h2>
          <ul className="divide-y divide-asf-border">
            {(recentContacts ?? []).map((c) => (
              <li key={c.id} className="py-3 text-sm">
                <a href="/admin/contacts" className="hover:text-asf-red">
                  <span className="font-medium text-asf-text">{c.name}</span>
                  {!c.is_read ? <span className="ml-2 rounded bg-asf-red-light px-1.5 py-0.5 text-[0.65rem] text-asf-red">Unread</span> : null}
                  <span className="block text-asf-muted">{c.subject}</span>
                  <span className="block text-xs text-asf-muted">{new Date(c.created_at).toLocaleDateString("en-US")}</span>
                </a>
              </li>
            ))}
            {(recentContacts ?? []).length === 0 ? <li className="py-4 text-sm text-asf-muted">No contact submissions yet.</li> : null}
          </ul>
        </section>

        <section className="rounded-lg border border-asf-border bg-white p-5">
          <h2 className="font-display font-bold text-xl text-asf-text mb-4">Recent users</h2>
          <ul className="divide-y divide-asf-border">
            {(recentUsers ?? []).map((u) => (
              <li key={u.id} className="py-3 text-sm">
                <a href={`/profile/${u.username}`} className="hover:text-asf-red">
                  <span className="font-medium text-asf-text">{u.full_name ?? u.username}</span>
                  <span className="block text-asf-muted">@{u.username}</span>
                  <span className="block text-xs text-asf-muted">{new Date(u.created_at).toLocaleDateString("en-US")}</span>
                </a>
              </li>
            ))}
            {(recentUsers ?? []).length === 0 ? <li className="py-4 text-sm text-asf-muted">No users yet.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
