"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Create an event. Per ASF_LAUNCH_PRD.md > STEP 9 > /events/create.
 * Inserts with is_published=false; admin reviews in /admin/events.
 */

export type CreateEventResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export async function createEvent(input: {
  title: string;
  eventType: string;
  sport: string | null;
  description: string;
  bannerUrl: string | null;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string | null;
  endTime: string | null;
  state: string;
  city: string;
  venueName: string;
  address: string;
  isFree: boolean;
  registrationLink: string;
  organizerTeamId: string | null;
}): Promise<CreateEventResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const title = input.title.trim();
    if (!title) return { ok: false, message: "Title is required." };
    if (!input.eventType) return { ok: false, message: "Event type is required." };
    if (!input.startDate || !input.startTime) {
      return { ok: false, message: "Start date and time are required." };
    }
    if (!input.state) return { ok: false, message: "State is required." };
    if (!input.city.trim()) return { ok: false, message: "City is required." };

    const startIso = new Date(`${input.startDate}T${input.startTime}:00`).toISOString();
    const endIso =
      input.endDate && input.endTime
        ? new Date(`${input.endDate}T${input.endTime}:00`).toISOString()
        : null;

    // Slug uniqueness with timestamp suffix to keep it simple
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: created, error } = await supabase
      .from("events")
      .insert({
        title,
        slug,
        event_type: input.eventType,
        sport: input.sport,
        description: input.description.trim() || null,
        banner_url: input.bannerUrl,
        start_datetime: startIso,
        end_datetime: endIso,
        state_province: input.state,
        city: input.city.trim(),
        venue_name: input.venueName.trim() || null,
        address: input.address.trim() || null,
        is_free: input.isFree,
        registration_link: input.registrationLink.trim() || null,
        organizer_id: user.id,
        organizer_team_id: input.organizerTeamId,
        is_published: false,
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("[events/create]", error);
      return { ok: false, message: "Could not submit the event." };
    }

    revalidatePath("/events");
    revalidatePath("/dashboard");
    return { ok: true, id: created.id };
  } catch (e) {
    console.error("[events/create] unexpected:", e);
    return { ok: false, message: "Something went wrong." };
  }
}
