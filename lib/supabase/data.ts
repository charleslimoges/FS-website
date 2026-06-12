import { getPublicClient, getServiceClient } from "./client";
import { BuildingRow, UnitRow, MediaItem } from "./types";
import {
  Building,
  Unit,
  AirtableAttachment,
  UnitFilters,
  BuildingFilters,
  FilterOptions,
} from "../types";

// ─── Admin overrides (sticky edits) ──────────────────────────────────────────
// Admin edits are stored in the `overrides` JSON column rather than the synced
// 🔵 columns, so an Airtable re-sync never clobbers them. We merge overrides on
// top of the row at read time, so the admin value always wins everywhere.

/** Whitelist of unit columns an admin may override. */
export const EDITABLE_UNIT_FIELDS = [
  "unit_number", "building_name", "bedrooms", "bathrooms", "sqft", "price",
  "promo", "furnished", "available_date", "apartment_status", "neighbourhood",
  "metro_station", "amenities", "utilities", "appliances", "pets", "parking",
  "parking_price", "partner", "notes", "notes_contact_info",
] as const;

/** Whitelist of building columns an admin may override. */
export const EDITABLE_BUILDING_FIELDS = [
  "name", "neighbourhood", "metro_station", "amenities", "utilities", "pets",
  "parking", "parking_price", "active_status",
] as const;

/** Merge the row's `overrides` JSON on top of its synced columns. */
function applyOverrides<T extends { overrides?: unknown }>(row: T): T {
  const ov = row.overrides;
  if (!ov || typeof ov !== "object" || Array.isArray(ov)) return row;
  return { ...row, ...(ov as Record<string, unknown>) };
}

// ─── Media JSON → AirtableAttachment[] (shape the UI cards expect) ───────────

function toAttachments(media: unknown): AirtableAttachment[] {
  if (!Array.isArray(media)) return [];
  return (media as MediaItem[])
    .filter((m) => m && typeof m.url === "string")
    .map((m, i) => ({
      id: m.path ?? `${i}`,
      url: m.url,
      filename: m.filename ?? "",
      size: 0,
      type: m.type === "video" ? "video/mp4" : "image/jpeg",
    }));
}

function videoItems(media: unknown): MediaItem[] {
  if (!Array.isArray(media)) return [];
  return (media as MediaItem[]).filter((m) => m && typeof m.url === "string");
}

// ─── Status mapping ──────────────────────────────────────────────────────────

/**
 * Extra public-visibility guard, applied on top of the admin Active status
 * (RLS already restricts the anon client to published = active rows). This only
 * exists to hide synced Airtable units that explicitly say they're unavailable:
 *  - Apartment Status reads Rented/construction/model (not Vacant/Occupied/…)
 *  - Application Status is "Signed"
 *  - Active is set to something other than "Active" (e.g. Inactive)
 * Empty/missing fields (e.g. manually-added units) defer to the admin's status.
 */
export function isPublicUnit(row: Pick<UnitRow, "apartment_status" | "application_status" | "active">): boolean {
  const apt = (row.apartment_status ?? "").trim().toLowerCase();
  const okApt =
    apt === "" ||
    apt.includes("vacant") ||
    apt.includes("occupied") ||
    apt.includes("partner application") ||
    apt.includes("future");
  const notSigned = !(row.application_status ?? []).some((s) =>
    s.toLowerCase().includes("signed")
  );
  const active = (row.active ?? "").trim().toLowerCase();
  const isActive = active === "" || active === "active";
  return okApt && notSigned && isActive;
}

function mapStatus(apartment_status: string | null): Unit["status"] {
  const s = (apartment_status ?? "").toLowerCase();
  if (s.includes("vacant")) return "available";
  if (
    s.includes("construction") ||
    s.includes("plan") ||
    s.includes("pre-construction")
  ) {
    return "in_construction";
  }
  return "rented"; // occupied
}

