import Link from "next/link";
import { Search, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/shared/logo";
import { AboutMenu } from "./about-menu";
import { UserMenu } from "./user-menu";
import { MobileDrawer } from "./mobile-drawer";
import { NotificationBell } from "./notification-bell";
import { getFlags } from "@/lib/features/flags";

/**
 * Public site Navbar. Server component — fetches the current user (if any)
 * and the matching profile row, then renders the right side accordingly.
 *
 * Spec: ASF_LAUNCH_PRD.md > STEP 4 > Navbar.
 *
 * Logged out: [Logo] [Home] [About v] [Events] [Teams] [Gallery] [News] [Login] [Join]
 * Logged in:  [Logo] [Home] [Events] [Teams] [Gallery] [News] [Avatar dropdown]
 * Mobile:     [Logo]                                                 [Hamburger]
 */
export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data ?? null;
  }

  const isAuthed = !!user;

  const flags = await getFlags([
    "module.events",
    "module.teams",
    "module.reels",
    "module.polls",
    "module.gallery",
    "module.news",
    "module.dm",
    "module.notifications",
    "module.search",
    "module.external_sports",
    "module.wall",
    "module.discussions",
  ]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-asf-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="min-w-0 shrink">
          <Logo
            size={36}
            withText
            textClassName="hidden sm:inline max-w-[12rem] truncate"
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          <NavLink href="/">Home</NavLink>
          {flags["module.wall"] ? <NavLink href="/feed">Wall</NavLink> : null}
          <AboutMenu />
          {flags["module.events"] ? <NavLink href="/events">Events</NavLink> : null}
          {flags["module.teams"] ? <NavLink href="/teams">Teams</NavLink> : null}
          {flags["module.reels"] ? <NavLink href="/reels">Reels</NavLink> : null}
          {flags["module.discussions"] ? <NavLink href="/discussions">Talk</NavLink> : null}
          {flags["module.polls"] ? <NavLink href="/polls">Polls</NavLink> : null}
          {flags["module.external_sports"] ? <NavLink href="/scores">Scores</NavLink> : null}
          {flags["module.gallery"] ? <NavLink href="/gallery">Gallery</NavLink> : null}
          {flags["module.news"] ? <NavLink href="/news">News</NavLink> : null}
        </nav>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-2">
          {flags["module.search"] ? (
            <Link
              href="/search"
              aria-label="Search"
              className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-md text-asf-text hover:bg-asf-off-2"
            >
              <Search className="w-4 h-4" aria-hidden />
            </Link>
          ) : null}
          {isAuthed ? (
            <div className="hidden md:flex items-center gap-1">
              {flags["module.dm"] ? (
                <Link
                  href="/messages"
                  aria-label="Messages"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-md text-asf-text hover:bg-asf-off-2"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden />
                </Link>
              ) : null}
              {flags["module.notifications"] ? <NotificationBell /> : null}
              <UserMenu
                username={profile?.username ?? null}
                fullName={profile?.full_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-condensed font-bold tracking-wider uppercase text-asf-text hover:bg-asf-off-2"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-asf-red text-white text-sm font-condensed font-bold tracking-wider uppercase hover:bg-asf-red-dark"
              >
                Join
              </Link>
            </div>
          )}

          <MobileDrawer
            isAuthed={isAuthed}
            username={profile?.username ?? null}
            fullName={profile?.full_name ?? null}
          />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm font-condensed font-bold tracking-wider uppercase text-asf-text hover:text-asf-red transition-colors"
    >
      {children}
    </Link>
  );
}
