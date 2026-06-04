import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, preferred_date, preferred_time, unit_id, building_id, notes } = body;

    if (!name || !email || !phone || !preferred_date || !preferred_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      const { logBookVisit } = await import("@/lib/airtable");
      await logBookVisit({ name, email, phone, preferred_date, preferred_time, unit_id, building_id, notes });
    } catch {
      console.log("Visit booking:", { name, email, phone, preferred_date, preferred_time, unit_id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/book-visit error:", error);
    return NextResponse.json(
      { error: "Failed to book visit" },
      { status: 500 }
    );
  }
}
