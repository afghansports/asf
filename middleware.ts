import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Three gates: auth, maintenance, suspension.
 *
 *  1. Auth — protected prefixes redirect unauth visitors to /login.
 *  2. Maintenance — site_settings.maintenance_mode = true sends non-admins to
 *     /maintenance (admins + auth/admin paths bypass).
 *  3. Suspension — active suspensions redirect users away from write paths
 *     (and read paths for full / permanent suspensions). /appeal and
 *     /suspended always remain accessible.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile/edit",
  "/teams/create",
  "/teams/manage",
  "/events/create",
  "/admin",
  "/onboarding",
  "/messages",
  "/reels/upload",
  "/matches/submit",
  "/notifications",
];

const MAINT_BYPASS_PREFIXES = [
  "/admin",
  "/login",
  "/signup",
  "/auth",
  "/maintenance",
  "/api/auth",
];

const SUSPENDED_WRITE_PREFIXES = [
  "/teams/create",
  "/teams/manage",
  "/events/create",
  "/reels/upload",
  "/matches/submit",
  "/profile/edit",
  "/messages",
];

const SUSPENDED_READ_FULL_PREFIXES = ["/dashboard", "/notifications"];

export async function middleware(request: NextRequest) {
  const { response, user, isAdmin, maintenanceOn, suspension } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // 1. Auth gate.
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Maintenance gate.
  if (maintenanceOn && !isAdmin) {
    const bypass = MAINT_BYPASS_PREFIXES.some((p) => pathname.startsWith(p));
    if (!bypass && pathname !== "/maintenance") {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // 3. Suspension gate.
  if (
    suspension &&
    !isAdmin &&
    !pathname.startsWith("/suspended") &&
    !pathname.startsWith("/appeal") &&
    !pathname.startsWith("/auth")
  ) {
    const writeBlocked = SUSPENDED_WRITE_PREFIXES.some((p) => pathname.startsWith(p));
    const readBlocked =
      (suspension.type === "full" || suspension.type === "permanent") &&
      SUSPENDED_READ_FULL_PREFIXES.some((p) => pathname.startsWith(p));
    if (writeBlocked || readBlocked) {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
