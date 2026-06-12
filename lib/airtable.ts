import { Building, Unit } from "./types";

const BASE_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

const BUILDINGS_TABLE = "Building Summary";
const UNITS_TABLE = "Units";

function airtableHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function airtableFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}/${BASE_ID}${path}`, {
    ...options,
    headers: {
      ...airtableHeaders(),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error ${res.status}: ${err}`);
  }

  return res.json();
}

function str(v: unknown, fallback = ""): string {
  return v ? String(v) : fallback;
}

function attachments(v: unknown): import("./types").AirtableAttachment[] {
  return Array.isArray(v) ? (v as import("./types").AirtableAttachment[]) : [];
}

// singleSelect fields return a plain string in the REST API
function selectName(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "name" in (v as object)) {
    return (v as { name: string }).name;
  }
  return "";
}

// multipleSelects and multipleLookupValues return string[] in the REST API
function selectNames(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) {
        return (item as { name: string }).name;
      }
      return String(item);
    })
    .filter(Boolean);
}

function mapBuilding(record: AirtableRecord): Building {
  const f = record.fields;
  const activeStatus = selectName(f["Active"]);
  return {
    id: record.id,
    name: str(f["Building"]),
    address: str(f["Building"]),
    neighbourhood: selectNames(f["Neighbourhood"])[0] ?? selectName(f["Neighbourhood"]) ?? "",
    images: attachments(f["Application"]),
    min_price: 0,
    max_price: 0,
    amenities: selectNames(f["Amenities"]),
    description: str(f["Building Entry+Unit Entry"]),
    unit_count: 0,
    published: activeStatus === "Active",
    in_construction: activeStatus === "In Construction" || activeStatus === "Plans" || activeStatus === "Pre-Construction",
  };
}

function mapUnit(record: AirtableRecord): Unit {
  const f = record.fields;
  const buildingIdRaw = f["Building"];
  const buildingId = Array.isArray(buildingIdRaw)
    ? str(buildingIdRaw[0])
    : str(buildingIdRaw);

  // "Building - Unit" formula yields e.g. "37 av. Broadway (O-Rive) - 319"
  const buildingUnit = str(f["Building - Unit"]);
  const lastDash = buildingUnit.lastIndexOf(" - ");
  const building_name =
    lastDash > -1 ? buildingUnit.slice(0, lastDash) : buildingUnit;

  const parkingValues = selectNames(f["Parking"]);
  const utilitiesValues = selectNames(f["Utilities"]);
  const petsValues = selectNames(f["Pets"]);
  const promoPrice = Number(f["Promo"] ?? 0);

  const apartmentStatus = selectName(f["Apartment Status"]);
  const status: Unit["status"] =
    apartmentStatus === "Vacant"
      ? "available"
      : apartmentStatus === "In Construction" || apartmentStatus === "Plans" || apartmentStatus === "Pre-Construction"
      ? "in_construction"
      : "rented";

  let pets: Unit["pets"] = "no";
  if (petsValues.length > 0) {
    const hasDogs = petsValues.some((p) => p.toLowerCase().includes("dog"));
    pets = hasDogs ? "yes" : "cats_only";
  }

  return {
    id: record.id,
    unit_number: str(f["Unit Number"]),
    building_id: buildingId,
    building_name,
    building_neighbourhood: selectNames(f["Neighborhood"])[0] ?? "",
    price: Number(f["Price"] ?? 0),
    bedrooms: Number(selectName(f["🛏"]) || 0),
    bathrooms: Number(selectName(f["🛁"]) || 1),
    sqft: Number(f["Sqft"] ?? 0),
    images: (() => {
      const p = attachments(f["Photos"]);
      if (p.length) return p;
      const img = attachments(f["Images"]);
      if (img.length) return img;
      return attachments(f["Application"]);
    })(),
    available_date: str(f["Available"]),
    promo: promoPrice > 0,
    parking: parkingValues.length > 0 ? "available" : "none",
    utilities_included: utilitiesValues.length > 0,
    appliances: selectNames(f["Appliances"]),
    amenities: selectNames(f["Amenities"]),
    pets,
    furnished: Boolean(f["Furnished"]),
    floor: 0,
    description: str(f["Notes/Contact Info"]),
    status,
    published: true,
  };
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

async function fetchAllRecords(
  table: string,
  filterFormula?: string,
  sort?: Array<{ field: string; direction?: string }>
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (filterFormula) params.set("filterByFormula", filterFormula);
    if (sort) {
      sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        if (s.direction) params.set(`sort[${i}][direction]`, s.direction);
      });
    }
    if (offset) params.set("offset", offset);

    const data: AirtableListResponse = await airtableFetch(
      `/${encodeURIComponent(table)}?${params.toString()}`
    );
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

