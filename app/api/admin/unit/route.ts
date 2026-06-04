import { NextRequest, NextResponse } from "next/server";
import { searchBuildingByAddress, getUnitsByBuilding, getUnits } from "@/lib/airtable";
import { addUnits, removeUnit, isUnitPublished } from "@/lib/store";

export async function GET() {
  try {
    const units = await getUnits({});
    return NextResponse.json({ units });
  } catch (error) {
    console.error("GET /api/admin/unit error:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === "lookup") {
      const { address, unit_number } = body;
      if (!address || !unit_number) {
        return NextResponse.json({ error: "Address and unit number required" }, { status: 400 });
      }

      const building = await searchBuildingByAddress(address);
      if (!building) return NextResponse.json({ unit: null });

      const units = await getUnitsByBuilding(building.id);
      const unit = units.find(
        (u) => u.unit_number.trim().toLowerCase() === unit_number.trim().toLowerCase()
      );
      if (!unit) return NextResponse.json({ unit: null });

      return NextResponse.json({ unit: { ...unit, published: isUnitPublished(unit.id) } });
    }

    if (action === "publish") {
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      addUnits([id]);
      return NextResponse.json({ success: true, published: true });
    }

    if (action === "unpublish") {
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      removeUnit(id);
      return NextResponse.json({ success: true, published: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/unit error:", error);
    return NextResponse.json({ error: "Admin operation failed" }, { status: 500 });
  }
}
