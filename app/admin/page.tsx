"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lock, Search, Building2, Home, Eye, Loader2, Plus, Check,
  RefreshCw, ChevronDown, ChevronUp, ImagePlus, Video, X,
  Trash2, Pencil, Save, RotateCcw, AlertTriangle, PlusCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin2024";

// ─── Shared types (admin-facing) ──────────────────────────────────────────────

interface MediaItem {
  url: string;
  path: string;
  type: "image" | "video";
  filename?: string;
}

interface AirtableUnit {
  id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  status: string;
  in_supabase?: boolean;
}

interface AirtableBuilding {
  id: string;
  name: string;
  neighbourhood: string;
}

interface UnitRow {
  airtable_id: string;
  unit_number: string | null;
  building_airtable_id: string | null;
  building_name: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  price: number | null;
  promo: number | null;
  furnished: boolean | null;
  utilities: string[] | null;
  appliances: string[] | null;
  amenities: string[] | null;
  pets: string[] | null;
  parking: string[] | null;
  parking_price: string | null;
  neighbourhood: string[] | null;
  metro_station: string[] | null;
  apartment_status: string | null;
  available_date: string | null;
  partner: string[] | null;
  notes: string | null;
  notes_contact_info: string | null;
  external_inventory: string | null;
  partner_doc: string | null;
  published: boolean;
  images: MediaItem[];
  videos: MediaItem[];
  display_description: string | null;
  overrides?: Record<string, unknown> | null;
}

interface BuildingRow {
  airtable_id: string;
  name: string | null;
  neighbourhood: string[] | null;
  metro_station: string[] | null;
  amenities: string[] | null;
  utilities: string[] | null;
  pets: string[] | null;
  parking: string[] | null;
  parking_price: string | null;
  active_status: string | null;
  published: boolean;
  images: MediaItem[];
  videos: MediaItem[];
  display_description: string | null;
  overrides?: Record<string, unknown> | null;
}

// ─── Editable-field configuration (drives the generic edit forms) ─────────────

type FieldKind = "text" | "number" | "bool" | "list" | "date";
interface FieldDef { key: string; label: string; kind: FieldKind; category?: ChipCategory }

const UNIT_FIELDS: FieldDef[] = [
  { key: "unit_number", label: "Unit number", kind: "text" },
  { key: "building_name", label: "Building", kind: "text" },
  { key: "bedrooms", label: "Bedrooms", kind: "number" },
  { key: "bathrooms", label: "Bathrooms", kind: "number" },
  { key: "sqft", label: "Sqft", kind: "number" },
  { key: "price", label: "Price ($/mo)", kind: "number" },
  { key: "promo", label: "Promo ($)", kind: "number" },
  { key: "furnished", label: "Furnished", kind: "bool" },
  { key: "available_date", label: "Available", kind: "date" },
  { key: "apartment_status", label: "Apartment status", kind: "text" },
  { key: "neighbourhood", label: "Neighbourhood", kind: "list", category: "neighbourhood" },
  { key: "metro_station", label: "Metro", kind: "list", category: "metro" },
  { key: "amenities", label: "Amenities", kind: "list", category: "amenities" },
  { key: "utilities", label: "Utilities", kind: "list", category: "utilities" },
  { key: "appliances", label: "Appliances", kind: "list", category: "appliances" },
  { key: "pets", label: "Pets", kind: "list", category: "pets" },
  { key: "parking", label: "Parking", kind: "list", category: "parking" },
  { key: "parking_price", label: "Parking price", kind: "text" },
  { key: "partner", label: "Partner", kind: "list", category: "partner" },
  { key: "notes", label: "Notes", kind: "text" },
  { key: "notes_contact_info", label: "Notes / contact", kind: "text" },
];

