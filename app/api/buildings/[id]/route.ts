import { NextRequest, NextResponse } from "next/server";
import { getPublishedBuildingById } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const building = await getPublishedBuildingById(params.id);
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
