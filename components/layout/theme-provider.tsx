"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/**
 * Wraps the app in next-themes so any component can call useTheme().
 *
 * `attribute="class"` toggles `<html class="dark">` which the shadcn primitives
 * in globals.css already key off. `disableTransitionOnChange` prevents the
 * brief flash of color when the user toggles light <-> dark.
 *
 * `enableSystem` means a user who has never explicitly chosen falls back to
 * their OS preference (CSS `prefers-color-scheme`). Storage key is namespaced.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="asf-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
