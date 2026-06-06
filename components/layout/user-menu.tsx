"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, LayoutDashboard, LogOut, Settings, Shield, User as UserIcon, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * User avatar dropdown for logged-in nav. Per PRD > STEP 4:
 * My Profile, My Team, Dashboard, Settings, Log Out.
 *
 * Sign out posts to /auth/signout (existing route handler). The avatar circle
 * shows the user's first initial; falls back to "?" if blank.
 */

type UserMenuProps = {
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
};

export function UserMenu({ username, fullName, avatarUrl, isAdmin = false }: UserMenuProps) {
  const initial = (fullName ?? username ?? "?").trim().charAt(0).toUpperCase() || "?";
  const profileHref = username ? `/profile/${username}` : "/profile/edit";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Open account menu"
            className="inline-flex items-center gap-2 rounded-full p-1 pe-2 hover:bg-asf-off-2 transition-colors aria-expanded:bg-asf-off-2"
          >
            <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold overflow-hidden">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill className="object-cover" sizes="32px" unoptimized />
              ) : (
                <span aria-hidden>{initial}</span>
              )}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-asf-muted" aria-hidden />
          </button>
        }
      />
      <PopoverContent align="end" sideOffset={8} className="w-56 p-1.5">
        <div className="px-3 py-2 border-b border-asf-border mb-1">
          <p className="text-sm font-medium text-asf-text truncate">
            {fullName ?? username ?? "Account"}
          </p>
          {username ? (
            <p className="text-xs text-asf-muted truncate">@{username}</p>
          ) : null}
        </div>
        <ul className="flex flex-col">
          <MenuLink href={profileHref} icon={<UserIcon className="w-4 h-4" />} label="My Profile" />
          <MenuLink href="/teams/manage" icon={<Users className="w-4 h-4" />} label="My Team" />
          <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          {isAdmin ? (
            <MenuLink href="/admin" icon={<Shield className="w-4 h-4" />} label="Admin" />
          ) : null}
          <MenuLink href="/profile/edit" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </ul>
        <form action="/auth/signout" method="post" className="mt-1 pt-1 border-t border-asf-border">
          <button
            type="submit"
            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-asf-red hover:bg-asf-red-light"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            <span>Log Out</span>
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-asf-text hover:bg-asf-off-2"
      >
        <span className="text-asf-muted">{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
}
