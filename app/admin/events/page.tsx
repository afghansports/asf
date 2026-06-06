import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { approveEvent, rejectEvent, toggleEventFeatured } from "../_actions";
import { EventEditForm } from "./event-edit-form";

export const metadata = { title: "Admin events" };

type SearchParams = { filter?: string; edit?: string };

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const filter = sp.filter ?? "all";
  const editId = sp.edit;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("events")
    .select(
      "id, title, slug, event_type, sport, city, state_province, organizer_id, is_published, is_featured, created_at, start_datetime, banner_url"
    )
    .order("created_at", { ascending: false });
  if (filter === "pending") query = query.eq("is_published", false);
  if (filter === "published") query = query.eq("is_published", true);
  const { data: events } = await query.limit(200);

  const editing = editId ? events?.find((e) => e.id === editId) : null;

  // Organizer names
  const ids = Array.from(new Set((events ?? []).map((e) => e.organizer_id).filter((x): x is string => !!x)));
  const { data: organizers } = ids.length
    ? await supabase.from("profiles").select("id, username").in("id", ids)
    : { data: [] };
  const orgMap = new Map((organizers ?? []).map((o) => [o.id, o.username] as const));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Events</h1>
        <div className="inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {[
            { code: "all", label: "All" },
            { code: "pending", label: "Pending" },
            { code: "published", label: "Published" },
          ].map((o) => {
            const active = filter === o.code;
            return (
              <Link
                key={o.code}
                href={o.code === "all" ? "/admin/events" : `/admin/events?filter=${o.code}`}
                className={
                  active
                    ? "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                    : "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
                }
              >
                {o.label}
              </Link>
            );
          })}
        </div>
      </div>

      {editing ? (
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl text-asf-text mb-3">Edit event</h2>
          <EventEditForm event={editing} userId={user.id} />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Location</Th>
              <Th>Organizer</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e) => (
              <tr key={e.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <Link href={`/events/${e.slug ?? e.id}`} className="text-asf-text hover:text-asf-red font-medium">
                    {e.title}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-asf-muted">{e.event_type}</td>
                <td className="px-4 py-3 text-asf-muted">
                  {[e.city, e.state_province].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3 text-asf-muted">
                  {orgMap.get(e.organizer_id ?? "") ? (
                    <Link href={`/profile/${orgMap.get(e.organizer_id ?? "")}`} className="hover:text-asf-red">
                      @{orgMap.get(e.organizer_id ?? "")}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-asf-muted">
                  {new Date(e.created_at).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3">
                  {e.is_published ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-gold-light text-asf-text text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Pending
                    </span>
                  )}
                  {e.is_featured ? (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-asf-red text-white text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Featured
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {!e.is_published ? (
                      <ActionButton action={approveEvent.bind(null, e.id)} label="Approve" variant="ok" />
                    ) : (
                      <ActionButton
                        action={toggleEventFeatured.bind(null, e.id, !e.is_featured)}
                        label={e.is_featured ? "Unfeature" : "Feature"}
                      />
                    )}
                    <Link
                      href={`/admin/events?edit=${e.id}${filter === "all" ? "" : `&filter=${filter}`}`}
                      className="inline-flex items-center h-8 px-3 rounded-md bg-asf-off-2 text-asf-text text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy hover:text-white"
                    >
                      Edit
                    </Link>
                    <ActionButton
                      action={rejectEvent.bind(null, e.id)}
                      label="Delete"
                      variant="danger"
                      confirm={`Delete event "${e.title}"? This cannot be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {(events ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-asf-muted text-sm">No events match.</td>
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
