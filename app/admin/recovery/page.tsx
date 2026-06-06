import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { RecoveryActions } from "./recovery-actions";

export const metadata = { title: "Account recovery" };

const STATUS_ORDER: Record<string, number> = { pending: 0, approved: 1, denied: 2, cancelled: 3 };

export default async function AdminRecoveryPage() {
  const service = createServiceClient();

  const { data: requestRows } = await service
    .from("account_recovery_requests")
    .select(
      "id, claimed_username, claimed_email, full_name, new_email, details, status, matched_user_id, review_notes, reviewed_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const requests = (requestRows ?? []).sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  // Resolve each claimed identity to a real account so the admin can verify.
  const usernames = Array.from(new Set(requests.map((r) => r.claimed_username).filter(Boolean))) as string[];
  const profileByUsername = new Map<string, { id: string; full_name: string | null }>();
  if (usernames.length) {
    const { data: profs } = await service
      .from("profiles")
      .select("id, username, full_name")
      .in("username", usernames);
    for (const p of profs ?? []) {
      profileByUsername.set(p.username as string, { id: p.id as string, full_name: (p.full_name as string) ?? null });
    }
  }

  const { data: authUsers } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const idByEmail = new Map<string, string>();
  const emailById = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    if (u.email) {
      idByEmail.set(u.email.toLowerCase(), u.id);
      emailById.set(u.id, u.email);
    }
  }

  function resolveMatch(r: (typeof requests)[number]): string | null {
    if (r.claimed_username && profileByUsername.has(r.claimed_username)) {
      return profileByUsername.get(r.claimed_username)!.id;
    }
    if (r.claimed_email && idByEmail.has(r.claimed_email.toLowerCase())) {
      return idByEmail.get(r.claimed_email.toLowerCase())!;
    }
    return null;
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Account recovery</h1>
        <p className="text-sm text-asf-muted mt-1">
          Requests from users who lost access to their email. Verify identity out-of-band before
          approving. Approving changes the account&apos;s login email and sends a password-reset link.
          <span className="ml-1 text-asf-text font-medium">{pendingCount} pending.</span>
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <Th>Claimed identity</Th>
              <Th>New email</Th>
              <Th>Details</Th>
              <Th>Matched account</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const matchId = resolveMatch(r);
              const matchEmail = matchId ? emailById.get(matchId) : null;
              return (
                <tr key={r.id} className="border-t border-asf-border align-top">
                  <td className="px-4 py-3">
                    <span className="block text-asf-text font-medium">{r.full_name ?? "—"}</span>
                    {r.claimed_username ? (
                      <span className="block text-xs text-asf-muted">@{r.claimed_username}</span>
                    ) : null}
                    {r.claimed_email ? (
                      <span className="block text-xs text-asf-muted">{r.claimed_email}</span>
                    ) : null}
                    <span className="block text-xs text-asf-muted">
                      {new Date(r.created_at).toLocaleDateString("en-US")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-asf-text">{r.new_email}</td>
                  <td className="px-4 py-3 text-asf-muted max-w-xs">
                    <span className="block whitespace-pre-wrap">{r.details ?? "—"}</span>
                    {r.review_notes ? (
                      <span className="block mt-1 text-xs italic">Note: {r.review_notes}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {matchId ? (
                      <>
                        <span className="block text-xs text-asf-green font-medium">Matched</span>
                        <span className="block text-xs text-asf-muted">{matchEmail ?? matchId}</span>
                        {r.claimed_username ? (
                          <Link href={`/profile/${r.claimed_username}`} className="text-xs text-asf-red hover:underline">
                            View profile
                          </Link>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-xs text-asf-muted">No match — verify manually</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {r.reviewed_at ? (
                      <span className="block text-[0.65rem] text-asf-muted mt-1">
                        {new Date(r.reviewed_at).toLocaleDateString("en-US")}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <RecoveryActions requestId={r.id} matchedUserId={matchId} />
                    ) : (
                      <span className="text-xs text-asf-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-asf-muted text-sm">
                  No recovery requests.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-asf-gold/20 text-asf-gold-dark",
    approved: "bg-asf-green-light text-asf-green",
    denied: "bg-asf-red/15 text-asf-red",
    cancelled: "bg-asf-off text-asf-muted",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-condensed font-bold tracking-[0.14em] uppercase ${
        styles[status] ?? "bg-asf-off text-asf-muted"
      }`}
    >
      {status}
    </span>
  );
}
