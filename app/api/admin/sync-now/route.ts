import { NextResponse } from "next/server";
import { resyncAll } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/admin/sync-now — manual re-sync of all Supabase rows from Airtable. */
export async function POST() {
  try {
    const result = await resyncAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/admin/sync-now error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
