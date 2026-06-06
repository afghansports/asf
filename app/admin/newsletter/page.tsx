import { createClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/data/countries";
import { ExportCsvButton } from "./export-csv";
import { ActionButton } from "../_action-button";
import { deleteNewsletterSignup } from "../_actions";

export const metadata = { title: "Admin newsletter" };

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const { data: rows, count } = await supabase
    .from("newsletter_signups")
    .select("id, email, name, country_code, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  type Row = { id: string; email: string; name: string | null; country_code: string | null; created_at: string };
  const list = (rows ?? []) as Row[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text">Newsletter</h1>
          <p className="text-sm text-asf-muted mt-1">{count ?? list.length} subscribers</p>
        </div>
        <ExportCsvButton rows={list} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Country</Th>
              <Th>Subscribed</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const c = r.country_code ? COUNTRIES.find((x) => x.code === r.country_code) : undefined;
              return (
                <tr key={r.id} className="border-t border-asf-border">
                  <td className="px-4 py-3 text-asf-text">{r.email}</td>
                  <td className="px-4 py-3 text-asf-muted">{r.name ?? "-"}</td>
                  <td className="px-4 py-3 text-asf-muted">{c ? `${c.flag} ${c.name}` : r.country_code ?? "-"}</td>
                  <td className="px-4 py-3 text-asf-muted">
                    {new Date(r.created_at).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <ActionButton
                      action={() => deleteNewsletterSignup(r.id)}
                      label="Delete"
                      variant="danger"
                      confirm={`Delete subscriber ${r.email}?`}
                    />
                  </td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-asf-muted text-sm">No subscribers yet.</td>
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