const BUILDING_FIELDS: FieldDef[] = [
  { key: "name", label: "Building name / address", kind: "text" },
  { key: "neighbourhood", label: "Neighbourhood", kind: "list", category: "neighbourhood" },
  { key: "metro_station", label: "Metro", kind: "list", category: "metro" },
  { key: "amenities", label: "Amenities", kind: "list", category: "amenities" },
  { key: "utilities", label: "Utilities", kind: "list", category: "utilities" },
  { key: "pets", label: "Pets", kind: "list", category: "pets" },
  { key: "parking", label: "Parking", kind: "list", category: "parking" },
  { key: "parking_price", label: "Parking price", kind: "text" },
  { key: "active_status", label: "Active status", kind: "text" },
];

// ─── Color-coded chips (quick visual scanning) ────────────────────────────────

type ChipCategory =
  | "amenities" | "utilities" | "pets" | "parking" | "appliances"
  | "neighbourhood" | "metro" | "partner";

const CHIP_STYLES: Record<ChipCategory, string> = {
  amenities: "bg-indigo-50 text-indigo-700 border-indigo-100",
  utilities: "bg-amber-50 text-amber-700 border-amber-100",
  pets: "bg-rose-50 text-rose-700 border-rose-100",
  parking: "bg-sky-50 text-sky-700 border-sky-100",
  appliances: "bg-teal-50 text-teal-700 border-teal-100",
  neighbourhood: "bg-slate-100 text-slate-600 border-slate-200",
  metro: "bg-cyan-50 text-cyan-700 border-cyan-100",
  partner: "bg-gray-100 text-gray-600 border-gray-200",
};

// Downtown gets a stand-out highlight so it pops at a glance.
const DOWNTOWN_STYLE = "bg-violet-100 text-violet-800 border-violet-300 font-semibold";

function Chips({ values, category }: { values: string[] | null | undefined; category: ChipCategory }) {
  const list = (values ?? []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((v, i) => {
        const isDowntown = category === "neighbourhood" && /downtown|centre-ville|ville-marie/i.test(v);
        return (
          <span
            key={`${v}-${i}`}
            className={`text-[10px] px-1.5 py-0.5 rounded-md border ${isDowntown ? DOWNTOWN_STYLE : CHIP_STYLES[category]}`}
          >
            {v}
          </span>
        );
      })}
    </div>
  );
}

// ─── Address autocomplete (Airtable search) ───────────────────────────────────