function mapPets(pets: string[] | null): Unit["pets"] {
  const list = (pets ?? []).map((p) => p.toLowerCase());
  if (list.some((p) => p.includes("dog"))) return "yes";
  if (list.some((p) => p.includes("cat"))) return "cats_only";
  if (list.length > 0) return "yes";
  return "no";
}

function mapParking(parking: string[] | null): Unit["parking"] {
  const list = parking ?? [];
  if (list.some((p) => /incl/i.test(p))) return "included";
  return list.length > 0 ? "available" : "none";
}

// ─── Row → frontend type. id = airtable_id (keeps existing links/filters). ───

export function mapUnitRow(row: UnitRow): Unit & { videos: MediaItem[] } {
  return {
    id: row.airtable_id,
    unit_number: row.unit_number ?? "",
    building_id: row.building_airtable_id ?? "",
    building_name: row.building_name ?? "",
    building_neighbourhood: (row.neighbourhood ?? [])[0] ?? "",
    price: Number(row.price ?? 0),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 1),
    sqft: Number(row.sqft ?? 0),
    images: toAttachments(row.images),
    available_date: row.available_date ?? "",
    promo: Number(row.promo ?? 0) > 0,
    parking: mapParking(row.parking),
    parking_options: row.parking ?? [],
    utilities_included: (row.utilities ?? []).length > 0,
    utilities: row.utilities ?? [],
    appliances: row.appliances ?? [],
    amenities: row.amenities ?? [],
    pets_options: row.pets ?? [],
    pets: mapPets(row.pets),
    furnished: Boolean(row.furnished),
    floor: 0,
    description: row.display_description ?? "",
    status: mapStatus(row.apartment_status),
    published: row.published,
    videos: videoItems(row.videos),
  };
}

export function mapBuildingRow(
  row: BuildingRow,
  units: UnitRow[] = []
): Building & { videos: MediaItem[] } {
  const prices = units
    .map((u) => Number(u.price ?? 0))
    .filter((p) => p > 0);
  const isConstruction = (row.active_status ?? "")
    .toLowerCase()
    .match(/construction|plan/);

  return {
    id: row.airtable_id,
    name: row.name ?? "",
    address: row.name ?? "",
    neighbourhood: (row.neighbourhood ?? [])[0] ?? "",
    images: toAttachments(row.images),
    min_price: prices.length ? Math.min(...prices) : 0,
    max_price: prices.length ? Math.max(...prices) : 0,
    amenities: row.amenities ?? [],
    utilities: row.utilities ?? [],
    pets: row.pets ?? [],
    parking: row.parking ?? [],
    bedrooms: Array.from(new Set(units.map((u) => Number(u.bedrooms ?? 0)))).sort((a, b) => a - b),
    description: row.display_description ?? "",
    unit_count: units.length,
    published: row.published,
    in_construction: Boolean(isConstruction),
    videos: videoItems(row.videos),
  };
}

// ─── Facet matching helpers (filters use raw Airtable strings) ───────────────

/** True if `have` contains every value in `want` (AND within a facet). */
function hasAll(have: string[] | null | undefined, want: string[]): boolean {
  const set = have ?? [];
  return want.every((w) => set.includes(w));
}

/** True if `have` contains any value in `want` (OR within a facet). */
function hasAny(have: string[] | null | undefined, want: string[]): boolean {
  const set = have ?? [];
  return want.some((w) => set.includes(w));
}

