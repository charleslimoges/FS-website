import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { MediaItem, Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Table = "buildings" | "units";
type Column = "images" | "videos";

function resolve(type: string): { table: Table; bucket: string } {
  if (type === "building")
    return { table: "buildings", bucket: "building-media" };
  return { table: "units", bucket: "unit-media" };
}

type Supabase = ReturnType<typeof getServiceClient>;

async function readMedia(
  supabase: Supabase,
  table: Table,
  column: Column,
  airtableId: string
): Promise<MediaItem[]> {
  const query =
    table === "buildings"
      ? supabase.from("buildings").select(column).eq("airtable_id", airtableId)
      : supabase.from("units").select(column).eq("airtable_id", airtableId);
  const { data, error } = await query.single();
  if (error) throw new Error(`Read row: ${error.message}`);
  const value = (data as Record<string, unknown>)?.[column];
  return Array.isArray(value) ? (value as MediaItem[]) : [];
}

async function writeMedia(
  supabase: Supabase,
  table: Table,
  column: Column,
  airtableId: string,
  media: MediaItem[]
): Promise<void> {
  const value = media as unknown as Json;
  const payload = column === "videos" ? { videos: value } : { images: value };
  const { error } =
    table === "buildings"
      ? await supabase.from("buildings").update(payload).eq("airtable_id", airtableId)
      : await supabase.from("units").update(payload).eq("airtable_id", airtableId);
  if (error) throw new Error(`Save: ${error.message}`);
}

/**
 * POST /api/admin/media (multipart) — upload an image/video to Supabase
 * Storage and append it to the row's images/videos JSON column.
 * Fields: type (building|unit), airtable_id, kind (image|video), file
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const type = String(form.get("type") ?? "unit");
    const airtable_id = String(form.get("airtable_id") ?? "");
    const kind = String(form.get("kind") ?? "image") === "video" ? "video" : "image";
    const file = form.get("file") as File | null;

    if (!airtable_id || !file) {
      return NextResponse.json(
        { error: "airtable_id and file required" },
        { status: 400 }
      );
    }

    const { table, bucket } = resolve(type);
    const column: Column = kind === "video" ? "videos" : "images";
    const supabase = getServiceClient();

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const path = `${airtable_id}/${kind}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(`Upload: ${upErr.message}`);

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const item: MediaItem = {
      url: pub.publicUrl,
      path,
      type: kind,
      filename: file.name,
    };

    const existing = await readMedia(supabase, table, column, airtable_id);
    const updated = [...existing, item];
    await writeMedia(supabase, table, column, airtable_id, updated);

    return NextResponse.json({ ok: true, item, media: updated });
  } catch (error) {
    console.error("POST /api/admin/media error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media — remove a media item.
 * Body: { type, airtable_id, kind, path }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { type, airtable_id, kind, path } = await req.json();
    if (!airtable_id || !path) {
      return NextResponse.json(
        { error: "airtable_id and path required" },
        { status: 400 }
      );
    }
    const { table, bucket } = resolve(type);
    const column: Column = kind === "video" ? "videos" : "images";
    const supabase = getServiceClient();

    await supabase.storage.from(bucket).remove([path]);

    const existing = await readMedia(supabase, table, column, airtable_id);
    const updated = existing.filter((m) => m.path !== path);
    await writeMedia(supabase, table, column, airtable_id, updated);

    return NextResponse.json({ ok: true, media: updated });
  } catch (error) {
    console.error("DELETE /api/admin/media error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