function AddressAutocomplete({
  value, onChange, onSelect, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (name: string) => void;
  disabled?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<AirtableBuilding[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/building-suggestions?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch { setSuggestions([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search building address…"
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(s.name); onSelect(s.name); setOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-medium text-brand-navy">{s.name}</p>
              {s.neighbourhood && <p className="text-xs text-gray-400 mt-0.5">{s.neighbourhood}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [tab, setTab] = useState<"browse" | "manage">("browse");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setAuthenticated(true);
    else setPasswordError("Incorrect password. Please try again.");
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/sync-now", { method: "POST" });
      const data = await res.json();
      if (data.ok) setSyncMsg(`Synced ${data.buildings} buildings, ${data.units} units from Airtable.`);
      else setSyncMsg(data.error ?? "Sync failed");
    } catch { setSyncMsg("Sync failed"); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(""), 6000); }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
          <div className="w-12 h-12 bg-brand-navy rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-brand-navy text-center mb-1">Admin Panel</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Enter your password to continue</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
            <Button type="submit" fullWidth>Unlock</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-brand-navy">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-2 text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync now
            </button>
            <button onClick={() => setAuthenticated(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Sign out
            </button>
          </div>
        </div>
        {syncMsg && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <p className="text-xs text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg inline-block">{syncMsg}</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setTab("browse")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === "browse" ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Search className="w-4 h-4" /> Browse Airtable
          </button>
          <button
            onClick={() => setTab("manage")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === "manage" ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Home className="w-4 h-4" /> Manage Listings
          </button>
        </div>

        {tab === "browse" ? <BrowseAirtable /> : <ManageListings />}
      </div>
    </div>
  );
}

// ─── Browse Airtable → Add to website ─────────────────────────────────────────

function BrowseAirtable() {
  const [mode, setMode] = useState<"search" | "manual">("search");
  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <SubTab active={mode === "search"} onClick={() => setMode("search")} icon={<Search className="w-4 h-4" />} label="Search Airtable" />
        <SubTab active={mode === "manual"} onClick={() => setMode("manual")} icon={<PlusCircle className="w-4 h-4" />} label="Add manually" />
      </div>
      {mode === "search" ? <SearchAirtable /> : <ManualAdd />}
    </div>
  );
}

function SubTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
    >
      {icon} {label}
    </button>
  );
}

function SearchAirtable() {
  const [address, setAddress] = useState("");
  const [looking, setLooking] = useState(false);
  const [building, setBuilding] = useState<AirtableBuilding | null>(null);
  const [units, setUnits] = useState<AirtableUnit[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [buildingAdded, setBuildingAdded] = useState(false);

  async function doLookup(addr: string) {
    if (!addr.trim()) return;
    setLooking(true); setBuilding(null); setUnits([]); setNotFound(false); setBuildingAdded(false);
    try {
      const res = await fetch(`/api/admin/airtable?address=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (data.building) { setBuilding(data.building); setUnits(data.units ?? []); }
      else setNotFound(true);
    } finally { setLooking(false); }
  }

  async function addUnit(u: AirtableUnit) {
    setAdding(u.id);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "units", ids: [u.id] }),
      });
      if (res.ok) setUnits((prev) => prev.map((x) => x.id === u.id ? { ...x, in_supabase: true } : x));
    } finally { setAdding(null); }
  }

  async function addAll() {
    const toAdd = units.filter((u) => !u.in_supabase).map((u) => u.id);
    if (!toAdd.length) return;
    setAdding("__all__");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "units", ids: toAdd }),
      });
      if (res.ok) setUnits((prev) => prev.map((x) => ({ ...x, in_supabase: true })));
    } finally { setAdding(null); }
  }

  async function addBuilding() {
    if (!building) return;
    setAdding("__building__");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "buildings", ids: [building.id] }),
      });
      if (res.ok) setBuildingAdded(true);
    } finally { setAdding(null); }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card">
      <h2 className="text-lg font-semibold text-brand-navy mb-1 flex items-center gap-2">
        <Search className="w-5 h-5 text-brand-blue" /> Find listings in Airtable
      </h2>
      <p className="text-sm text-gray-400 mb-5">Search a building, then add the building and/or its units to the website. Airtable is never modified.</p>

      <div className="flex gap-3">
        <AddressAutocomplete value={address} onChange={setAddress} onSelect={(n) => doLookup(n)} disabled={looking} />
        <Button type="button" loading={looking} size="md" onClick={() => doLookup(address)}>
          <Search className="w-4 h-4" /> Lookup
        </Button>
      </div>

      {notFound && (
        <p className="text-sm text-amber-600 mt-4 bg-amber-50 px-4 py-2 rounded-xl">
          No building found in Airtable for that address.
        </p>
      )}

      {building && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-semibold text-brand-navy">{building.name}</span>
            {building.neighbourhood && <span className="text-xs text-gray-400">{building.neighbourhood}</span>}
            {buildingAdded ? (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <Check className="w-3.5 h-3.5" /> Building added
              </span>
            ) : (
              <button
                onClick={addBuilding}
                disabled={adding === "__building__"}
                className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors disabled:opacity-50"
              >
                {adding === "__building__" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
                Add building
              </button>
            )}
          </div>

          {units.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No units found for this building in Airtable.</p>
          ) : (
            <>
              <button
                onClick={addAll}
                disabled={adding === "__all__" || units.every((u) => u.in_supabase)}
                className="mb-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors disabled:opacity-40"
              >
                {adding === "__all__" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add all units
              </button>
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-brand-navy">Unit {u.unit_number}</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {u.bedrooms ? `${u.bedrooms} bd` : "Studio"} · {u.bathrooms || 1} ba · ${u.price.toLocaleString()}/mo · {u.status === "available" ? "Vacant" : "Occupied"}
                      </p>
                    </div>
                    {u.in_supabase ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 px-3 py-1.5">
                        <Check className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : (
                      <button
                        onClick={() => addUnit(u)}
                        disabled={adding === u.id}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {adding === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add to website
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Manual add (create a unit or building directly in Supabase) ──────────────

function ManualAdd() {
  const [type, setType] = useState<"units" | "buildings">("units");
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/listings?type=buildings")
      .then((r) => r.json())
      .then((d) => setBuildings(d.buildings ?? []))
      .catch(() => {});
  }, []);

  const fields = type === "units" ? UNIT_FIELDS : BUILDING_FIELDS;

  async function save() {
    setSaving(true); setMsg("");
    try {
      const fieldsPayload: Record<string, unknown> = { ...values };
      if (type === "units" && buildingId) fieldsPayload.building_airtable_id = buildingId;
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fields: fieldsPayload }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg(`Created. It's a draft — publish it from Manage Listings.`);
        setValues({}); setBuildingId("");
      } else setMsg(data.error ?? "Create failed");
    } catch { setMsg("Create failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card">
      <h2 className="text-lg font-semibold text-brand-navy mb-1 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-brand-blue" /> Add a listing manually
      </h2>
      <p className="text-sm text-gray-400 mb-5">Create a unit or building directly on the website without an Airtable record. It starts as a draft.</p>

      <div className="flex gap-2 mb-5">
        {(["units", "buildings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setValues({}); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              type === t ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            {t === "units" ? "New unit" : "New building"}
          </button>
        ))}
      </div>

      {type === "units" && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Link to building (optional)</label>
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">— None —</option>
            {buildings.map((b) => (
              <option key={b.airtable_id} value={b.airtable_id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <FieldInput
            key={f.key}
            def={f}
            value={values[f.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <Button onClick={save} loading={saving} size="md">
          <Save className="w-4 h-4" /> Create draft
        </Button>
        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}

// ─── Manage Listings (Supabase) ───────────────────────────────────────────────

function ManageListings() {
  const [view, setView] = useState<"units" | "buildings">("units");
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([
        fetch("/api/admin/listings?type=units").then((r) => r.json()),
        fetch("/api/admin/listings?type=buildings").then((r) => r.json()),
      ]);
      setUnits(u.units ?? []);
      setBuildings(b.buildings ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const publishedCount = units.filter((u) => u.published).length;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          <SubTab active={view === "units"} onClick={() => setView("units")} icon={<Home className="w-4 h-4" />} label={`Units (${units.length})`} />
          <SubTab active={view === "buildings"} onClick={() => setView("buildings")} icon={<Building2 className="w-4 h-4" />} label={`Buildings (${buildings.length})`} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{publishedCount} units live</span>
          <button onClick={reload} className="flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-navy transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
      ) : view === "units" ? (
        units.length === 0 ? (
          <Empty text="No units yet. Use “Browse Airtable” to add units, or add one manually." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {units.map((u) => (
              <UnitCard key={u.airtable_id} unit={u} onChanged={reload} />
            ))}
          </div>
        )
      ) : buildings.length === 0 ? (
        <Empty text="No buildings yet. Add one from “Browse Airtable”." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {buildings.map((b) => (
            <BuildingCard
              key={b.airtable_id}
              building={b}
              units={units.filter((u) => u.building_airtable_id === b.airtable_id)}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-gray-400 text-sm text-center py-10">{text}</p>;
}

// ─── Unit card ────────────────────────────────────────────────────────────────

function UnitCard({ unit, onChanged }: { unit: UnitRow; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"publish" | "refresh" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isManual = unit.airtable_id.startsWith("manual-");

  async function togglePublish() {
    setBusy("publish");
    try {
      await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "units", airtable_id: unit.airtable_id, published: !unit.published }),
      });
      onChanged();
    } finally { setBusy(null); }
  }

  async function refresh() {
    setBusy("refresh");
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "units", ids: [unit.airtable_id] }),
      });
      onChanged();
    } finally { setBusy(null); }
  }

  async function del() {
    setBusy("delete");
    try {
      await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "units", airtable_id: unit.airtable_id }),
      });
      onChanged();
    } finally { setBusy(null); setConfirmDelete(false); }
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-brand-navy truncate">Unit {unit.unit_number}</span>
              {unit.apartment_status && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${/vacant/i.test(unit.apartment_status) ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                  {unit.apartment_status}
                </span>
              )}
              {isManual && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Manual</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{unit.building_name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}bd`} · {unit.bathrooms}ba · ${Number(unit.price ?? 0).toLocaleString()}/mo
              {unit.sqft ? ` · ${unit.sqft} sqft` : ""}
              {unit.images.length > 0 && ` · ${unit.images.length}📷`}
              {unit.videos.length > 0 && ` · ${unit.videos.length}🎬`}
            </p>
          </div>
          <PublishBadge published={unit.published} busy={busy === "publish"} onClick={togglePublish} />
        </div>

        {/* quick-scan colour chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Chips values={unit.neighbourhood} category="neighbourhood" />
          <Chips values={unit.amenities} category="amenities" />
          <Chips values={unit.utilities} category="utilities" />
          <Chips values={unit.pets} category="pets" />
          <Chips values={unit.parking} category="parking" />
        </div>

        <CardActions
          expanded={expanded}
          onToggleExpand={() => setExpanded((v) => !v)}
          onEdit={() => { setEditing((v) => !v); setExpanded(true); }}
          onRefresh={isManual ? undefined : refresh}
          onDelete={() => setConfirmDelete(true)}
          busy={busy}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {editing ? (
            <EditFields
              type="units"
              airtableId={unit.airtable_id}
              fields={UNIT_FIELDS}
              row={unit as unknown as Record<string, unknown>}
              overrides={unit.overrides ?? null}
              onSaved={() => { setEditing(false); onChanged(); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <UnitDetails unit={unit} />
          )}

          <MediaManager entityType="unit" airtableId={unit.airtable_id} images={unit.images} videos={unit.videos} onChange={onChanged} />
          <DescriptionEditor type="units" airtableId={unit.airtable_id} value={unit.display_description} onSaved={onChanged} />
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete Unit ${unit.unit_number}?`}
          body="This removes the unit from your website (Supabase) and deletes its uploaded photos/videos. Airtable is not affected."
          confirmLabel="Delete unit"
          loading={busy === "delete"}
          onConfirm={del}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function UnitDetails({ unit }: { unit: UnitRow }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
      <Field label="Sqft" value={unit.sqft?.toString()} />
      <Field label="Promo" value={unit.promo ? `$${unit.promo}` : "—"} />
      <Field label="Furnished" value={unit.furnished ? "Yes" : "No"} />
      <Field label="Parking Price" value={unit.parking_price} />
      <Field label="Available" value={unit.available_date} />
      <Field label="Metro" value={(unit.metro_station ?? []).join(", ")} />
      <Field label="Appliances" value={(unit.appliances ?? []).join(", ")} />
      <Field label="Partner" value={(unit.partner ?? []).join(", ")} />
      <Field label="Notes" value={unit.notes} />
      <Field label="Notes/Contact" value={unit.notes_contact_info} />
    </div>
  );
}

// ─── Building card (edit + nested units) ──────────────────────────────────────

function BuildingCard({ building, units, onChanged }: { building: BuildingRow; units: UnitRow[]; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"publish" | "refresh" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isManual = building.airtable_id.startsWith("manual-");
  const liveUnits = units.filter((u) => u.published).length;

  async function refresh() {
    setBusy("refresh");
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "buildings", ids: [building.airtable_id] }),
      });
      onChanged();
    } finally { setBusy(null); }
  }

  async function del() {
    setBusy("delete");
    try {
      await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "buildings", airtable_id: building.airtable_id }),
      });
      onChanged();
    } finally { setBusy(null); setConfirmDelete(false); }
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="w-4 h-4 text-brand-blue shrink-0" />
              <span className="text-sm font-semibold text-brand-navy truncate">{building.name}</span>
              {isManual && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Manual</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {units.length} unit{units.length !== 1 ? "s" : ""} · {liveUnits} live
            </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 ${building.published ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
            {building.published ? "Live" : "Hidden"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Chips values={building.neighbourhood} category="neighbourhood" />
          <Chips values={building.amenities} category="amenities" />
          <Chips values={building.utilities} category="utilities" />
          <Chips values={building.pets} category="pets" />
          <Chips values={building.parking} category="parking" />
        </div>

        <CardActions
          expanded={expanded}
          expandLabel={`${units.length} unit${units.length !== 1 ? "s" : ""}`}
          onToggleExpand={() => setExpanded((v) => !v)}
          onEdit={() => { setEditing((v) => !v); setExpanded(true); }}
          onRefresh={isManual ? undefined : refresh}
          onDelete={() => setConfirmDelete(true)}
          busy={busy}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {editing && (
            <EditFields
              type="buildings"
              airtableId={building.airtable_id}
              fields={BUILDING_FIELDS}
              row={building as unknown as Record<string, unknown>}
              overrides={building.overrides ?? null}
              onSaved={() => { setEditing(false); onChanged(); }}
              onCancel={() => setEditing(false)}
            />
          )}

          <MediaManager entityType="building" airtableId={building.airtable_id} images={building.images} videos={building.videos} onChange={onChanged} />
          <DescriptionEditor type="buildings" airtableId={building.airtable_id} value={building.display_description} onSaved={onChanged} />

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Units in this building</p>
            {units.length === 0 ? (
              <p className="text-xs text-gray-400">No units linked to this building yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {units.map((u) => (
                  <UnitCard key={u.airtable_id} unit={u} onChanged={onChanged} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${building.name}?`}
          body={`This removes the building${units.length ? ` and its ${units.length} unit${units.length !== 1 ? "s" : ""}` : ""} from your website (Supabase), plus all uploaded media. Airtable is not affected.`}
          confirmLabel="Delete building"
          loading={busy === "delete"}
          onConfirm={del}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ─── Shared card sub-components ────────────────────────────────────────────────

function PublishBadge({ published, busy, onClick }: { published: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${
        published ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"}`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : published ? <Eye className="w-3.5 h-3.5" /> : null}
      {published ? "Live" : "Draft"}
    </button>
  );
}

function CardActions({
  expanded, expandLabel, onToggleExpand, onEdit, onRefresh, onDelete, busy,
}: {
  expanded: boolean;
  expandLabel?: string;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
  onDelete: () => void;
  busy: "publish" | "refresh" | "delete" | null;
}) {
  return (
    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
      <button onClick={onToggleExpand} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-navy px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expandLabel ?? "Details"}
      </button>
      <button onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-navy px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>
      {onRefresh && (
        <button onClick={onRefresh} disabled={busy === "refresh"} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-blue px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
          {busy === "refresh" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      )}
      <button onClick={onDelete} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors ml-auto">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );
}

// ─── Generic edit form (writes to sticky overrides) ───────────────────────────

function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const base = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue";
  if (def.kind === "bool") {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700 py-2">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="rounded" />
        {def.label}
      </label>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{def.label}</label>
      {def.kind === "number" ? (
        <input
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={base}
        />
      ) : def.kind === "list" ? (
        <input
          type="text"
          value={Array.isArray(value) ? value.join(", ") : ""}
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="comma, separated"
          className={base}
        />
      ) : (
        <input
          type={def.kind === "date" ? "text" : "text"}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

function EditFields({
  type, airtableId, fields, row, overrides, onSaved, onCancel,
}: {
  type: "units" | "buildings";
  airtableId: string;
  fields: FieldDef[];
  row: Record<string, unknown>;
  overrides: Record<string, unknown> | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const initial = useRef<Record<string, unknown>>(
    Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? (f.kind === "list" ? [] : null)]))
  );
  const [values, setValues] = useState<Record<string, unknown>>({ ...initial.current });
  const [saving, setSaving] = useState(false);
  const overrideKeys = new Set(Object.keys(overrides ?? {}));

  async function save() {
    setSaving(true);
    try {
      const changed: Record<string, unknown> = {};
      for (const f of fields) {
        if (JSON.stringify(values[f.key]) !== JSON.stringify(initial.current[f.key])) {
          changed[f.key] = values[f.key];
        }
      }
      if (Object.keys(changed).length === 0) { onCancel(); return; }
      await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, airtable_id: airtableId, overrides: changed }),
      });
      onSaved();
    } finally { setSaving(false); }
  }

  async function resetField(key: string) {
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, airtable_id: airtableId, resetFields: [key] }),
    });
    onSaved();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <Pencil className="w-3.5 h-3.5" /> Edit info
        </p>
        <p className="text-[10px] text-gray-400">Edits are sticky — Airtable syncs won&apos;t overwrite them.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.key} className="relative">
            <FieldInput def={f} value={values[f.key]} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />
            {overrideKeys.has(f.key) && (
              <button
                onClick={() => resetField(f.key)}
                title="Reset to Airtable value"
                className="absolute top-0 right-0 flex items-center gap-0.5 text-[10px] text-amber-600 hover:text-amber-800"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button onClick={save} loading={saving} size="sm">
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
      </div>
    </div>
  );
}

// ─── Public description editor ────────────────────────────────────────────────

function DescriptionEditor({ type, airtableId, value, onSaved }: { type: "units" | "buildings"; airtableId: string; value: string | null; onSaved: () => void }) {
  const [desc, setDesc] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, airtable_id: airtableId, display_description: desc }),
      });
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Public description (shown on website)</label>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
      />
      <button onClick={save} disabled={saving} className="mt-2 text-xs font-medium text-brand-blue hover:text-brand-navy disabled:opacity-50">
        {saving ? "Saving…" : "Save description"}
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="text-gray-700 font-medium truncate">{value || "—"}</p>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title, body, confirmLabel, loading, onConfirm, onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-brand-navy mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{body}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Media manager ─────────────────────────────────────────────────────────────

