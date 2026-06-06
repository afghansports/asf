import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { deleteNewsPost } from "../_actions";
import { NewsForm } from "./news-form";

export const metadata = { title: "Admin news" };

type SearchParams = { id?: string; new?: string };

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Editing existing post?
  if (sp.id) {
    const { data: post } = await supabase
      .from("news_posts")
      .select("id, title, slug, content, excerpt, image_url, is_published")
      .eq("id", sp.id)
      .maybeSingle();
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">
            {post ? "Edit post" : "New post"}
          </h1>
          <Link href="/admin/news" className="text-sm text-asf-muted hover:text-asf-text">
            Back to list
          </Link>
        </div>
        <NewsForm
          userId={user.id}
          initial={
            post
              ? {
                  id: post.id,
                  title: post.title,
                  slug: post.slug,
                  content: post.content ?? "",
                  excerpt: post.excerpt ?? "",
                  imageUrl: post.image_url,
                  isPublished: !!post.is_published,
                }
              : {}
          }
        />
      </div>
    );
  }

  if (sp.new) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-3xl text-asf-text">New post</h1>
          <Link href="/admin/news" className="text-sm text-asf-muted hover:text-asf-text">
            Back to list
          </Link>
        </div>
        <NewsForm userId={user.id} initial={{}} />
      </div>
    );
  }

  // List
  const { data: rows } = await supabase
    .from("news_posts")
    .select("id, title, slug, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">News</h1>
        <Link
          href="/admin/news?new=1"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark"
        >
          <PlusCircle className="w-3.5 h-3.5" aria-hidden />
          New post
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-asf-border">
                <td className="px-4 py-3">
                  <Link href={`/news/${r.slug}`} className="text-asf-text hover:text-asf-red font-medium">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.is_published ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-off-2 text-asf-muted text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-asf-muted">
                  {(r.published_at ?? r.created_at) && new Date(r.published_at ?? r.created_at).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link
                      href={`/admin/news?id=${r.id}`}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-asf-off-2 text-asf-text text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy hover:text-white"
                    >
                      <Edit3 className="w-3 h-3" aria-hidden />
                      Edit
                    </Link>
                    <ActionButton
                      action={() => deleteNewsPost(r.id)}
                      label="Delete"
                      variant="danger"
                      confirm="Delete this news post?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-asf-muted text-sm">No posts yet.</td>
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
