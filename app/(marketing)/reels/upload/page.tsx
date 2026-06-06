import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = {
  title: "Upload reel",
  description: "Share a short video with the ASF community.",
};

export default async function UploadReelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/reels/upload");

  return (
    <>
      <PageHero
        eyebrow="Upload reel"
        title="Share your moment."
        subtitle="Vertical or horizontal, any sport, any country. Pick a country and sport so the community can find it."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          <UploadForm userId={user.id} />
        </div>
      </section>
    </>
  );
}
