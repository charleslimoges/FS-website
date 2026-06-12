import { NextRequest, NextResponse } from "next/server";
import { getPublishedUnits } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const buildings = searchParams.getAll("building");
    const building_id = searchParams.get("building_id") ?? undefined;
    const min_price = searchParams.get("min_price")
      ? Number(searchParams.get("min_price"))
      : undefined;
    const max_price = searchParams.get("max_price")
      ? Number(searchParams.get("max_price"))
      : undefined;
    const bedrooms = searchParams.getAll("bedrooms").map(Number);
    const bathrooms = searchParams.getAll("bathrooms").map(Number);
    const promo = searchParams.get("promo") === "true" ? true : undefined;
    const parking = searchParams.getAll("parking");
    const utilities_included =
      searchParams.get("utilities_included") === "true" ? true : undefined;
    const utilities = searchParams.getAll("utilities");
    const amenities = searchParams.getAll("amenities");
    const appliances = searchParams.getAll("appliances");
    const pets = searchParams.getAll("pets");
    const neighbourhood = searchParams.getAll("neighbourhood");
    const furnished =
      searchParams.get("furnished") === "true" ? true : undefined;
    const available_now =
      searchParams.get("available_now") === "true" ? true : undefined;

    const units = await getPublishedUnits({
      building_id,
      buildings: buildings.length ? buildings : undefined,
      min_price,
      max_price,
      bedrooms: bedrooms.length ? bedrooms : undefined,
      bathrooms: bathrooms.length ? bathrooms : undefined,
      promo,
      parking: parking.length ? parking : undefined,
      utilities_included,
      utilities: utilities.length ? utilities : undefined,
      amenities: amenities.length ? amenities : undefined,
      appliances: appliances.length ? appliances : undefined,
      pets: pets.length ? pets : undefined,
      neighbourhood: neighbourhood.length ? neighbourhood : undefined,
      furnished,
      available_now,
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("GET /api/units error:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}