async function getBuildingName(buildingId: string): Promise<string> {
  try {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(BUILDINGS_TABLE)}/${buildingId}`
    );
    return str(record.fields["Building"]);
  } catch {
    return "";
  }
}

// ─── Buildings ───────────────────────────────────────────────────────────────

export async function getBuildings(filters?: {
  neighbourhood?: string[];
  min_price?: number;
  max_price?: number;
  amenities?: string[];
}): Promise<Building[]> {
  const { getStore } = await import("./store");
  let buildings = Object.values(getStore().buildings);

  if (filters?.neighbourhood?.length) {
    buildings = buildings.filter((b) =>
      filters.neighbourhood!.includes(b.neighbourhood)
    );
  }
  if (filters?.min_price !== undefined) {
    buildings = buildings.filter((b) => b.max_price >= filters.min_price!);
  }
  if (filters?.max_price !== undefined) {
    buildings = buildings.filter((b) => b.min_price <= filters.max_price!);
  }
  if (filters?.amenities?.length) {
    buildings = buildings.filter((b) =>
      filters.amenities!.every((a) => b.amenities.includes(a))
    );
  }

  return buildings;
}

export async function getBuildingById(id: string): Promise<Building | null> {
  try {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(BUILDINGS_TABLE)}/${id}`
    );
    return mapBuilding(record);
  } catch {
    return null;
  }
}

export async function createOrUpdateBuilding(
  data: Partial<Building>,
  id?: string
): Promise<Building> {
  const fields: Record<string, unknown> = {
    Building: data.name,
    Neighbourhood: data.neighbourhood ? [data.neighbourhood] : undefined,
    Amenities: data.amenities,
    "Building Entry+Unit Entry": data.description,
    Active: data.published ? "Active" : "Inactive",
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k] === undefined) delete fields[k];
  });

  if (id) {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(BUILDINGS_TABLE)}/${id}`,
      { method: "PATCH", body: JSON.stringify({ fields }) }
    );
    return mapBuilding(record);
  } else {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(BUILDINGS_TABLE)}`,
      { method: "POST", body: JSON.stringify({ fields }) }
    );
    return mapBuilding(record);
  }
}

// ─── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(filters?: {
  building_id?: string;
  buildings?: string[];
  min_price?: number;
  max_price?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  promo?: boolean;
  parking?: string[];
  utilities_included?: boolean;
  amenities?: string[];
  appliances?: string[];
  pets?: string[];
  furnished?: boolean;
  available_now?: boolean;
  neighbourhood?: string[];
}): Promise<Unit[]> {
  const { getStore } = await import("./store");
  const approvedIds = getStore().units;
  if (approvedIds.length === 0) return [];

  const idFormula = `OR(${approvedIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
  const conditions: string[] = [idFormula];

  if (filters?.building_id) {
    const name = await getBuildingName(filters.building_id);
    if (name) conditions.push(`FIND("${name}", ARRAYJOIN({Building}, ","))`);
  }
  if (filters?.buildings?.length) {
    const names = await Promise.all(filters.buildings.map(getBuildingName));
    const validNames = names.filter(Boolean);
    if (validNames.length) {
      const formulas = validNames.map((n) => `FIND("${n}", ARRAYJOIN({Building}, ","))`);
      conditions.push(`OR(${formulas.join(",")})`);
    }
  }
  if (filters?.min_price) conditions.push(`{Price} >= ${filters.min_price}`);
  if (filters?.max_price) conditions.push(`{Price} <= ${filters.max_price}`);
  if (filters?.bedrooms?.length) {
    conditions.push(`OR(${filters.bedrooms.map((b) => `{🛏} = "${b}"`).join(",")})`);
  }
  if (filters?.promo) conditions.push(`{Promo} > 0`);
  if (filters?.furnished) conditions.push(`{Furnished} = 1`);
  if (filters?.available_now) conditions.push(`IS_BEFORE({Available}, TODAY())`);

  const formula = `AND(${conditions.join(",")})`;
  const records = await fetchAllRecords(UNITS_TABLE, formula, [
    { field: "Price", direction: "asc" },
  ]);
  return records.map(mapUnit);
}

export async function getUnitById(id: string): Promise<Unit | null> {
  try {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(UNITS_TABLE)}/${id}`
    );
    return mapUnit(record);
  } catch {
    return null;
  }
}