function MediaManager({
  entityType, airtableId, images, videos, onChange,
}: {
  entityType: "unit" | "building";
  airtableId: string;
  images: MediaItem[];
  videos: MediaItem[];
  onChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  async function upload(file: File, kind: "image" | "video") {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("type", entityType);
      fd.append("airtable_id", airtableId);
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) onChange();
    } finally { setUploading(false); }
  }

  async function remove(item: MediaItem, kind: "image" | "video") {
    const res = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: entityType, airtable_id: airtableId, kind, path: item.path }),
    });
    const data = await res.json();
    if (data.ok) onChange();
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-600">Media</span>
        {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((m) => (
          <div key={m.path} className="relative w-20 h-20 rounded-lg overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => remove(m, "image")} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {videos.map((m) => (
          <div key={m.path} className="relative w-20 h-20 rounded-lg overflow-hidden group bg-black">
            <video src={m.url} className="w-full h-full object-cover" />
            <Video className="absolute inset-0 m-auto w-5 h-5 text-white/80" />
            <button onClick={() => remove(m, "video")} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "image")} />
        <input ref={vidInput} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "video")} />
        <button onClick={() => imgInput.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
          <ImagePlus className="w-3.5 h-3.5" /> Add image
        </button>
        <button onClick={() => vidInput.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
          <Video className="w-3.5 h-3.5" /> Add video
        </button>
      </div>
    </div>
  );
}
