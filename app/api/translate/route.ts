import { NextResponse } from "next/server";
import { translateMany, isTranslatable } from "@/lib/i18n/translate";

// node runtime: the translate engine uses node:crypto + the service-role client.
export const runtime = "nodejs";

/**
 * POST { texts: string[], locale: "fa-AF" | "ps" } -> { translations: string[] }
 * Backs the client-side AutoTranslate layer. Translations are cached server-side
 * (content_translations), so repeated UI strings cost one Azure call ever.
 */
export async function POST(req: Request) {
  let body: { texts?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ translations: [] }, { status: 400 });
  }

  const locale = typeof body.locale === "string" ? body.locale : "";
  const texts = Array.isArray(body.texts)
    ? body.texts.filter((t): t is string => typeof t === "string").slice(0, 300).map((t) => t.slice(0, 2000))
    : [];

  if (!isTranslatable(locale) || texts.length === 0) {
    return NextResponse.json({ translations: texts });
  }

  const translations = await translateMany(texts, locale);
  return NextResponse.json({ translations });
}
