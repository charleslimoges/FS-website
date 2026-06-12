import { getPublicClient, getServiceClient } from "./client";
import { BuildingRow, UnitRow, MediaItem } from "./types";
import {
  Building,
  Unit,
  AirtableAttachment,
  UnitFilters,
  BuildingFilters,
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
    utilities_included: (row.utilities ?? []).length > 0,
    appliances: row.appliances ?? [],
    amenities: row.amenities ?? [],
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
    description: row.display_description ?? "",
    unit_count: units.length,
    published: row.published,
    in_construction: Boolean(isConstruction),
    videos: videoItems(row.videos),
  };
}

// ─── Public reads (anon client → only published rows via RLS) ────────────────

/** Published units only; excludes in-construction (public shows vacant/occupied). */
export async function getPublishedUnits(
  filters: UnitFilters = {}
): Promise<Unit[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("price", { ascending: true });
  if (error) throw new Error(error.message);

  // Public rule: Vacant/Occupied, not Signed, and Active (see isPublicUnit).
  let units = (data ?? []).map(applyOverrides).filter(isPublicUnit).map(mapUnitRow);

  const buildingKeys = filters.buildings ?? [];
  if (filters.building_id) buildingKeys.push(filters.building_id);
  if (buildingKeys.length) {
    units = units.filter(
      (u) =>
        buildingKeys.includes(u.building_id) ||
        buildingKeys.includes(u.building_name ?? "")
    );
  }
  if (filters.min_price !== undefined)
    units = units.filter((u) => u.price >= filters.min_price!);
  if (filters.max_price !== undefined)
    units = units.filter((u) => u.price <= filters.max_price!);
  if (filters.bedrooms?.length)
    units = units.filter((u) => filters.bedrooms!.includes(u.bedrooms));
  if (filters.promo) units = units.filter((u) => u.promo);
  if (filters.furnished) units = units.filter((u) => u.furnished);
  if (filters.utilities_included)
    units = units.filter((u) => u.utilities_included);
  if (filters.parking?.length)
    units = units.filter((u) => u.parking !== "none");
  if (filters.pets?.length) units = units.filter((u) => u.pets !== "no");
  if (filters.amenities?.length)
    units = units.filter((u) =>
      filters.amenities!.every((a) => u.amenities.includes(a))
    );
  if (filters.appliances?.length)
    units = units.filter((u) =>
      filters.appliances!.every((a) => u.appliances.includes(a))
    );
  if (filters.available_now)
    units = units.filter(
      (u) => u.available_date && new Date(u.available_date) <= new Date()
    );
  if (filters.neighbourhood?.length)
    units = units.filter((u) =>
      filters.neighbourhood!.includes(u.building_neighbourhood ?? "")
    );

  return units;
}

export async function getPublishedBuildings(
  filters: BuildingFilters = {}
): Promise<Building[]> {
  const supabase = getPublicClient();
  const [{ data: bData, error: bErr }, { data: uData, error: uErr }] =
    await Promise.all([
      supabase.from("buildings").select("*"),
      supabase.from("units").select("*"),
    ]);
  if (bErr) throw new Error(bErr.message);
  if (uErr) throw new Error(uErr.message);

  // Only count Vacant + Occupied units toward a building's price range and
  // unit count — same public rule as getPublishedUnits.
  const unitsByBuilding = new Map<string, UnitRow[]>();
  (uData ?? [])
    .map(applyOverrides)
    .filter(isPublicUnit)
    .forEach((u) => {
      if (!u.building_airtable_id) return;
      const arr = unitsByBuilding.get(u.building_airtable_id) ?? [];
      arr.push(u);
      unitsByBuilding.set(u.building_airtable_id, arr);
    });

  // Drop buildings that have no publicly-visible units.
  let buildings = (bData ?? [])
    .map(applyOverrides)
    .map((b) => mapBuildingRow(b, unitsByBuilding.get(b.airtable_id) ?? []))
    .filter((b) => b.unit_count > 0);

  if (filters.neighbourhood?.length)
    buildings = buildings.filter((b) =>
      filters.neighbourhood!.includes(b.neighbourhood)
    );
  if (filters.amenities?.length)
    buildings = buildings.filter((b) =>
      filters.amenities!.every((a) => b.amenities.includes(a))
    );
  if (filters.min_price !== undefined)
    buildings = buildings.filter((b) => b.max_price >= filters.min_price!);
  if (filters.max_price !== undefined)
    buildings = buildings.filter((b) => b.min_price <= filters.max_price!);

  if (filters.sort === "price_asc")
    buildings.sort((a, b) => a.min_price - b.min_price);
  if (filters.sort === "price_desc")
    buildings.sort((a, b) => b.min_price - a.min_price);

  return buildings;
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
