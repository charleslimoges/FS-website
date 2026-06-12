import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import {
  adminGetBuildings,
  adminGetUnits,
  EDITABLE_UNIT_FIELDS,
  EDITABLE_BUILDING_FIELDS,
} from "@/lib/supabase/data";
import type { ListingStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const UNIT_BUCKET = "unit-media";
const BUILDING_BUCKET = "building-media";

const STATUSES: readonly ListingStatus[] = ["hidden", "active", "archived"];

/** Build the {status, published} pair for a status change (published mirrors active). */
function statusPatch(status: ListingStatus) {
  return { status, published: status === "active" };
}

/** GET /api/admin/listings?type=units|buildings — all rows incl. unpublished. */
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "units";
    if (type === "buildings") {
      return NextResponse.json({ buildings: await adminGetBuildings() });
    }
    return NextResponse.json({ units: await adminGetUnits() });
  } catch (error) {
    console.error("GET /api/admin/listings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/listings — update admin-owned fields.
 * Body: {
 *   type, airtable_id,
 *   status?: "hidden" | "active" | "archived", // lifecycle; `active` = live online
 *   published?,                                // legacy alias: true→active, false→hidden
 *   display_description?,                       // real admin column
 *   overrides?: Record<string, unknown>,       // sticky edits → `overrides` JSON
 *   resetFields?: string[]                     // remove keys from `overrides`
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const {
      type,
      airtable_id,
      status,
      published,
      display_description,
      overrides,
      resetFields,
    } = await req.json();
    if (!airtable_id) {
      return NextResponse.json({ error: "airtable_id required" }, { status: 400 });
    }
    const table = type === "buildings" ? "buildings" : "units";
    const allowed: readonly string[] =
      table === "buildings" ? EDITABLE_BUILDING_FIELDS : EDITABLE_UNIT_FIELDS;
    const supabase = getServiceClient();

    const patch: Record<string, unknown> = {};
    // Lifecycle change. Accept an explicit status, or fall back to the legacy
    // boolean (published:true → active, false → hidden).
    if (typeof status === "string") {
      if (!STATUSES.includes(status as ListingStatus)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      Object.assign(patch, statusPatch(status as ListingStatus));
    } else if (typeof published === "boolean") {
      Object.assign(patch, statusPatch(published ? "active" : "hidden"));
    }
    if (typeof display_description === "string")
      patch.display_description = display_description;

    // Merge sticky-edit overrides (validated against the editable whitelist).
    const wantsOverride =
      (overrides && typeof overrides === "object") ||
      (Array.isArray(resetFields) && resetFields.length > 0);
    if (wantsOverride) {
      const { data: row, error: readErr } = await (table === "buildings"
        ? supabase.from("buildings").select("overrides").eq("airtable_id", airtable_id)
        : supabase.from("units").select("overrides").eq("airtable_id", airtable_id)
      ).maybeSingle();
      if (readErr) throw new Error(readErr.message);
      const current: Record<string, unknown> =
        row?.overrides && typeof row.overrides === "object"
          ? { ...(row.overrides as Record<string, unknown>) }
          : {};
      if (overrides && typeof overrides === "object") {
        for (const [k, v] of Object.entries(overrides)) {
          if (allowed.includes(k)) current[k] = v;
        }
      }
      if (Array.isArray(resetFields)) {
        for (const k of resetFields) delete current[k];
      }
      patch.overrides = current;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error } =
      table === "buildings"
        ? await supabase.from("buildings").update(patch as never).eq("airtable_id", airtable_id)
        : await supabase.from("units").update(patch as never).eq("airtable_id", airtable_id);
    if (error) throw new Error(error.message);

    // Units and buildings each carry their own status now — no auto-reconcile.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/admin/listings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/listings — manually create a unit or building in Supabase
 * (no Airtable record). Gets a synthetic `manual-…` id and starts unpublished.
 * Body: { type: "units" | "buildings", fields: {…} }
 */
export async function POST(req: NextRequest) {
  try {
    const { type, fields } = await req.json();
    const table = type === "buildings" ? "buildings" : "units";
    const allowed: readonly string[] =
      table === "buildings" ? EDITABLE_BUILDING_FIELDS : EDITABLE_UNIT_FIELDS;
    const supabase = getServiceClient();
    const airtable_id = `manual-${crypto.randomUUID()}`;

    const row: Record<string, unknown> = {
      airtable_id,
      status: "hidden",
      published: false,
      images: [],
      videos: [],
      overrides: {},
    };
    for (const [k, v] of Object.entries(fields ?? {})) {
      if (allowed.includes(k)) row[k] = v;
    }
    if (table === "units") {
      // building_airtable_id links a manual unit to its building (FK).
      if (fields?.building_airtable_id)
        row.building_airtable_id = fields.building_airtable_id;
    }

    const { error } =
      table === "buildings"
        ? await supabase.from("buildings").insert(row as never)
        : await supabase.from("units").insert(row as never);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, airtable_id });
  } catch (error) {
    console.error("POST /api/admin/listings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/listings — remove a unit or building from the website
 * (Supabase only; Airtable is untouched). Deleting a building also removes its
 * units. Associated storage media is cleaned up.
 * Body: { type, airtable_id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { type, airtable_id } = await req.json();
    if (!airtable_id) {
      return NextResponse.json({ error: "airtable_id required" }, { status: 400 });
    }
    const table = type === "buildings" ? "buildings" : "units";
    const supabase = getServiceClient();

    // Permanent deletion is only allowed from the Archived state.
    const { data: current } = await (table === "buildings"
      ? supabase.from("buildings").select("status").eq("airtable_id", airtable_id)
      : supabase.from("units").select("status").eq("airtable_id", airtable_id)
    ).maybeSingle();
    if (current && current.status !== "archived") {
      return NextResponse.json(
        { error: "Listing must be archived before it can be deleted." },
        { status: 409 }
      );
    }

    if (type === "buildings") {
      // Remove child units first (FK), cleaning their media too.
      const { data: childUnits } = await supabase
        .from("units")
        .select("airtable_id")
        .eq("building_airtable_id", airtable_id);
      for (const u of childUnits ?? []) {
        await purgeMedia(supabase, UNIT_BUCKET, u.airtable_id);
      }
      await supabase.from("units").delete().eq("building_airtable_id", airtable_id);
      await purgeMedia(supabase, BUILDING_BUCKET, airtable_id);
      const { error } = await supabase
        .from("buildings")
        .delete()
        .eq("airtable_id", airtable_id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    await purgeMedia(supabase, UNIT_BUCKET, airtable_id);
    const { error } = await supabase
      .from("units")
      .delete()
      .eq("airtable_id", airtable_id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/listings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}

type Supabase = ReturnType<typeof getServiceClient>;

/** Delete every stored object under `<airtableId>/` in the given bucket. */
async function purgeMedia(supabase: Supabase, bucket: string, airtableId: string) {
  const { data: files } = await supabase.storage.from(bucket).list(airtableId);
  if (files?.length) {
    await supabase.storage
      .from(bucket)
      .remove(files.map((f) => `${airtableId}/${f.name}`));
  }
}

