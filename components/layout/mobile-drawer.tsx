"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "@/components/shared/logo";

/**
 * MobileDrawer. Hamburger icon → full-height slide-in panel from the right
 * with all primary nav links. Per PRD > STEP 4: closes on link tap.
 *
 * Decision: implemented directly (not via shadcn Dialog) so the panel can
 * slide from the right edge with native scroll lock and a simple animation.
 */

type DrawerLink = { href: string; label: string };
const PUBLIC_LINKS: DrawerLink[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/teams", label: "Teams" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/matches", label: "Matches" },
  { href: "/chapters", label: "Chapters" },
  { href: "/free-agents", label: "Free agents" },
  { href: "/reels", label: "Reels" },
  { href: "/polls", label: "Polls" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News" },
  { href: "/leaderboards", label: "Leaderboards" },
];
const ABOUT_LINKS: DrawerLink[] = [
  { href: "/about", label: "About ASF" },
  { href: "/about/mission", label: "Mission and Vision" },
  { href: "/about/history", label: "History" },
  { href: "/about/team", label: "Management Team" },
];
const AUTHED_EXTRA: DrawerLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/saved", label: "Saved" },
  { href: "/profile/edit", label: "Settings" },
];

export function MobileDrawer({
  isAuthed,
  username,
  fullName,
  isAdmin = false,
}: {
  isAuthed: boolean;
  username: string | null;
  fullName: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      // Always restore to "" so a stale "hidden" can't lock the page on the
      // next route (this is what made /news appear non-scrollable for the user).
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // Belt-and-braces: on every mount/unmount of the drawer component, make sure
  // the body is scrollable. Protects against navigation while the drawer is
  // open (closing happens via cleanup of the effect above, but if the
  // component unmounts mid-state we still want to release the lock).
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-asf-text hover:bg-asf-off-2"
      >
        <Menu className="w-5 h-5" aria-hidden />
      </button>

      {open ? (
        <div className="md:hidden fixed inset-0 z-[60] flex h-screen min-h-screen justify-end">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            // Right-anchored panel via flex on the parent. Explicit bg-white on
            // this aside AND on every flex child below: earlier the user saw
            // the page navy bleeding through the middle of the drawer because
            // the bg paint wasn't reaching the flex-1 nav region. Defense in
            // depth fixes that across all browsers.
            className="relative z-10 h-screen min-h-screen w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col"
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-asf-border bg-white">
              <Logo size={32} withText />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-asf-text hover:bg-asf-off-2"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            {isAuthed ? (
              <div className="shrink-0 px-5 py-4 border-b border-asf-border bg-asf-off">
                <p className="text-xs uppercase tracking-[0.18em] text-asf-muted font-condensed font-bold">
                  Signed in as
                </p>
                <p className="text-sm font-medium text-asf-text truncate">
                  {fullName ?? username ?? "Account"}
                </p>
              </div>
            ) : null}

            <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-4 bg-white">
              <ul className="flex flex-col">
                <DrawerItem href="/" label="Home" onNavigate={() => setOpen(false)} />
                <li>
                  <button
                    type="button"
                    onClick={() => setAboutOpen((v) => !v)}
                    aria-expanded={aboutOpen}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-condensed font-bold tracking-wider uppercase text-asf-text hover:bg-asf-off-2"
                  >
                    <span>About</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${aboutOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {aboutOpen ? (
                    <ul className="pl-3 pb-1">
                      {ABOUT_LINKS.map((l) => (
                        <DrawerItem
                          key={l.href}
                          href={l.href}
                          label={l.label}
                          onNavigate={() => setOpen(false)}
                          subtle
                        />
                      ))}
                    </ul>
                  ) : null}
                </li>
                {PUBLIC_LINKS.filter((l) => l.href !== "/").map((l) => (
                  <DrawerItem
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
                {isAuthed ? (
                  <>
                    {isAdmin ? (
                      <DrawerItem href="/admin" label="Admin" onNavigate={() => setOpen(false)} />
                    ) : null}
                    {AUTHED_EXTRA.map((l) => (
                      <DrawerItem
                        key={l.href}
                        href={l.href}
                        label={l.label}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </>
                ) : null}
              </ul>
            </nav>

            <div className="shrink-0 border-t border-asf-border bg-white px-5 py-4 space-y-2">
              {isAuthed ? (
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full h-10 inline-flex items-center justify-center rounded-md bg-asf-red text-white font-condensed font-bold tracking-wider uppercase text-sm hover:bg-asf-red-dark"
                  >
                    Log Out
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="w-full h-10 inline-flex items-center justify-center rounded-md border border-asf-border text-asf-text font-condensed font-bold tracking-wider uppercase text-sm hover:bg-asf-off-2"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="w-full h-10 inline-flex items-center justify-center rounded-md bg-asf-red text-white font-condensed font-bold tracking-wider uppercase text-sm hover:bg-asf-red-dark"
                  >
                    Join
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DrawerItem({
  href,
  label,
  onNavigate,
  subtle = false,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
  subtle?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={
          subtle
            ? "block px-4 py-2.5 rounded-md text-sm text-asf-text hover:bg-asf-off-2"
            : "block px-4 py-3 rounded-md text-base font-condensed font-bold tracking-wider uppercase text-asf-text hover:bg-asf-off-2"
        }
      >
        {label}
      </Link>
    </li>
  );
}
