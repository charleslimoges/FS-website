import { NextRequest, NextResponse } from "next/server";
import { getBuildings } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const neighbourhood = searchParams.getAll("neighbourhood");
    const min_price = searchParams.get("min_price")
      ? Number(searchParams.get("min_price"))
      : undefined;
    const max_price = searchParams.get("max_price")
      ? Number(searchParams.get("max_price"))
      : undefined;
    const amenities = searchParams.getAll("amenities");

    const buildings = await getBuildings({
      neighbourhood: neighbourhood.length ? neighbourhood : undefined,
      min_price,
      max_price,
      amenities: amenities.length ? amenities : undefined,
    });

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error("GET /api/buildings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 }
    );
  }
}
