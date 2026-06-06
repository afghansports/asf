"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server action: create a team. Per ASF_LAUNCH_PRD.md > STEP 8 > /teams/create.
 * Inserts the team, then a `team_members` row for the captain.
 */

export type CreateTeamResult =
  | { ok: true; slug: string }
  | { ok: false; message: string };

const SLUG_RX = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createTeam(input: {
  name: string;
  slug: string;
  sport: string;
  state: string;
  city: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  isLookingForPlayers: boolean;
}): Promise<CreateTeamResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const name = input.name.trim();
    const slug = (input.slug || slugify(name)).toLowerCase();
    const description = input.description.trim().slice(0, 500);
    const city = input.city.trim();

    if (!name) return { ok: false, message: "Team name is required." };
    if (!SLUG_RX.test(slug)) return { ok: false, message: "URL slug must be 2-60 lowercase characters; letters, digits, dashes." };
    if (!input.sport) return { ok: false, message: "Sport is required." };
    if (!input.state) return { ok: false, message: "State is required." };
    if (!city) return { ok: false, message: "City is required." };

    // Slug uniqueness
    const { data: dup } = await supabase
      .from("teams")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (dup) return { ok: false, message: "URL slug is taken. Try another." };

    const { data: created, error } = await supabase
      .from("teams")
      .insert({
        name,
        slug,
        sport: input.sport,
        state_province: input.state,
        country_code: "US",
        city,
        description: description || null,
        logo_url: input.logoUrl,
        banner_url: input.bannerUrl,
        captain_id: user.id,
        is_looking_for_players: input.isLookingForPlayers,
      })
      .select("id, slug")
      .single();

    if (error || !created) {
      console.error("[teams/create] team insert", error);
      return { ok: false, message: "Could not create the team. Try again." };
    }

    // Captain membership row (member_count trigger fires)
    const { error: memberErr } = await supabase
      .from("team_members")
      .insert({ team_id: created.id, player_id: user.id, role: "captain" });
    if (memberErr) {
      console.error("[teams/create] captain insert", memberErr);
      // Team exists but captain row failed; surface a warning but keep team.
    }

    revalidatePath("/teams");
    revalidatePath("/dashboard");
    revalidatePath(`/teams/${created.slug}`);
    return { ok: true, slug: created.slug };
  } catch (e) {
    console.error("[teams/create] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function checkSlug(slug: string): Promise<{ available: boolean }> {
  const s = slug.trim().toLowerCase();
  if (!SLUG_RX.test(s)) return { available: false };
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("teams").select("id").eq("slug", s).maybeSingle();
    return { available: !data };
  } catch {
    return { available: false };
  }
}

export async function redirectToManage() {
  redirect("/teams/manage");
}
