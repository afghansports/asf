"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Admin server actions. Each one verifies that the caller is an admin
 * (defence in depth on top of RLS / route-level auth).
 */

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

/* -------------------------------- EVENTS -------------------------------- */

export async function approveEvent(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("events").update({ is_published: true }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true };
}

export async function rejectEvent(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/events");
  return { ok: true };
}

export async function toggleEventFeatured(id: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("events").update({ is_featured: value }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/events");
  return { ok: true };
}

export async function saveAdminEvent(input: {
  id: string;
  title: string;
  eventType: string;
  sport: string | null;
  city: string;
  state: string;
  startDatetime: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  bannerUrl?: string | null;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    event_type: input.eventType,
    sport: input.sport,
    city: input.city.trim(),
    state_province: input.state,
    start_datetime: input.startDatetime || null,
    is_published: input.isPublished,
    is_featured: input.isFeatured,
  };
  if (input.bannerUrl !== undefined) payload.banner_url = input.bannerUrl;
  const { error } = await ctx.supabase.from("events").update(payload).eq("id", input.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true };
}

/* -------------------------------- GALLERY ------------------------------- */

export async function addGalleryImage(input: {
  imageUrl: string;
  caption: string;
  eventName: string;
  year: number | null;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("gallery_images").insert({
    image_url: input.imageUrl,
    caption: input.caption || null,
    event_name: input.eventName || null,
    year: input.year,
    is_published: true,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function deleteGalleryImage(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("gallery_images").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function updateGalleryImage(input: {
  id: string;
  caption: string;
  eventName: string;
  year: number | null;
  sortOrder: number;
  isPublished: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("gallery_images")
    .update({
      caption: input.caption || null,
      event_name: input.eventName || null,
      year: input.year,
      sort_order: input.sortOrder,
      is_published: input.isPublished,
    })
    .eq("id", input.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

/* --------------------------------- NEWS --------------------------------- */

export async function saveNewsPost(input: {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  isPublished: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const supabase = ctx.supabase;

  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    slug: input.slug.trim().toLowerCase(),
    content: input.content,
    excerpt: input.excerpt.slice(0, 160) || null,
    image_url: input.imageUrl,
    is_published: input.isPublished,
    published_at: input.isPublished ? new Date().toISOString() : null,
  };

  if (input.id) {
    const { error } = await supabase.from("news_posts").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("news_posts").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { ok: true };
}

export async function deleteNewsPost(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("news_posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { ok: true };
}

/* --------------------------------- USERS -------------------------------- */

export async function toggleUserAdmin(profileId: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("profiles").update({ is_admin: value }).eq("id", profileId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserActive(profileId: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("profiles").update({ is_active: value }).eq("id", profileId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

/* ------------------------------ RECOVERY -------------------------------- */

export async function approveRecoveryRequest(
  requestId: string,
  matchedUserId: string
): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const { data: req, error: loadErr } = await ctx.supabase
    .from("account_recovery_requests")
    .select("id, new_email, status")
    .eq("id", requestId)
    .maybeSingle();
  if (loadErr) return { ok: false, message: loadErr.message };
  if (!req) return { ok: false, message: "Request not found." };
  if (req.status !== "pending") return { ok: false, message: "This request has already been handled." };

  // Move the account to the email the user now controls.
  const { error: updErr } = await ctx.supabase.auth.admin.updateUserById(matchedUserId, {
    email: req.new_email as string,
    email_confirm: true,
  });
  if (updErr) return { ok: false, message: `Could not update email: ${updErr.message}` };

  // Best-effort: send a password reset so they can set a new password. Requires
  // email delivery (RESEND) to be configured for the link to actually arrive.
  try {
    await ctx.supabase.auth.resetPasswordForEmail(req.new_email as string, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password`,
    });
  } catch {
    /* non-fatal: the user can use forgot-password once email is configured */
  }

  const { error: markErr } = await ctx.supabase
    .from("account_recovery_requests")
    .update({
      status: "approved",
      matched_user_id: matchedUserId,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (markErr) return { ok: false, message: markErr.message };

  revalidatePath("/admin/recovery");
  return { ok: true };
}

export async function denyRecoveryRequest(requestId: string, notes: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("account_recovery_requests")
    .update({
      status: "denied",
      review_notes: notes || null,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/recovery");
  return { ok: true };
}

/* --------------------------------- TEAMS -------------------------------- */

export async function toggleTeamAffiliate(teamId: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("teams").update({ is_asf_affiliate: value }).eq("id", teamId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  return { ok: true };
}

export async function toggleTeamActive(teamId: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("teams").update({ is_active: value }).eq("id", teamId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  return { ok: true };
}

/* -------------------------------- CONTACTS ------------------------------ */

export async function markContactRead(id: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("contact_submissions").update({ is_read: value }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/contacts");
  return { ok: true };
}

export async function deleteContactSubmission(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("contact_submissions").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/contacts");
  return { ok: true };
}

export async function deleteNewsletterSignup(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("newsletter_signups").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/newsletter");
  return { ok: true };
}

/* ----------------------------- TEAM MEMBERS ----------------------------- */

export async function saveTeamMember(input: {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string | null;
  category: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const payload = {
    name: input.name.trim(),
    role: input.role.trim(),
    bio: input.bio.trim() || null,
    photo_url: input.photoUrl,
    category: input.category,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await ctx.supabase.from("management_team").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("management_team").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/team-members");
  revalidatePath("/about/team");
  return { ok: true };
}

export async function deleteTeamMember(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("management_team").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/team-members");
  revalidatePath("/about/team");
  return { ok: true };
}

/* -------------------------------- SPONSORS ------------------------------- */

export async function saveSponsor(input: {
  id?: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  tier: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const payload = {
    name: input.name.trim(),
    logo_url: input.logoUrl,
    website_url: input.websiteUrl.trim() || null,
    tier: input.tier,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await ctx.supabase.from("sponsors").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("sponsors").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/sponsors");
  revalidatePath("/sponsors");
  return { ok: true };
}

export async function deleteSponsor(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("sponsors").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/sponsors");
  revalidatePath("/sponsors");
  return { ok: true };
}

/* ---------------------------------- FAQ ---------------------------------- */

export async function saveFaqItem(input: {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const payload = {
    question: input.question.trim(),
    answer: input.answer.trim(),
    category: input.category,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await ctx.supabase.from("faq_items").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("faq_items").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

export async function deleteFaqItem(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("faq_items").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

/* -------------------------------- HISTORY -------------------------------- */

export async function saveHistoryEntry(input: {
  id?: string;
  year: number;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const payload = {
    year: input.year,
    title: input.title.trim(),
    description: input.description.trim() || null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await ctx.supabase.from("history_timeline").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("history_timeline").insert(payload);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/history");
  revalidatePath("/about/history");
  return { ok: true };
}

export async function deleteHistoryEntry(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("history_timeline").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/history");
  revalidatePath("/about/history");
  return { ok: true };
}
