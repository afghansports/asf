/**
 * Single source of truth for which navigation links belong to which module
 * feature flag. Consumed by EVERY navigation surface — desktop navbar, mobile
 * drawer, mobile bottom-nav, and footer — so that toggling a module off in
 * /admin/modules hides it consistently across all views.
 *
 * Rule: a link with no `flag` is always visible. A link whose `flag` resolves
 * to `false` (admin disabled the module) is hidden. Missing flag rows default
 * to enabled (see lib/features/flags.ts > getFlags), so links only disappear
 * when an admin explicitly switches the module off.
 *
 * This file is pure data + a pure helper — no server-only imports — so it is
 * safe to import from both server components (navbar, footer, layout) and
 * client components (mobile-drawer, bottom-nav).
 */

export type NavLink = { href: string; label: string; flag?: string };

/**
 * Every module flag any navigation surface cares about. Resolve this once with
 * getFlags(NAV_FLAG_KEYS) and hand the result to each surface. (getAllFlags is
 * request-cached, so resolving in several places still hits Postgres once.)
 */
export const NAV_FLAG_KEYS: string[] = [
  "module.wall",
  "module.events",
  "module.teams",
  "module.tournaments",
  "module.matches",
  "module.chapters",
  "module.free_agents",
  "module.reels",
  "module.discussions",
  "module.polls",
  "module.external_sports",
  "module.gallery",
  "module.news",
  "module.leaderboards",
  "module.clubs",
  "module.federations",
  "module.sponsors",
  "module.dm",
  "module.notifications",
  "module.bookmarks",
  "module.search",
];

/** Primary public links for the mobile drawer (full list). */
export const DRAWER_PRIMARY: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about/team", label: "Team" },
  { href: "/feed", label: "Wall", flag: "module.wall" },
  { href: "/events", label: "Events", flag: "module.events" },
  { href: "/teams", label: "Teams", flag: "module.teams" },
  { href: "/tournaments", label: "Tournaments", flag: "module.tournaments" },
  { href: "/matches", label: "Matches", flag: "module.matches" },
  { href: "/chapters", label: "Chapters", flag: "module.chapters" },
  { href: "/free-agents", label: "Free agents", flag: "module.free_agents" },
  { href: "/reels", label: "Reels", flag: "module.reels" },
  { href: "/discussions", label: "Talk", flag: "module.discussions" },
  { href: "/polls", label: "Polls", flag: "module.polls" },
  { href: "/scores", label: "Scores", flag: "module.external_sports" },
  { href: "/gallery", label: "Gallery", flag: "module.gallery" },
  { href: "/news", label: "News", flag: "module.news" },
  { href: "/leaderboards", label: "Leaderboards", flag: "module.leaderboards" },
];

/** "About" sub-links — always visible (no module governs them). */
export const ABOUT_NAV: NavLink[] = [
  { href: "/about", label: "About ASF" },
  { href: "/about/mission", label: "Mission and Vision" },
  { href: "/about/history", label: "History" },
];

/** Extra links shown to signed-in users in the mobile drawer. */
export const DRAWER_AUTHED: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/messages", label: "Messages", flag: "module.dm" },
  { href: "/notifications", label: "Notifications", flag: "module.notifications" },
  { href: "/saved", label: "Saved", flag: "module.bookmarks" },
  { href: "/profile/edit", label: "Settings" },
];

/** Footer "Quick Links" column. */
export const FOOTER_QUICK_LINKS: NavLink[] = [
  { href: "/about", label: "About ASF" },
  { href: "/about/history", label: "History" },
  { href: "/about/team", label: "Team" },
  { href: "/events", label: "Events", flag: "module.events" },
  { href: "/teams", label: "Teams", flag: "module.teams" },
  { href: "/tournaments", label: "Tournaments", flag: "module.tournaments" },
  { href: "/matches", label: "Matches", flag: "module.matches" },
  { href: "/chapters", label: "Chapters", flag: "module.chapters" },
  { href: "/free-agents", label: "Free agents", flag: "module.free_agents" },
  { href: "/reels", label: "Reels", flag: "module.reels" },
  { href: "/gallery", label: "Gallery", flag: "module.gallery" },
  { href: "/news", label: "News", flag: "module.news" },
  { href: "/sponsors", label: "Sponsors", flag: "module.sponsors" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/community-guidelines", label: "Community Guidelines" },
];

/**
 * Keep only the links whose governing module is enabled. A link with no `flag`
 * always survives; a link whose flag is explicitly `false` is dropped.
 */
export function visibleLinks(
  links: NavLink[],
  flags: Record<string, boolean>,
): NavLink[] {
  return links.filter((l) => !l.flag || flags[l.flag] !== false);
}

/** Convenience predicate for single links (bottom-nav items, etc.). */
export function isLinkVisible(
  flag: string | undefined,
  flags: Record<string, boolean>,
): boolean {
  return !flag || flags[flag] !== false;
}
