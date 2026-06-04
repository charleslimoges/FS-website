import { NextRequest, NextResponse } from "next/server";
import { searchBuildingByAddress, getUnitsByBuilding } from "@/lib/airtable";
import { addBuilding, removeBuilding, addUnits, getStore } from "@/lib/store";
import { Building } from "@/lib/types";

export async function GET() {
  const store = getStore();
  const buildings = Object.values(store.buildings);
  return NextResponse.json({ buildings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === "lookup") {
      const { address } = body;
      if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

      const building = await searchBuildingByAddress(address);
      if (building) {
        const units = await getUnitsByBuilding(building.id);
        const store = getStore();
        const published_unit_ids = units
          .filter((u) => store.units.includes(u.id))
          .map((u) => u.id);
        return NextResponse.json({ building, units, published_unit_ids });
      }
      return NextResponse.json({ building: null, units: [], published_unit_ids: [] });
    }

    if (action === "get_units") {
      const { building_id } = body;
      if (!building_id) return NextResponse.json({ error: "Building ID required" }, { status: 400 });
      const units = await getUnitsByBuilding(building_id);
      const store = getStore();
      const published_unit_ids = units
        .filter((u) => store.units.includes(u.id))
        .map((u) => u.id);
      return NextResponse.json({ units, published_unit_ids });
    }

    if (action === "save") {
      const building: Building = {
        id: id ?? `local-${Date.now()}`,
        name: body.name ?? "",
        address: body.address ?? "",
        neighbourhood: body.neighbourhood ?? "",
        images: [],
        min_price: Number(body.min_price ?? 0),
        max_price: Number(body.max_price ?? 0),
        amenities: body.amenities ?? [],
        description: body.description ?? "",
        unit_count: Number(body.unit_count ?? 0),
        published: true,
      };
      addBuilding(building);

      if (body.unit_ids?.length) {
        addUnits(body.unit_ids);
      }

      return NextResponse.json({ building });
    }

    if (action === "remove") {
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      removeBuilding(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/building error:", error);
    return NextResponse.json({ error: "Admin operation failed" }, { status: 500 });
  }
}
