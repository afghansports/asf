import { NextResponse, type NextRequest } from "next/server";
import { submitContact } from "@/app/(marketing)/contact/actions";

/**
 * POST /api/contact
 * Body: { name, email, phone?, phoneCountryCode?, subject, message }
 * Returns: { success: boolean, message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      phoneCountryCode?: string;
      subject?: string;
      message?: string;
    };
    const result = await submitContact({
      name: body.name ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      phoneCountryCode: body.phoneCountryCode ?? "1",
      subject: body.subject ?? "",
      message: body.message ?? "",
    });
    if (result.ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  } catch (e) {
    console.error("[api/contact]", e);
    return NextResponse.json({ success: false, message: "Bad request." }, { status: 400 });
  }
}
