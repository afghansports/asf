import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { markContactRead, deleteContactSubmission } from "../_actions";

export const metadata = { title: "Admin contacts" };

export default async function AdminContactsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("contact_submissions")
    .select("id, name, email, phone, subject, message, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display font-black text-3xl text-asf-text mb-6">Contact submissions</h1>
      <ul className="space-y-4">
        {(rows ?? []).map((c) => (
          <li key={c.id} className="rounded-lg border border-asf-border bg-white">
            <details className="group">
              <summary className="list-none cursor-pointer flex items-center gap-3 p-4 hover:bg-asf-off-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-asf-text">
                    <strong>{c.name}</strong> <span className="text-asf-muted">&lt;{c.email}&gt;</span>
                  </p>
                  <p className="text-xs text-asf-muted mt-0.5 capitalize">
                    {c.subject.replace("_", " ")} . {new Date(c.created_at).toLocaleString("en-US")}
                  </p>
                </div>
                {c.is_read ? null : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-red text-white text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                    Unread
                  </span>
                )}
              </summary>
              <div className="px-4 pb-4 space-y-3">
                {c.phone ? <p className="text-xs text-asf-muted">Phone: {c.phone}</p> : null}
                <p className="text-sm text-asf-text whitespace-pre-line leading-relaxed">{c.message}</p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-asf-border">
                  <a
                    href={`mailto:${c.email}`}
                    className="h-8 px-3 rounded-md text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white hover:bg-asf-navy-light inline-flex items-center"
                  >
                    Reply by email
                  </a>
                  <ActionButton
                    action={() => markContactRead(c.id, !c.is_read)}
                    label={c.is_read ? "Mark unread" : "Mark read"}
                  />
                  <ActionButton
                    action={() => deleteContactSubmission(c.id)}
                    label="Delete"
                    variant="danger"
                    confirm="Delete this contact submission?"
                  />
                </div>
              </div>
            </details>
          </li>
        ))}
        {(rows ?? []).length === 0 ? (
          <li className="rounded-lg p-10 border border-dashed border-asf-border bg-white text-center text-asf-muted">
            No contact submissions yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
