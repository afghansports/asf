import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldOff, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/shared/logo";

export const metadata = { title: "Account suspended" };

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("user_suspensions")
    .select("id, type, reason, starts_at, ends_at, lifted_at")
    .eq("user_id", user.id)
    .is("lifted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const susp = rows?.[0];
  if (!susp) redirect("/dashboard");

  const ends = susp.ends_at ? new Date(susp.ends_at) : null;
  const ended = ends && ends.getTime() < Date.now();
  if (ended) redirect("/dashboard");

  const daysLeft = ends
    ? Math.max(0, Math.ceil((ends.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <main className="min-h-screen w-full bg-asf-navy text-white flex items-center justify-center px-6 py-20">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)",
        }}
        aria-hidden
      />
      <div className="relative max-w-xl text-center space-y-5">
        <Logo size={88} href={null} />
        <span className="inline-flex w-12 h-12 rounded-full bg-asf-red text-white items-center justify-center">
          <ShieldOff className="w-5 h-5" aria-hidden />
        </span>
        <p className="font-condensed font-bold text-xs sm:text-sm tracking-[0.32em] uppercase text-asf-gold">
          {susp.type.replace("_", " ")} suspension
        </p>
        <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight">
          {susp.type === "permanent"
            ? "Your account has been permanently suspended."
            : susp.type === "full"
              ? "Your account is temporarily suspended."
              : "Your account is on a posting-only suspension."}
        </h1>
        <p className="text-white/85 leading-relaxed max-w-md mx-auto">{susp.reason}</p>
        {daysLeft !== null ? (
          <p className="text-asf-gold text-sm">
            Suspension ends in <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong>.
          </p>
        ) : null}
        <div className="rounded-md p-4 bg-white/10 border border-white/20 text-sm text-white/85 inline-flex items-start gap-2 max-w-md text-left">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <span>
            If you believe this is a mistake, you can submit an appeal. ASF moderators review
            within 7 days.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/appeal"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-asf-red text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-asf-red-dark transition-colors"
          >
            Submit an appeal
          </Link>
          <Link
            href="/community-guidelines"
            className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-white/40 text-white font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-white/10"
          >
            Community Guidelines
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-white/30 text-white/85 font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
