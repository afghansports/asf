import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  ImageIcon,
  Newspaper,
  Users,
  Shield,
  Mail,
  Send,
  LogOut,
  FileEdit,
  HelpCircle,
  Clock,
  Building2,
  UserCog,
  HandHeart,
  Settings,
  Video,
  MapPin,
  Trophy,
  Medal,
  Building,
  Flag,
  Gavel,
  Scale,
  ToggleRight,
  Network,
  Globe,
  BookOpen,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/shared/logo";

/**
 * Admin shell. Self-contained chrome (sidebar nav, no global Navbar/Footer).
 * Server-checks auth + `is_admin = true`. Non-admin users redirected to
 * /dashboard.
 */

type NavItem = { href: string; icon: typeof LayoutDashboard; label: string };

const CONTENT_NAV: NavItem[] = [
  { href: "/admin",              icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/tutorial",     icon: BookOpen,        label: "Tutorial" },
  { href: "/admin/cms",          icon: FileEdit,        label: "Edit Content" },
  { href: "/admin/gallery",      icon: ImageIcon,       label: "Gallery" },
  { href: "/admin/news",         icon: Newspaper,       label: "News" },
  { href: "/admin/reels",        icon: Video,           label: "Reels" },
  { href: "/admin/events",       icon: Calendar,        label: "Events" },
  { href: "/admin/tournaments",  icon: Trophy,          label: "Tournaments" },
  { href: "/admin/matches",      icon: Medal,           label: "Matches" },
  { href: "/admin/chapters",     icon: Building,        label: "Chapters" },
  { href: "/admin/team-members", icon: UserCog,         label: "Management Team" },
  { href: "/admin/volunteers",   icon: HandHeart,       label: "Volunteers" },
  { href: "/admin/sponsors",     icon: Building2,       label: "Sponsors" },
  { href: "/admin/faq",          icon: HelpCircle,      label: "FAQ" },
  { href: "/admin/history",      icon: Clock,           label: "History" },
];

const PLATFORM_NAV: NavItem[] = [
  { href: "/admin/users",      icon: Users,    label: "Users" },
  { href: "/admin/teams",      icon: Shield,   label: "Teams" },
  { href: "/admin/reports",    icon: Flag,     label: "Reports" },
  { href: "/admin/moderation", icon: Gavel,    label: "Moderation" },
  { href: "/admin/appeals",    icon: Scale,    label: "Appeals" },
  { href: "/admin/recovery",   icon: KeyRound, label: "Recovery" },
  { href: "/admin/contacts",   icon: Mail,     label: "Contacts" },
  { href: "/admin/newsletter", icon: Send,     label: "Newsletter" },
  { href: "/admin/geo",        icon: MapPin,   label: "Geo districts" },
  { href: "/admin/modules",    icon: ToggleRight, label: "Modules" },
  { href: "/admin/hierarchy",  icon: Network,  label: "Hierarchy" },
  { href: "/admin/sports",     icon: Globe,    label: "Sports" },
  { href: "/admin/settings",   icon: Settings, label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name, username")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-asf-off">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-asf-border bg-asf-navy text-white">
        <div className="px-5 py-5 border-b border-white/10">
          <Logo size={36} withText textVariant="white" />
          <p className="mt-2 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-gold">
            Admin console
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Admin">
          <p className="px-3 pt-2 pb-1 font-condensed font-bold text-[0.6rem] tracking-[0.22em] uppercase text-white/40">
            Content
          </p>
          <ul className="space-y-0.5">
            {CONTENT_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="w-4 h-4" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="px-3 pt-4 pb-1 font-condensed font-bold text-[0.6rem] tracking-[0.22em] uppercase text-white/40">
            Platform
          </p>
          <ul className="space-y-0.5">
            {PLATFORM_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="w-4 h-4" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3 space-y-2">
          <p className="text-xs text-white/60 px-2">
            Signed in as <span className="text-white">{profile.full_name ?? profile.username}</span>
          </p>
          <Link
            href="/dashboard"
            className="block w-full text-center px-3 py-2 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white/10 hover:bg-white/20"
          >
            Back to site
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-red-light hover:bg-asf-red/20"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar (admin nav becomes a horizontal scroll) */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 bg-asf-navy text-white border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <Logo size={28} withText textVariant="white" />
          <Link href="/dashboard" className="text-[0.65rem] font-condensed font-bold tracking-[0.2em] uppercase text-white/70 hover:text-white">
            Back to site
          </Link>
        </div>
        <nav className="overflow-x-auto" aria-label="Admin (mobile)">
          <ul className="flex items-center gap-1 px-3 pb-2 whitespace-nowrap">
            {[...CONTENT_NAV, ...PLATFORM_NAV].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <main className="flex-1 min-w-0 pt-24 md:pt-0">{children}</main>
    </div>
  );
}
