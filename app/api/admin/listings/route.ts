import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import {
  adminGetBuildings,
  adminGetUnits,
  EDITABLE_UNIT_FIELDS,
  EDITABLE_BUILDING_FIELDS,
} from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

const UNIT_BUCKET = "unit-media";
const BUILDING_BUCKET = "building-media";

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
 *   published?, display_description?,         // real admin columns
 *   overrides?: Record<string, unknown>,     // sticky edits → `overrides` JSON
 *   resetFields?: string[]                   // remove keys from `overrides`
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const {
      type,
      airtable_id,
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
    if (typeof published === "boolean") patch.published = published;
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

    // Unit-centric model: a building is public iff it has ≥1 published unit.
    if (table === "units" && typeof published === "boolean") {
      await reconcileBuildingPublished(supabase, airtable_id);
    }

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
    const supabase = getServiceClient();

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

    // Capture the parent before deleting so we can reconcile it afterward.
    const { data: before } = await supabase
      .from("units")
      .select("building_airtable_id")
      .eq("airtable_id", airtable_id)
      .maybeSingle();
    await purgeMedia(supabase, UNIT_BUCKET, airtable_id);
    const { error } = await supabase
      .from("units")
      .delete()
      .eq("airtable_id", airtable_id);
    if (error) throw new Error(error.message);
    // A building may now have zero published units → reconcile.
    if (before?.building_airtable_id) {
      await reconcileBuildingForId(supabase, before.building_airtable_id).catch(
        () => {}
      );
    }
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

/** Set a unit's parent building published = (it has ≥1 published unit). */
async function reconcileBuildingPublished(supabase: Supabase, unitId: string) {
  const { data: unitRow } = await supabase
    .from("units")
    .select("building_airtable_id")
    .eq("airtable_id", unitId)
    .maybeSingle();
  if (unitRow?.building_airtable_id)
    await reconcileBuildingForId(supabase, unitRow.building_airtable_id);
}

/** Set buildings.published = (building has ≥1 published unit). */
async function reconcileBuildingForId(supabase: Supabase, buildingId: string) {
  const { count } = await supabase
    .from("units")
    .select("airtable_id", { count: "exact", head: true })
    .eq("building_airtable_id", buildingId)
    .eq("published", true);
  await supabase
    .from("buildings")
    .update({ published: (count ?? 0) > 0 })
    .eq("airtable_id", buildingId);
}
