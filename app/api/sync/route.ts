import { NextRequest, NextResponse } from "next/server";
import {
  addBuildingsByAirtableId,
  addUnitsByAirtableId,
  resyncAll,
} from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured (local dev) → allow
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * GET /api/sync — full re-sync of everything already in Supabase.
 * Triggered by the Vercel daily cron and the admin "Sync now" button.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await resyncAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("GET /api/sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync — add specific Airtable records into Supabase (unpublished).
 * Body: { table: "units" | "buildings", ids: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { table, ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    if (table === "units") {
      const result = await addUnitsByAirtableId(ids);
      return NextResponse.json({ ok: true, ...result });
    }
    if (table === "buildings") {
      const count = await addBuildingsByAirtableId(ids);
      return NextResponse.json({ ok: true, buildings: count });
    }
    return NextResponse.json(
      { error: "table must be 'units' or 'buildings'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Add failed" },
      { status: 500 }
    );
  }
}
