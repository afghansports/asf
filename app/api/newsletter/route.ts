import { NextResponse, type NextRequest } from "next/server";
import { subscribeNewsletter } from "@/components/layout/newsletter-actions";

/**
 * POST /api/newsletter
 * Body: { email: string, name?: string }
 * Returns: { success: boolean, message?: string }
 *
 * Thin wrapper around the subscribeNewsletter server action so external
 * callers (forms posting from a static page, etc.) can use REST.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body?.email ?? "";
    const result = await subscribeNewsletter(email);
    if (result.ok) {
      const isAlready = result.message.toLowerCase().includes("already");
      return NextResponse.json({
        success: true,
        message: isAlready ? "already_subscribed" : "subscribed",
      });
    }
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  } catch (e) {
    console.error("[api/newsletter]", e);
    return NextResponse.json({ success: false, message: "Bad request." }, { status: 400 });
  }
}
