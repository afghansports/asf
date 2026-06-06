"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLinkVisible } from "@/lib/features/nav-config";

/**
 * <BottomNav> — mobile-only primary navigation, thumb-reach optimized.
 *
 * Renders only at `sm:` breakpoint and below. Hidden on >= sm because the
 * top navbar handles primary nav comfortably on desktop. Five anchors — the
 * iOS / Android cap that keeps each tap target ≥ ~64px wide.
 *
 * Has a safe-area bottom padding for iOS notch / home indicator devices.
 */

const ITEMS: {
  href: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
  flag?: string;
}[] = [
  { href: "/",            label: "Home",     icon: Home,     match: (p) => p === "/" },
  { href: "/feed",        label: "Wall",     icon: Sparkles, match: (p) => p.startsWith("/feed"), flag: "module.wall" },
  { href: "/about",       label: "About",    icon: Info,     match: (p) => p === "/about" || (p.startsWith("/about/") && !p.startsWith("/about/team")) },
  { href: "/about/team",  label: "ASF Team", icon: Users,    match: (p) => p.startsWith("/about/team") },
];

export function BottomNav({ flags }: { flags: Record<string, boolean> }) {
  const pathname = usePathname() || "/";
  const items = ITEMS.filter((item) => isLinkVisible(item.flag, flags));

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-asf-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-0.5 transition-colors duration-fast ease-out",
                  active
                    ? "text-asf-red"
                    : "text-asf-muted hover:text-asf-text active:bg-asf-off-2 motion-safe:active:scale-95",
                )}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span className="text-[0.65rem] font-condensed font-bold tracking-[0.12em] uppercase">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
