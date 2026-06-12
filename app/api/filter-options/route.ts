import { NextRequest, NextResponse } from "next/server";
import {
  getUnitFilterOptions,
  getBuildingFilterOptions,
} from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

/** GET /api/filter-options?type=units|buildings — distinct facet values for filter dropdowns. */
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "units";
    const options =
      type === "buildings"
        ? await getBuildingFilterOptions()
        : await getUnitFilterOptions();
    return NextResponse.json({ options });
  } catch (error) {
    console.error("GET /api/filter-options error:", error);
    return NextResponse.json(
      { error: "Failed to load filter options" },
      { status: 500 }
    );
  }
}
