import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { AppealForm } from "./appeal-form";

export const metadata: Metadata = {
  title: "Submit an appeal",
  description: "Appeal a suspension on your ASF account.",
};

export default async function AppealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/appeal");

  // Active suspension (the one being appealed) and any prior appeals.
  const { data: susp } = await supabase
    .from("user_suspensions")
    .select("id, type, reason, ends_at, created_at")
    .eq("user_id", user.id)
    .is("lifted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const suspension = susp?.[0] ?? null;

  const { data: appeals } = await supabase
    .from("ban_appeals")
    .select("id, suspension_id, status, reason_text, created_at, decision_note, reviewed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHero
        eyebrow="Appeal"
        title="Submit an appeal."
        subtitle="ASF moderators review every appeal. We aim to respond within 7 days. Decisions are final unless new evidence is provided."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 space-y-8">
          {!suspension ? (
            <div className="rounded-lg p-6 bg-white border border-asf-border">
              <p className="text-sm text-asf-text">
                You have no active suspension. If you previously appealed a suspension that has
                since been lifted, you can see the history below.
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex items-center h-9 px-4 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy-light"
              >
                Back to dashboard
              </Link>
            </div>
          ) : (
            <AppealForm
              suspensionId={suspension.id}
              suspensionType={suspension.type}
              suspensionReason={suspension.reason}
              hasPendingAppeal={(appeals ?? []).some((a) => a.suspension_id === suspension.id && a.status === "pending")}
            />
          )}

          {(appeals ?? []).length > 0 ? (
            <article className="space-y-3">
              <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-muted">
                Appeal history
              </p>
              <ul className="space-y-2">
                {(appeals ?? []).map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md p-4 bg-white border border-asf-border text-sm space-y-1"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-text">
                        {a.status}
                      </span>
                      <span className="text-xs text-asf-muted">
                        Submitted {new Date(a.created_at).toLocaleDateString("en-US")}
                      </span>
                      {a.reviewed_at ? (
                        <span className="text-xs text-asf-muted">
                          Reviewed {new Date(a.reviewed_at).toLocaleDateString("en-US")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-asf-text/85 whitespace-pre-line">{a.reason_text}</p>
                    {a.decision_note ? (
                      <p className="text-xs text-asf-muted border-t border-asf-border pt-2 mt-2">
                        Moderator note: {a.decision_note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      </section>
    </>
  );
}
