import { NextRequest, NextResponse } from "next/server";
import { getBuildingById } from "@/lib/airtable";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const building = await getBuildingById(params.id);
    if (!building) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ building });
  } catch (error) {
    console.error("GET /api/buildings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch building" },
      { status: 500 }
    );
  }
}
