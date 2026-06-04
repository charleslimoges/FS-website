import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, interested_in_unit, unit_or_building } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log to Airtable if available, else console
    try {
      const { logContactForm } = await import("@/lib/airtable");
      await logContactForm({ name, email, phone, message, interested_in_unit, unit_or_building });
    } catch {
      console.log("Contact form submission:", { name, email, phone, message });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
