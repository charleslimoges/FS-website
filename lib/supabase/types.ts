export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      buildings: {
        Row: {
          active_status: string | null;
          airtable_id: string;
          amenities: string[] | null;
          created_at: string;
          display_description: string | null;
          external_inventory: string | null;
          id: string;
          images: Json;
          last_synced_at: string | null;
          metro_station: string[] | null;
          name: string | null;
          neighbourhood: string[] | null;
          overrides: Json;
          parking: string[] | null;
          parking_price: string | null;
          partner: string[] | null;
          partner_doc: string | null;
          pets: string[] | null;
          published: boolean;
          updated_at: string;
          utilities: string[] | null;
          videos: Json;
        };
        Insert: {
          active_status?: string | null;
          airtable_id: string;
          overrides?: Json;
          amenities?: string[] | null;
          created_at?: string;
          display_description?: string | null;
          external_inventory?: string | null;
          id?: string;
          images?: Json;
          last_synced_at?: string | null;
          metro_station?: string[] | null;
          name?: string | null;
          neighbourhood?: string[] | null;
          parking?: string[] | null;
          parking_price?: string | null;
          partner?: string[] | null;
          partner_doc?: string | null;
          pets?: string[] | null;
          published?: boolean;
          updated_at?: string;
          utilities?: string[] | null;
          videos?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["buildings"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          airtable_id: string;
          active: string | null;
          amenities: string[] | null;
          apartment_status: string | null;
          appliances: string[] | null;
          application_status: string[] | null;
          available_date: string | null;
          bathrooms: number | null;
          bathrooms_label: string | null;
          bedrooms: number | null;
          bedrooms_label: string | null;
          building_airtable_id: string | null;
          building_name: string | null;
          created_at: string;
          display_description: string | null;
          external_inventory: string | null;
          furnished: boolean | null;
          id: string;
          images: Json;
          last_synced_at: string | null;
          metro_station: string[] | null;
          neighbourhood: string[] | null;
          notes: string | null;
          notes_contact_info: string | null;
          overrides: Json;
          parking: string[] | null;
          parking_price: string | null;
          partner: string[] | null;
          partner_doc: string | null;
          pets: string[] | null;
          price: number | null;
          promo: number | null;
          published: boolean;
          sqft: number | null;
          unit_number: string | null;
          updated_at: string;
          utilities: string[] | null;
          videos: Json;
        };
        Insert: {
          airtable_id: string;
          active?: string | null;
          overrides?: Json;
          amenities?: string[] | null;
          apartment_status?: string | null;
          appliances?: string[] | null;
          application_status?: string[] | null;
          available_date?: string | null;
          bathrooms?: number | null;
          bathrooms_label?: string | null;
          bedrooms?: number | null;
          bedrooms_label?: string | null;
          building_airtable_id?: string | null;
          building_name?: string | null;
          created_at?: string;
          display_description?: string | null;
          external_inventory?: string | null;
          furnished?: boolean | null;
          id?: string;
          images?: Json;
          last_synced_at?: string | null;
          metro_station?: string[] | null;
          neighbourhood?: string[] | null;
          notes?: string | null;
          notes_contact_info?: string | null;
          parking?: string[] | null;
          parking_price?: string | null;
          partner?: string[] | null;
          partner_doc?: string | null;
          pets?: string[] | null;
          price?: number | null;
          promo?: number | null;
          published?: boolean;
          sqft?: number | null;
          unit_number?: string | null;
          updated_at?: string;
          utilities?: string[] | null;
          videos?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "units_building_airtable_id_fkey";
            columns: ["building_airtable_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["airtable_id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type BuildingRow = Database["public"]["Tables"]["buildings"]["Row"];
export type BuildingInsert = Database["public"]["Tables"]["buildings"]["Insert"];
export type UnitRow = Database["public"]["Tables"]["units"]["Row"];
export type UnitInsert = Database["public"]["Tables"]["units"]["Insert"];

/** A media item stored in Supabase Storage (images/videos JSON columns). */
export interface MediaItem {
  url: string;
  path: string;
  type: "image" | "video";
  filename?: string;
}
