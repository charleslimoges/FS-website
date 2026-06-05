"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lock, Search, Plus, Building2, Home, Eye, X, Loader2, Trash2,
  Pencil, HardHat, CheckCircle2, XCircle,
} from "lucide-react";
import { Building, Unit, NEIGHBOURHOODS, AMENITIES, AMENITY_LABELS } from "@/lib/types";
import Button from "@/components/ui/Button";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin2024";

// ─── Address Autocomplete ─────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  name: string;
  neighbourhood: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/building-suggestions?q=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function handleSelect(name: string) {
    onChange(name);
    onSelect(name);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder ?? "e.g. 3462 Aylmer"}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s.name); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-medium text-brand-navy">{s.name}</p>
              {s.neighbourhood && (
                <p className="text-xs text-gray-400 mt-0.5">{s.neighbourhood}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Description Template Generator ──────────────────────────────────────────

function generateDescription(
  name: string,
  neighbourhood: string,
  amenities: string[]
): string {
  const amenityList = amenities.map((a) => AMENITY_LABELS[a] ?? a);
  let text = `Welcome to ${name || "this building"}, a modern residential building ideally located in ${neighbourhood || "the city"}.`;
  if (amenityList.length > 0) {
    text += `\n\nResidents enjoy access to premium amenities including ${amenityList.join(", ")}.`;
  }
  text += `\n\nNestled in ${neighbourhood || "a vibrant neighbourhood"}, you'll be steps away from local cafés, restaurants, boutiques, parks, and public transit. Everything you need for a connected and comfortable lifestyle.`;
  text += `\n\nContact us to schedule a private tour and discover your next home.`;
  return text;
}

// ─── Root Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [tab, setTab] = useState<"buildings" | "units">("buildings");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
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
          <button onClick={() => setAuthenticated(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setTab("buildings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === "buildings" ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 className="w-4 h-4" /> Buildings
          </button>
          <button
            onClick={() => setTab("units")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === "units" ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Home className="w-4 h-4" /> Units
          </button>
        </div>

        {tab === "buildings" ? <BuildingsAdmin /> : <UnitsAdmin />}
      </div>
    </div>
  );
}

// ─── Buildings Admin ──────────────────────────────────────────────────────────

function BuildingsAdmin() {
  const [address, setAddress] = useState("");
  const [looking, setLooking] = useState(false);
  const [foundBuilding, setFoundBuilding] = useState<Building | null>(null);
  const [foundUnits, setFoundUnits] = useState<Unit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [addAll, setAddAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishedBuildings, setPublishedBuildings] = useState<Building[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<Partial<Building>>({
    name: "",
    address: "",
    neighbourhood: "",
    description: "",
    min_price: 0,
    max_price: 0,
    amenities: [],
    unit_count: 0,
    in_construction: false,
  });

  const fetchPublished = useCallback(async () => {
    setLoadingPublished(true);
    try {
      const res = await fetch("/api/admin/building");
      const data = await res.json();
      setPublishedBuildings(data.buildings ?? []);
    } finally {
      setLoadingPublished(false);
    }
  }, []);

  useEffect(() => { fetchPublished(); }, [fetchPublished]);

  async function doLookup(addr: string) {
    if (!addr.trim()) return;
    setLooking(true);
    setFoundBuilding(null);
    setFoundUnits([]);
    setSelectedUnits([]);
    setAddAll(false);
    setIsEditing(false);
    try {
      const res = await fetch("/api/admin/building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", address: addr }),
      });
      const data = await res.json();
      if (data.building) {
        setFoundBuilding(data.building);
        const units: Unit[] = data.units ?? [];
        setFoundUnits(units);
        setSelectedUnits(data.published_unit_ids ?? []);

        const prices = units.map((u) => u.price).filter((p) => p > 0);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;

        const b = data.building as Building;
        setForm({
          ...b,
          min_price: minPrice,
          max_price: maxPrice,
          description: generateDescription(b.name, b.neighbourhood, b.amenities ?? []),
        });
      } else {
        setFoundBuilding(null);
        setForm({
          name: "",
          address: addr,
          neighbourhood: "",
          description: "",
          min_price: 0,
          max_price: 0,
          amenities: [],
          in_construction: false,
        });
      }
    } finally {
      setLooking(false);
    }
  }

  async function handleEdit(building: Building) {
    setAddress(building.name);
    setFoundBuilding(building);
    setIsEditing(true);
    setForm({ ...building });
    setLooking(true);
    try {
      const res = await fetch("/api/admin/building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_units", building_id: building.id }),
      });
      const data = await res.json();
      setFoundUnits(data.units ?? []);
      setSelectedUnits(data.published_unit_ids ?? []);
      setAddAll(false);
    } finally {
      setLooking(false);
    }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const unitIds = addAll ? foundUnits.map((u) => u.id) : selectedUnits;
      await fetch("/api/admin/building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          id: foundBuilding?.id,
          ...form,
          unit_ids: unitIds,
        }),
      });
      await fetchPublished();
      setAddress("");
      setFoundBuilding(null);
      setFoundUnits([]);
      setSelectedUnits([]);
      setAddAll(false);
      setIsEditing(false);
      setForm({ name: "", address: "", neighbourhood: "", description: "", min_price: 0, max_price: 0, amenities: [], unit_count: 0, in_construction: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(buildingId: string) {
    await fetch("/api/admin/building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id: buildingId }),
    });
    await fetchPublished();
  }

  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: (f.amenities ?? []).includes(a)
        ? (f.amenities ?? []).filter((x) => x !== a)
        : [...(f.amenities ?? []), a],
    }));
  }

  const showForm = foundBuilding !== null || (address && !looking);

  return (
    <div className="space-y-8">
      {/* Lookup / Search */}
      <div ref={formRef} className="bg-white rounded-3xl p-6 shadow-card">
        <h2 className="text-lg font-semibold text-brand-navy mb-5 flex items-center gap-2">
          <Search className="w-5 h-5 text-brand-blue" />
          {isEditing ? "Edit Building" : "Add Building by Address"}
        </h2>

        {isEditing && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-brand-blue/10 rounded-xl">
            <Pencil className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-medium text-brand-blue">Editing: {foundBuilding?.name}</span>
            <button
              type="button"
              onClick={() => { setIsEditing(false); setFoundBuilding(null); setAddress(""); setFoundUnits([]); }}
              className="ml-auto text-xs text-brand-blue hover:text-brand-navy"
            >
              Cancel
            </button>
          </div>
        )}

        {!isEditing && (
          <div className="flex gap-3 mb-1">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={(name) => doLookup(name)}
              placeholder="e.g. 3462 Aylmer"
              disabled={looking}
            />
            <Button
              type="button"
              loading={looking}
              size="md"
              onClick={() => doLookup(address)}
            >
              <Search className="w-4 h-4" /> Lookup
            </Button>
          </div>
        )}

        {!foundBuilding && address && !looking && (
          <p className="text-sm text-amber-600 mt-3 bg-amber-50 px-4 py-2 rounded-xl">
            No building found in Airtable for this address.
          </p>
        )}

        {showForm && (
          <form onSubmit={handleSave} className="mt-6 space-y-5 border-t border-gray-100 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name *</label>
                <input
                  required
                  value={form.name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  required
                  value={form.address ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighbourhood *</label>
                <select
                  required
                  value={form.neighbourhood ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, neighbourhood: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                >
                  <option value="">Select neighbourhood</option>
                  {NEIGHBOURHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price
                    {foundUnits.length > 0 && <span className="text-xs text-gray-400 ml-1">(auto)</span>}
                  </label>
                  <input
                    type="number"
                    value={form.min_price ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, min_price: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price
                    {foundUnits.length > 0 && <span className="text-xs text-gray-400 ml-1">(auto)</span>}
                  </label>
                  <input
                    type="number"
                    value={form.max_price ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, max_price: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>
            </div>

            {/* In construction toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setForm((f) => ({ ...f, in_construction: !f.in_construction }))}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                  form.in_construction ? "bg-orange-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.in_construction ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-brand-navy select-none">
                <HardHat className="w-4 h-4 text-orange-500" /> Mark as In Construction
              </span>
            </label>

            {/* Description template */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      description: generateDescription(f.name ?? "", f.neighbourhood ?? "", f.amenities ?? []),
                    }))
                  }
                  className="text-xs text-brand-blue hover:text-brand-navy transition-colors"
                >
                  ↺ Regenerate template
                </button>
              </div>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={6}
                placeholder="A marketing description for this building will be auto-generated from the name, neighbourhood, and amenities above."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
              />
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      (form.amenities ?? []).includes(a)
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:border-indigo-400"
                    }`}
                  >
                    {AMENITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            {/* Units */}
            {foundUnits.length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-brand-navy mb-3">
                  Units ({foundUnits.length} found in Airtable)
                </h3>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl mb-2">
                  <input
                    type="checkbox"
                    checked={addAll}
                    onChange={(e) => setAddAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-blue"
                  />
                  <span className="text-sm font-medium text-brand-navy">Publish all units</span>
                </label>
                {!addAll && (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {foundUnits.map((unit) => (
                      <label key={unit.id} className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit.id)}
                          onChange={(e) =>
                            setSelectedUnits((prev) =>
                              e.target.checked ? [...prev, unit.id] : prev.filter((id) => id !== unit.id)
                            )
                          }
                          className="w-4 h-4 rounded border-gray-300 text-brand-blue"
                        />
                        <span className="text-sm text-gray-700 flex-1">
                          Unit {unit.unit_number} · {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}bd`} · ${unit.price}/mo
                        </span>
                        {unit.status === "in_construction" && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <HardHat className="w-3 h-3" /> In Construction
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" loading={saving}>
              <Plus className="w-4 h-4" />
              {isEditing ? "Save Changes" : foundBuilding ? "Update & Publish" : "Add Building"}
            </Button>
          </form>
        )}
      </div>

      {/* Published buildings */}
      <div className="bg-white rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-brand-navy flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-blue" /> Published Buildings ({publishedBuildings.length})
          </h2>
          <button onClick={fetchPublished} className="text-sm text-brand-blue hover:text-brand-navy transition-colors">
            Refresh
          </button>
        </div>

        {loadingPublished ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : publishedBuildings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No buildings published yet</p>
        ) : (
          <div className="space-y-2">
            {publishedBuildings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-navy truncate">{b.name}</span>
                    {b.in_construction && (
                      <span className="flex items-center gap-1 text-xs text-orange-600 shrink-0">
                        <HardHat className="w-3 h-3" /> In Construction
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {b.neighbourhood && <span className="text-xs text-gray-400">{b.neighbourhood}</span>}
                    {(b.min_price > 0 || b.max_price > 0) && (
                      <span className="text-xs text-gray-500">
                        ${b.min_price.toLocaleString()} – ${b.max_price.toLocaleString()}/mo
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(b)}
                    className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-navy transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleRemove(b.id)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Units Admin ──────────────────────────────────────────────────────────────

function UnitsAdmin() {
  const [address, setAddress] = useState("");
  const [looking, setLooking] = useState(false);
  const [foundBuilding, setFoundBuilding] = useState<Building | null>(null);
  const [buildingUnits, setBuildingUnits] = useState<Unit[]>([]);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [publishedUnits, setPublishedUnits] = useState<Unit[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(false);

  const fetchPublished = useCallback(async () => {
    setLoadingPublished(true);
    try {
      const res = await fetch("/api/admin/unit");
      const data = await res.json();
      setPublishedUnits(data.units ?? []);
    } finally {
      setLoadingPublished(false);
    }
  }, []);

  useEffect(() => { fetchPublished(); }, [fetchPublished]);

  async function doLookup(addr: string) {
    if (!addr.trim()) return;
    setLooking(true);
    setFoundBuilding(null);
    setBuildingUnits([]);
    setPublishedIds([]);
    try {
      const res = await fetch("/api/admin/building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", address: addr }),
      });
      const data = await res.json();
      if (data.building) {
        setFoundBuilding(data.building);
        setBuildingUnits(data.units ?? []);
        setPublishedIds(data.published_unit_ids ?? []);
      } else {
        setFoundBuilding(null);
      }
    } finally {
      setLooking(false);
    }
  }

  async function handleToggle(unit: Unit, publish: boolean) {
    setSaving(unit.id);
    try {
      await fetch("/api/admin/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: publish ? "publish" : "unpublish", id: unit.id }),
      });
      setPublishedIds((prev) =>
        publish ? [...prev, unit.id] : prev.filter((id) => id !== unit.id)
      );
      await fetchPublished();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="bg-white rounded-3xl p-6 shadow-card">
        <h2 className="text-lg font-semibold text-brand-navy mb-5 flex items-center gap-2">
          <Search className="w-5 h-5 text-brand-blue" /> Manage Units by Building
        </h2>
        <div className="flex gap-3">
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={(name) => doLookup(name)}
            placeholder="Search building address..."
            disabled={looking}
          />
          <Button
            type="button"
            loading={looking}
            size="md"
            onClick={() => doLookup(address)}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {!looking && address && !foundBuilding && (
          <p className="text-amber-600 text-sm mt-3 bg-amber-50 px-4 py-2 rounded-xl">
            No building found for that address.
          </p>
        )}

        {foundBuilding && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-semibold text-brand-navy">{foundBuilding.name}</span>
              {foundBuilding.neighbourhood && (
                <span className="text-xs text-gray-400">{foundBuilding.neighbourhood}</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{buildingUnits.length} unit{buildingUnits.length !== 1 ? "s" : ""}</span>
            </div>

            {buildingUnits.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No units found for this building in Airtable.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {buildingUnits.map((unit) => {
                  const isPublished = publishedIds.includes(unit.id);
                  const isSaving = saving === unit.id;
                  return (
                    <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-brand-navy">Unit {unit.unit_number}</span>
                          {unit.status === "in_construction" && (
                            <span className="text-xs text-orange-500 flex items-center gap-1">
                              <HardHat className="w-3 h-3" /> In Construction
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms} bd`} · {unit.bathrooms} ba · ${unit.price.toLocaleString()}/mo
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle(unit, !isPublished)}
                        disabled={isSaving}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          isPublished
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPublished ? (
                          <><XCircle className="w-3.5 h-3.5" /> Unpublish</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Publish</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Published units */}
      <div className="bg-white rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-brand-navy flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-blue" /> Published Units ({publishedUnits.length})
          </h2>
          <button onClick={fetchPublished} className="text-sm text-brand-blue hover:text-brand-navy transition-colors">
            Refresh
          </button>
        </div>

        {loadingPublished ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : publishedUnits.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No published units yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {publishedUnits.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-navy">Unit {unit.unit_number}</span>
                    {unit.building_name && (
                      <span className="text-xs text-gray-400">{unit.building_name}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}bd`} · ${unit.price.toLocaleString()}/mo
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/admin/unit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "unpublish", id: unit.id }),
                    });
                    await fetchPublished();
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Unpublish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