/** Sorted distinct non-empty strings from a set of array columns. */
function distinctStrings(rows: { [k: string]: unknown }[], key: string): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = r[key];
    if (Array.isArray(v)) for (const x of v) if (x) set.add(String(x).trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Build the FilterOptions facets from a set of unit rows. */
function collectFacets(rows: UnitRow[]): FilterOptions {
  const beds = new Set<number>();
  const baths = new Set<number>();
  for (const r of rows) {
    beds.add(Number(r.bedrooms ?? 0));
    if (r.bathrooms != null) baths.add(Number(r.bathrooms));
  }
  return {
    neighbourhoods: distinctStrings(rows as never, "neighbourhood"),
    amenities: distinctStrings(rows as never, "amenities"),
    utilities: distinctStrings(rows as never, "utilities"),
    appliances: distinctStrings(rows as never, "appliances"),
    pets: distinctStrings(rows as never, "pets"),
    parking: distinctStrings(rows as never, "parking"),
    bedrooms: Array.from(beds).sort((a, b) => a - b),
    bathrooms: Array.from(baths).sort((a, b) => a - b),
  };
}

// ─── Public reads (anon client → only published rows via RLS) ────────────────

/** Raw, override-applied unit rows that pass the public-visibility rule. */
async function publicUnitRows(): Promise<UnitRow[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("price", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(applyOverrides).filter(isPublicUnit);
}

/** True if a raw unit row matches every facet in `filters`. */
function unitMatches(r: UnitRow, filters: UnitFilters): boolean {
  const price = Number(r.price ?? 0);
  if (filters.min_price !== undefined && price < filters.min_price) return false;
  if (filters.max_price !== undefined && price > filters.max_price) return false;
  if (filters.bedrooms?.length && !filters.bedrooms.includes(Number(r.bedrooms ?? 0)))
    return false;
  if (filters.bathrooms?.length && !filters.bathrooms.includes(Number(r.bathrooms ?? 0)))
    return false;
  if (filters.promo && !(Number(r.promo ?? 0) > 0)) return false;
  if (filters.furnished && !r.furnished) return false;
  if (filters.utilities_included && (r.utilities ?? []).length === 0) return false;
  if (filters.amenities?.length && !hasAll(r.amenities, filters.amenities)) return false;
  if (filters.utilities?.length && !hasAll(r.utilities, filters.utilities)) return false;
  if (filters.appliances?.length && !hasAll(r.appliances, filters.appliances)) return false;
  if (filters.pets?.length && !hasAny(r.pets, filters.pets)) return false;
  if (filters.parking?.length && !hasAny(r.parking, filters.parking)) return false;
  if (filters.neighbourhood?.length && !hasAny(r.neighbourhood, filters.neighbourhood))
    return false;
  if (
    filters.available_now &&
    !(r.available_date && new Date(r.available_date) <= new Date())
  )
    return false;
  return true;
}

/** Published units only; excludes in-construction (public shows vacant/occupied). */
export async function getPublishedUnits(
  filters: UnitFilters = {}
): Promise<Unit[]> {
  let rows = await publicUnitRows();

  const buildingKeys = [...(filters.buildings ?? [])];
  if (filters.building_id) buildingKeys.push(filters.building_id);
  if (buildingKeys.length) {
    rows = rows.filter(
      (r) =>
        buildingKeys.includes(r.building_airtable_id ?? "") ||
        buildingKeys.includes(r.building_name ?? "")
    );
  }

  return rows.filter((r) => unitMatches(r, filters)).map(mapUnitRow);
}

/** Distinct facet values across all publicly-visible units. */
export async function getUnitFilterOptions(): Promise<FilterOptions> {
  return collectFacets(await publicUnitRows());
}

/** Map of building airtable_id → its publicly-visible units. */
async function publicUnitsByBuilding(): Promise<Map<string, UnitRow[]>> {
  const supabase = getPublicClient();
  const { data, error } = await supabase.from("units").select("*");
  if (error) throw new Error(error.message);
  const byBuilding = new Map<string, UnitRow[]>();
  (data ?? [])
    .map(applyOverrides)
    .filter(isPublicUnit)
    .forEach((u) => {
      if (!u.building_airtable_id) return;
      const arr = byBuilding.get(u.building_airtable_id) ?? [];
      arr.push(u);
      byBuilding.set(u.building_airtable_id, arr);
    });
  return byBuilding;
}

export async function getPublishedBuildings(
  filters: BuildingFilters = {}
): Promise<Building[]> {
  const supabase = getPublicClient();
  const [{ data: bData, error: bErr }, unitsByBuilding] = await Promise.all([
    supabase.from("buildings").select("*"),
    publicUnitsByBuilding(),
  ]);
  if (bErr) throw new Error(bErr.message);

  const buildings: Building[] = [];
  for (const raw of (bData ?? []).map(applyOverrides)) {
    let units = unitsByBuilding.get(raw.airtable_id) ?? [];

    // Unit-derived facets: keep only units that match, then require ≥1.
    if (filters.bedrooms?.length)
      units = units.filter((u) => filters.bedrooms!.includes(Number(u.bedrooms ?? 0)));
    if (filters.bathrooms?.length)
      units = units.filter((u) => filters.bathrooms!.includes(Number(u.bathrooms ?? 0)));
    if (filters.appliances?.length)
      units = units.filter((u) => hasAll(u.appliances, filters.appliances!));
    if (units.length === 0) continue;

    // Building-level facets, matched on the building's own columns.
    if (filters.neighbourhood?.length && !hasAny(raw.neighbourhood, filters.neighbourhood))
      continue;
    if (filters.amenities?.length && !hasAll(raw.amenities, filters.amenities)) continue;
    if (filters.utilities?.length && !hasAll(raw.utilities, filters.utilities)) continue;
    if (filters.pets?.length && !hasAny(raw.pets, filters.pets)) continue;
    if (filters.parking?.length && !hasAny(raw.parking, filters.parking)) continue;

    const b = mapBuildingRow(raw, units);
    if (filters.min_price !== undefined && b.max_price < filters.min_price) continue;
    if (filters.max_price !== undefined && b.min_price > filters.max_price) continue;
    buildings.push(b);
  }

  if (filters.sort === "price_asc")
    buildings.sort((a, b) => a.min_price - b.min_price);
  if (filters.sort === "price_desc")
    buildings.sort((a, b) => b.min_price - a.min_price);

  return buildings;
}

/**
 * Distinct facet values for the buildings page. Building-level facets
 * (neighbourhood, amenities, utilities, pets, parking) come from the building
 * rows; unit-derived facets (appliances, bedrooms, bathrooms) from their units.
 */
export async function getBuildingFilterOptions(): Promise<FilterOptions> {
  const supabase = getPublicClient();
  const [{ data: bData, error: bErr }, unitsByBuilding] = await Promise.all([
    supabase.from("buildings").select("*"),
    publicUnitsByBuilding(),
  ]);
  if (bErr) throw new Error(bErr.message);

  // Only buildings that have ≥1 public unit.
  const buildingRows = (bData ?? [])
    .map(applyOverrides)
    .filter((b) => (unitsByBuilding.get(b.airtable_id) ?? []).length > 0);
  const unitRows = Array.from(unitsByBuilding.values()).flat();
  const unitFacets = collectFacets(unitRows);

  return {
    neighbourhoods: distinctStrings(buildingRows as never, "neighbourhood"),
    amenities: distinctStrings(buildingRows as never, "amenities"),
    utilities: distinctStrings(buildingRows as never, "utilities"),
    pets: distinctStrings(buildingRows as never, "pets"),
    parking: distinctStrings(buildingRows as never, "parking"),
    appliances: unitFacets.appliances,
    bedrooms: unitFacets.bedrooms,
    bathrooms: unitFacets.bathrooms,
  };
}

export async function getPublishedBuildingById(
  airtableId: string
): Promise<Building | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("airtable_id", airtableId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .eq("building_airtable_id", airtableId);
  return mapBuildingRow(applyOverrides(data), (units ?? []).map(applyOverrides));
}

// ─── Admin reads (service client → all rows incl. unpublished) ───────────────

export async function adminGetBuildings(): Promise<BuildingRow[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(applyOverrides);
}

export async function adminGetUnits(): Promise<UnitRow[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("building_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(applyOverrides);
}
