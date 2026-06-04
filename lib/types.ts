export interface Building {
  id: string;
  name: string;
  address: string;
  neighbourhood: string;
  images: AirtableAttachment[];
  min_price: number;
  max_price: number;
  amenities: string[];
  description: string;
  unit_count: number;
  published?: boolean;
  in_construction?: boolean;
}

export interface Unit {
  id: string;
  unit_number: string;
  building_id: string;
  building_name?: string;
  building_neighbourhood?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  images: AirtableAttachment[];
  available_date: string;
  promo: boolean;
  parking: "none" | "included" | "available";
  utilities_included: boolean;
  appliances: string[];
  amenities: string[];
  pets: "yes" | "no" | "cats_only";
  furnished: boolean;
  floor: number;
  description: string;
  status: "available" | "rented" | "in_construction";
  published?: boolean;
}

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  interested_in_unit?: boolean;
  unit_or_building?: string;
}

export interface BookVisitData {
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  unit_id?: string;
  building_id?: string;
  notes?: string;
}

export interface UnitFilters {
  buildings?: string[];
  min_price?: number;
  max_price?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  min_sqft?: number;
  max_sqft?: number;
  promo?: boolean;
  parking?: string[];
  utilities_included?: boolean;
  appliances?: string[];
  amenities?: string[];
  pets?: string[];
  furnished?: boolean;
  available_now?: boolean;
  floor?: number;
  unit_number?: string;
  neighbourhood?: string[];
}

export interface BuildingFilters {
  neighbourhood?: string[];
  min_price?: number;
  max_price?: number;
  amenities?: string[];
  sort?: "price_asc" | "price_desc" | "newest";
}

export type Neighbourhood =
  | "Downtown"
  | "Plateau"
  | "Rosemont"
  | "Hochelaga"
  | "Mile-End"
  | "Verdun"
  | "Saint-Henri"
  | "Griffintown"
  | "Outremont"
  | "NDG"
  | "Villeray"
  | "Pointe-Saint-Charles";

export const NEIGHBOURHOODS: Neighbourhood[] = [
  "Downtown",
  "Plateau",
  "Rosemont",
  "Hochelaga",
  "Mile-End",
  "Verdun",
  "Saint-Henri",
  "Griffintown",
  "Outremont",
  "NDG",
  "Villeray",
  "Pointe-Saint-Charles",
];

export const AMENITIES = [
  "gym",
  "pool",
  "rooftop",
  "parking",
  "concierge",
  "storage",
  "bike_storage",
  "laundry",
  "elevator",
  "balcony",
  "terrace",
  "dog_wash",
];

export const AMENITY_LABELS: Record<string, string> = {
  gym: "Gym",
  pool: "Pool",
  rooftop: "Rooftop",
  parking: "Parking",
  concierge: "Concierge",
  storage: "Storage",
  bike_storage: "Bike Storage",
  laundry: "Laundry",
  elevator: "Elevator",
  balcony: "Balcony",
  terrace: "Terrace",
  dog_wash: "Dog Wash",
};

export const APPLIANCES = [
  "washer_dryer",
  "dishwasher",
  "fridge",
  "stove",
  "microwave",
  "air_conditioning",
];

export const APPLIANCE_LABELS: Record<string, string> = {
  washer_dryer: "Washer/Dryer",
  dishwasher: "Dishwasher",
  fridge: "Fridge",
  stove: "Stove",
  microwave: "Microwave",
  air_conditioning: "A/C",
};
