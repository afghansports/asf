"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AdminResult = { ok: true } | { ok: false; message: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false as const, message: "Admin access required." };
  return { ok: true as const, supabase: createServiceClient(), userId: user.id };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ----------------------------- CHAPTERS ----------------------------- */

export async function saveChapter(input: {
  id?: string;
  name: string;
  description: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  managerUsername: string;
  foundedYear: number | null;
  isActive: boolean;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  let managerId: string | null = null;
  if (input.managerUsername) {
    const { data: u } = await ctx.supabase
      .from("profiles")
      .select("id")
      .eq("username", input.managerUsername.toLowerCase())
      .maybeSingle();
    if (!u) return { ok: false, message: `No user with username @${input.managerUsername}.` };
    managerId = u.id;
  }

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description.trim() || null,
    country_code: input.countryCode || "US",
    state_province: input.stateProvince || null,
    city: input.city.trim() || null,
    manager_id: managerId,
    founded_year: input.foundedYear,
    is_active: input.isActive,
  };
  // Only set image URLs if provided so we don't blank them on edit.
  if (input.logoUrl !== undefined)   payload.logo_url   = input.logoUrl;
  if (input.bannerUrl !== undefined) payload.banner_url = input.bannerUrl;

  if (input.id) {
    const { error } = await ctx.supabase.from("chapters").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("chapters").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/chapters");
  revalidatePath("/chapters");
  return { ok: true };
}

export async function deleteChapter(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("chapters").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/chapters");
  revalidatePath("/chapters");
  return { ok: true };
}

/* ----------------------------- TOURNAMENTS ----------------------------- */

export async function saveTournament(input: {
  id?: string;
  name: string;
  sport: string;
  format: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  city: string;
  stateProvince: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  bannerUrl?: string | null;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    slug: slugify(input.name),
    sport: input.sport,
    format: input.format,
    description: input.description.trim() || null,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    city: input.city.trim() || null,
    state_province: input.stateProvince || null,
    status: input.status,
    is_published: input.isPublished,
    is_featured: input.isFeatured,
  };
  if (input.bannerUrl !== undefined) payload.banner_url = input.bannerUrl;

  if (input.id) {
    const { error } = await ctx.supabase.from("tournaments").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("tournaments").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  return { ok: true };
}

export async function deleteTournament(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("tournaments").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  return { ok: true };
}

/* ----------------------------- MATCHES (ADMIN) ----------------------------- */

export async function createAdminMatch(input: {
  sport: string;
  homeTeamId: string;
  awayTeamId: string;
  status: string; // 'scheduled' | 'confirmed'
  scheduledFor: string | null;
  playedAt: string | null;
  venue: string;
  city: string;
  state: string;
  homeScore: number | null;
  awayScore: number | null;
  notes: string;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  if (!input.sport) return { ok: false, message: "Sport is required." };
  if (!input.homeTeamId || !input.awayTeamId) return { ok: false, message: "Both teams are required." };
  if (input.homeTeamId === input.awayTeamId)
    return { ok: false, message: "Home and away must be different teams." };

  const status = input.status === "confirmed" ? "confirmed" : "scheduled";
  if (status === "confirmed" && (input.homeScore == null || input.awayScore == null)) {
    return { ok: false, message: "Both scores are required to record a finished result." };
  }

  const payload: Record<string, unknown> = {
    sport: input.sport,
    home_team_id: input.homeTeamId,
    away_team_id: input.awayTeamId,
    status,
    scheduled_for: input.scheduledFor || null,
    venue: input.venue.trim() || null,
    city: input.city.trim() || null,
    state_province: input.state || null,
    notes: input.notes.trim() || null,
  };
  if (status === "confirmed") {
    payload.home_score = input.homeScore;
    payload.away_score = input.awayScore;
    payload.played_at = input.playedAt || new Date().toISOString();
    payload.confirmed_by = ctx.userId;
    payload.confirmed_at = new Date().toISOString();
  } else {
    payload.played_at = input.playedAt || null;
  }

  const { error } = await ctx.supabase.from("matches").insert(payload);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  return { ok: true };
}

export async function adminConfirmMatch(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("matches")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  return { ok: true };
}

export async function deleteMatch(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("matches").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  return { ok: true };
}

/* ----------------------------- AUTO-CONFIRM CRON ----------------------------- */

/**
 * Routine: confirm all reported matches older than 48h.
 * Hit /api/cron/auto-confirm to invoke (auth via x-asf-cron-key header).
 */
export async function autoConfirmStaleMatches(): Promise<{ confirmed: number }> {
  const supabase = createServiceClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);
  const { data, error } = await supabase
    .from("matches")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("status", "reported")
    .lt("reported_at", cutoff.toISOString())
    .select("id");
  if (error) {
    console.error("[matches/auto-confirm]", error);
    return { confirmed: 0 };
  }
  return { confirmed: (data ?? []).length };
}
