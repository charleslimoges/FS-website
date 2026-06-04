import { NextRequest, NextResponse } from "next/server";
import { searchBuildingsByQuery } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const suggestions = await searchBuildingsByQuery(q);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("building-suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