export async function createOrUpdateUnit(
  data: Partial<Unit>,
  id?: string
): Promise<Unit> {
  const fields: Record<string, unknown> = {
    "Unit Number": data.unit_number,
    Building: data.building_id ? [data.building_id] : undefined,
    Price: data.price,
    "🛏": data.bedrooms !== undefined ? String(data.bedrooms) : undefined,
    "🛁": data.bathrooms !== undefined ? String(data.bathrooms) : undefined,
    Sqft: data.sqft,
    Available: data.available_date,
    Promo: data.promo ? data.price : undefined,
    Furnished: data.furnished,
    Appliances: data.appliances,
    "Notes/Contact Info": data.description,
    "Apartment Status": data.status === "available" ? "Vacant" : "Rented",
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k] === undefined) delete fields[k];
  });

  if (id) {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(UNITS_TABLE)}/${id}`,
      { method: "PATCH", body: JSON.stringify({ fields }) }
    );
    return mapUnit(record);
  } else {
    const record: AirtableRecord = await airtableFetch(
      `/${encodeURIComponent(UNITS_TABLE)}`,
      { method: "POST", body: JSON.stringify({ fields }) }
    );
    return mapUnit(record);
  }
}

export async function searchBuildingByAddress(
  address: string
): Promise<Building | null> {
  const formula = `FIND(LOWER("${address.toLowerCase()}"), LOWER({Building}))`;
  const records = await fetchAllRecords(BUILDINGS_TABLE, formula);
  if (records.length === 0) return null;
  return mapBuilding(records[0]);
}

export async function searchBuildingsByQuery(
  query: string
): Promise<Array<{ id: string; name: string; neighbourhood: string }>> {
  if (!query || query.length < 2) return [];
  const safe = query.toLowerCase().replace(/["\\]/g, "");
  const formula = `FIND("${safe}", LOWER({Building}))`;
  const records = await fetchAllRecords(BUILDINGS_TABLE, formula);
  return records.slice(0, 8).map((r) => ({
    id: r.id,
    name: str(r.fields["Building"] as string),
    neighbourhood:
      selectNames(r.fields["Neighbourhood"] as unknown)[0] ??
      selectName(r.fields["Neighbourhood"] as unknown) ??
      "",
  }));
}

// Admin browse rule (matches the public-site rule in lib/supabase/data.ts):
//  - Apartment Status is Vacant, Occupied, Partner Application, or Future
//  - Application Status is NOT "Signed"
//  - Active is "Active"
// Checked on the raw Airtable fields before mapping, since mapUnit collapses
// Occupied and Rented into the same value.
function isEligibleUnit(record: AirtableRecord): boolean {
  const apt = selectName(record.fields["Apartment Status"]).toLowerCase();
  const okApt =
    apt.includes("vacant") ||
    apt.includes("occupied") ||
    apt.includes("partner application") ||
    apt.includes("future");
  const notSigned = !selectNames(record.fields["Application Status - All"]).some(
    (s) => s.toLowerCase().includes("signed")
  );
  // "Active" is a multipleLookupValues field → comes back as ["Active"], so use
  // selectNames (array-aware), not selectName.
  const isActive = selectNames(record.fields["Active"]).some(
    (s) => s.trim().toLowerCase() === "active"
  );
  return okApt && notSigned && isActive;
}

export async function getUnitsByBuilding(buildingId: string): Promise<Unit[]> {
  const name = await getBuildingName(buildingId);
  if (!name) return [];
  const formula = `FIND("${name}", ARRAYJOIN({Building}, ","))`;
  const records = await fetchAllRecords(UNITS_TABLE, formula);
  return records.filter(isEligibleUnit).map(mapUnit);
}

export async function logContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  interested_in_unit?: boolean;
  unit_or_building?: string;
}): Promise<void> {
  await airtableFetch(`/${encodeURIComponent("Contact Submissions")}`, {
    method: "POST",
    body: JSON.stringify({ fields: data }),
  });
}

export async function logBookVisit(data: {
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  unit_id?: string;
  building_id?: string;
  notes?: string;
}): Promise<void> {
  await airtableFetch(`/${encodeURIComponent("Visit Bookings")}`, {
    method: "POST",
    body: JSON.stringify({ fields: data }),
  });
}
