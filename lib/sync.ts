import { getServiceClient } from "./supabase/client";
import { BuildingInsert, UnitInsert } from "./supabase/types";

// ─── Airtable REST access (read-only) ────────────────────────────────────────

const BASE_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appFNSgmVZkW5d2t3";
const API_KEY = process.env.AIRTABLE_API_KEY!;

const BUILDINGS_TABLE = "Building Summary";
const UNITS_TABLE = "Units";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function airtableFetch(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/${BASE_ID}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

async function getRecord(table: string, id: string): Promise<AirtableRecord> {
  return airtableFetch(
    `/${encodeURIComponent(table)}/${id}`
  ) as Promise<AirtableRecord>;
}

// ─── Field coercion helpers ──────────────────────────────────────────────────

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function strOrNull(v: unknown): string | null {
  const s = str(v).trim();
  return s.length ? s : null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** singleSelect → string; lookup/multi → first string. */
function selectName(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length ? selectName(v[0]) : "";
  if (v && typeof v === "object" && "name" in (v as object)) {
    return (v as { name: string }).name;
  }
  return v === null || v === undefined ? "" : String(v);
}

/** multipleSelects / multipleLookupValues → string[]. */
function selectNames(v: unknown): string[] {
  if (!Array.isArray(v)) {
    const s = selectName(v);
    return s ? [s] : [];
  }
  return v
    .map((item) =>
      typeof item === "string"
        ? item
        : item && typeof item === "object" && "name" in item
        ? (item as { name: string }).name
        : String(item)
    )
    .filter(Boolean);
}

/** First value of a lookup array, as scalar text. */
function lookupScalar(v: unknown): string | null {
  const arr = selectNames(v);
  return arr.length ? arr.join(", ") : null;
}

/** Parse a Quebec/standard bedroom label into an integer count. "Studio" → 0. */
function parseBeds(label: string): number {
  if (!label) return 0;
  if (/studio/i.test(label)) return 0;
  const m = label.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function parseBaths(label: string): number {
  if (!label) return 1;
  const m = label.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : 1;
}

// ─── Mappers: Airtable record → Supabase insert (🔵 synced fields only) ───────

export function mapBuilding(record: AirtableRecord): BuildingInsert {
  const f = record.fields;
  return {
    airtable_id: record.id,
    name: strOrNull(f["Building"]),
    neighbourhood: selectNames(f["Neighbourhood"]),
    metro_station: selectNames(f["Metro Station"]),
    amenities: selectNames(f["Amenities"]),
    utilities: selectNames(f["Utilities"]),
    pets: selectNames(f["Pets"]),
    parking: selectNames(f["Parking"]),
    parking_price: strOrNull(f["Parking Price"]),
    partner: selectNames(f["Partner"]),
    partner_doc: strOrNull(f["Partner Doc"]),
    external_inventory: strOrNull(f["External Inventory"]),
    active_status: strOrNull(f["Active"]),
    last_synced_at: new Date().toISOString(),
  };
}

export function mapUnit(record: AirtableRecord): UnitInsert {
  const f = record.fields;

  const buildingLink = f["Building"];
  const building_airtable_id = Array.isArray(buildingLink)
    ? str(buildingLink[0]) || null
    : strOrNull(buildingLink);

  // "Building - Unit" formula yields e.g. "37 av. Broadway (O-Rive) - 319"
  const buildingUnit = str(f["Building - Unit"]);
  const lastDash = buildingUnit.lastIndexOf(" - ");
  const building_name =
    lastDash > -1 ? buildingUnit.slice(0, lastDash) : buildingUnit || null;

  const bedsLabel = selectName(f["🛏"]);
  const bathsLabel = selectName(f["🛁"]);

  return {
    airtable_id: record.id,
    building_airtable_id,
    unit_number: strOrNull(f["Unit Number"]),
    bedrooms: parseBeds(bedsLabel),
    bedrooms_label: bedsLabel || null,
    bathrooms: parseBaths(bathsLabel),
    bathrooms_label: bathsLabel || null,
    sqft: num(f["Sqft"]),
    price: num(f["Price"]),
    promo: num(f["Promo"]),
    furnished: Boolean(f["Furnished"]),
    appliances: selectNames(f["Appliances"]),
    apartment_status: strOrNull(f["Apartment Status"]),
    application_status: selectNames(f["Application Status - All"]),
    active: lookupScalar(f["Active"]),
    available_date: strOrNull(f["Available"]),
    notes: strOrNull(f["Notes"]),
    notes_contact_info: strOrNull(f["Notes/Contact Info"]),
    building_name,
    neighbourhood: selectNames(f["Neighborhood"]),
    metro_station: selectNames(f["Metro Station"]),
    amenities: selectNames(f["Amenities"]),
    utilities: selectNames(f["Utilities"]),
    pets: selectNames(f["Pets"]),
    parking: selectNames(f["Parking"]),
    parking_price: lookupScalar(f["Parking Price"]),
    partner: selectNames(f["Partner"]),
    external_inventory: lookupScalar(f["External Inventory"]),
    partner_doc: lookupScalar(f["Partner Doc"]),
    last_synced_at: new Date().toISOString(),
  };
}

// ─── Upsert (two-zone rule: only 🔵 columns in payload → 🟢 preserved) ────────

export async function upsertBuildings(
  records: AirtableRecord[]
): Promise<number> {
  if (!records.length) return 0;
  const supabase = getServiceClient();
  const rows = records.map(mapBuilding);
  const { error } = await supabase
    .from("buildings")
    .upsert(rows, { onConflict: "airtable_id" });
  if (error) throw new Error(`Supabase buildings upsert: ${error.message}`);
  return rows.length;
}

export async function upsertUnits(records: AirtableRecord[]): Promise<number> {
  if (!records.length) return 0;
  const supabase = getServiceClient();
  const rows = records.map(mapUnit);
  const { error } = await supabase
    .from("units")
    .upsert(rows, { onConflict: "airtable_id" });
  if (error) throw new Error(`Supabase units upsert: ${error.message}`);
  return rows.length;
}

// ─── Public sync operations ──────────────────────────────────────────────────

/**
 * Add specific units to Supabase by their Airtable record IDs. Also ensures
 * each unit's parent building is present (so the FK + building data exist).
 * New rows arrive unpublished; existing rows keep their admin media/publish.
 */
export async function addUnitsByAirtableId(
  unitIds: string[]
): Promise<{ units: number; buildings: number }> {
  const unitRecords = await Promise.all(
    unitIds.map((id) => getRecord(UNITS_TABLE, id))
  );

  // Pull in each referenced building first (dedup).
  const buildingIds = Array.from(
    new Set(
      unitRecords
        .map((r) => mapUnit(r).building_airtable_id)
        .filter((x): x is string => Boolean(x))
    )
  );
  const buildingRecords = await Promise.all(
    buildingIds.map((id) => getRecord(BUILDINGS_TABLE, id))
  );

  const buildings = await upsertBuildings(buildingRecords);
  const units = await upsertUnits(unitRecords);
  return { units, buildings };
}

/** Add specific buildings to Supabase by Airtable record IDs. */
export async function addBuildingsByAirtableId(
  buildingIds: string[]
): Promise<number> {
  const records = await Promise.all(
    buildingIds.map((id) => getRecord(BUILDINGS_TABLE, id))
  );
  return upsertBuildings(records);
}

/**
 * Re-sync everything already in Supabase: refresh 🔵 fields from Airtable for
 * every row we hold, leaving 🟢 admin fields (media, publish) untouched.
 * Used by the daily cron and the "Sync now" button.
 */
export async function resyncAll(): Promise<{
  buildings: number;
  units: number;
  errors: string[];
}> {
  const supabase = getServiceClient();
  const errors: string[] = [];

  const { data: buildingRows, error: bErr } = await supabase
    .from("buildings")
    .select("airtable_id");
  if (bErr) throw new Error(`Read buildings: ${bErr.message}`);

  const { data: unitRows, error: uErr } = await supabase
    .from("units")
    .select("airtable_id");
  if (uErr) throw new Error(`Read units: ${uErr.message}`);

  let buildings = 0;
  let units = 0;

  // Buildings first (FK target), then units.
  const buildingRecords = await fetchManySafe(
    BUILDINGS_TABLE,
    (buildingRows ?? []).map((r) => r.airtable_id),
    errors
  );
  buildings = await upsertBuildings(buildingRecords);

  const unitRecords = await fetchManySafe(
    UNITS_TABLE,
    (unitRows ?? []).map((r) => r.airtable_id),
    errors
  );
  units = await upsertUnits(unitRecords);

  return { buildings, units, errors };
}

/** Fetch many records by ID, skipping (and logging) any that fail/were deleted. */
async function fetchManySafe(
  table: string,
  ids: string[],
  errors: string[]
): Promise<AirtableRecord[]> {
  const results = await Promise.allSettled(
    ids.map((id) => getRecord(table, id))
  );
  const ok: AirtableRecord[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(r.value);
    else errors.push(`${table} ${ids[i]}: ${r.reason?.message ?? "failed"}`);
  });
  return ok;
}
