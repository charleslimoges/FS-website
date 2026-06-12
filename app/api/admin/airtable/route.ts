import { NextRequest, NextResponse } from "next/server";
import { searchBuildingByAddress, getUnitsByBuilding } from "@/lib/airtable";
import { getServiceClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/airtable?address=... — live read-only lookup from Airtable
 * for the admin "Browse Airtable" view. Returns the building, its units, and
 * which of those already exist in Supabase (so the UI can show "Added").
 */
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address") ?? "";
    if (!address.trim()) {
      return NextResponse.json({ building: null, units: [] });
    }

    const building = await searchBuildingByAddress(address);
    if (!building) {
      return NextResponse.json({ building: null, units: [] });
    }

    const units = await getUnitsByBuilding(building.id);

    // Which of these are already in Supabase?
    const supabase = getServiceClient();
    const ids = units.map((u) => u.id);
    const { data: existing } = await supabase
      .from("units")
      .select("airtable_id")
      .in("airtable_id", ids.length ? ids : ["__none__"]);
    const existingIds = new Set((existing ?? []).map((r) => r.airtable_id));

    return NextResponse.json({
      building,
      units: units.map((u) => ({ ...u, in_supabase: existingIds.has(u.id) })),
    });
  } catch (error) {
    console.error("GET /api/admin/airtable error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
