"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import UnitCard from "@/components/ui/UnitCard";
import MultiSelect from "@/components/ui/MultiSelect";
import BookVisitModal from "@/components/ui/BookVisitModal";
import UnitDetailModal from "@/components/ui/UnitDetailModal";
import { UnitSkeletonCard } from "@/components/ui/SkeletonCard";
import { Unit, FilterOptions } from "@/lib/types";

const EMPTY_OPTIONS: FilterOptions = {
  neighbourhoods: [], amenities: [], utilities: [], appliances: [],
  pets: [], parking: [], bedrooms: [], bathrooms: [],
};

const EMPTY_FILTERS = {
  buildings: [] as string[],
  neighbourhood: [] as string[],
  min_price: "",
  max_price: "",
  bedrooms: [] as number[],
  bathrooms: [] as number[],
  promo: false,
  parking: [] as string[],
  utilities_included: false,
  utilities: [] as string[],
  appliances: [] as string[],
  amenities: [] as string[],
  pets: [] as string[],
  furnished: false,
  available_now: false,
};

type Filters = typeof EMPTY_FILTERS;

const bedLabel = (n: number) => (n === 0 ? "Studio" : `${n} bd`);
const bathLabel = (n: number) => `${n % 1 === 0 ? n : n.toFixed(1)} ba`;

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-brand-navy text-white"
          : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-brand-navy hover:text-brand-navy"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-brand-navy" : "bg-gray-200"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-gray-600 group-hover:text-brand-navy transition-colors select-none">{label}</span>
    </label>
  );
}

function countFilters(f: Filters): number {
  return (
    f.buildings.length + f.neighbourhood.length + f.bedrooms.length + f.bathrooms.length +
    f.parking.length + f.pets.length + f.amenities.length + f.appliances.length + f.utilities.length +
    (f.min_price ? 1 : 0) + (f.max_price ? 1 : 0) + (f.promo ? 1 : 0) +
    (f.utilities_included ? 1 : 0) + (f.furnished ? 1 : 0) + (f.available_now ? 1 : 0)
  );
}

interface SidebarProps {
  draft: Filters;
  setDraft: React.Dispatch<React.SetStateAction<Filters>>;
  applied: Filters;
  sort: string;
  setSort: (v: string) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  options: FilterOptions;
}

function UnitFilterSidebar({ draft, setDraft, applied, sort, setSort, clearFilters, applyFilters, options }: SidebarProps) {
  function toggleNum(key: "bedrooms" | "bathrooms", value: number) {
    setDraft((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  }
  const setList = (key: keyof Filters) => (next: string[]) => setDraft((f) => ({ ...f, [key]: next }));

  const draftCount = countFilters(draft);
  const appliedCount = countFilters(applied);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      {/* Header + Apply (on top) */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-navy" />
            <span className="font-semibold text-brand-navy text-sm">Filters</span>
            {appliedCount > 0 && (
              <span className="w-5 h-5 bg-brand-navy text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {appliedCount}
              </span>
            )}
          </div>
          {draftCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-brand-navy transition-colors">
              Clear all
            </button>
          )}
        </div>
        <button
          onClick={applyFilters}
          className="w-full bg-brand-navy text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-brand-blue transition-colors"
        >
          Apply Filters
        </button>
      </div>

      {/* Sort */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Sort by</p>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Bedrooms */}
      {options.bedrooms.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Bedrooms</p>
          <div className="flex flex-wrap gap-2">
            {options.bedrooms.map((n) => (
              <FilterPill key={n} active={draft.bedrooms.includes(n)} onClick={() => toggleNum("bedrooms", n)}>
                {bedLabel(n)}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {/* Bathrooms */}
      {options.bathrooms.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Bathrooms</p>
          <div className="flex flex-wrap gap-2">
            {options.bathrooms.map((n) => (
              <FilterPill key={n} active={draft.bathrooms.includes(n)} onClick={() => toggleNum("bathrooms", n)}>
                {bathLabel(n)}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Price / month</p>
        <div className="flex gap-2 items-center">
          <input
            type="text" inputMode="numeric" placeholder="Min $"
            value={draft.min_price}
            onChange={(e) => setDraft((f) => ({ ...f, min_price: e.target.value.replace(/\D/g, "") }))}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <span className="text-gray-300 text-xs shrink-0">to</span>
          <input
            type="text" inputMode="numeric" placeholder="Max $"
            value={draft.max_price}
            onChange={(e) => setDraft((f) => ({ ...f, max_price: e.target.value.replace(/\D/g, "") }))}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Dropdown facets */}
      <div className="px-5 py-4 border-b border-gray-100 space-y-4">
        <MultiSelect label="Neighbourhood" options={options.neighbourhoods} selected={draft.neighbourhood} onChange={setList("neighbourhood")} />
        <MultiSelect label="Building Amenities" options={options.amenities} selected={draft.amenities} onChange={setList("amenities")} />
        <MultiSelect label="Utilities Included" options={options.utilities} selected={draft.utilities} onChange={setList("utilities")} />
        <MultiSelect label="In-Unit Appliances" options={options.appliances} selected={draft.appliances} onChange={setList("appliances")} />
        <MultiSelect label="Pets" options={options.pets} selected={draft.pets} onChange={setList("pets")} />
        <MultiSelect label="Parking" options={options.parking} selected={draft.parking} onChange={setList("parking")} />
      </div>

      {/* Quick toggles */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Quick Filters</p>
        <ToggleRow checked={draft.available_now} onChange={(v) => setDraft((f) => ({ ...f, available_now: v }))} label="Available Now" />
        <ToggleRow checked={draft.promo} onChange={(v) => setDraft((f) => ({ ...f, promo: v }))} label="Promo Available" />
        <ToggleRow checked={draft.furnished} onChange={(v) => setDraft((f) => ({ ...f, furnished: v }))} label="Furnished" />
        <ToggleRow checked={draft.utilities_included} onChange={(v) => setDraft((f) => ({ ...f, utilities_included: v }))} label="Any Utilities Included" />
      </div>
    </div>
  );
}

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [units, setUnits] = useState<Unit[]>([]);
  const [options, setOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bookingUnit, setBookingUnit] = useState<Unit | null>(null);
  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  const [sort, setSort] = useState("price_asc");

  const initialFilters: Filters = {
    buildings: searchParams.getAll("building"),
    neighbourhood: searchParams.getAll("neighbourhood"),
    min_price: searchParams.get("min_price") ?? "",
    max_price: searchParams.get("max_price") ?? "",
    bedrooms: searchParams.getAll("bedrooms").map(Number),
    bathrooms: searchParams.getAll("bathrooms").map(Number),
    promo: searchParams.get("promo") === "true",
    parking: searchParams.getAll("parking"),
    utilities_included: searchParams.get("utilities_included") === "true",
    utilities: searchParams.getAll("utilities"),
    appliances: searchParams.getAll("appliances"),
    amenities: searchParams.getAll("amenities"),
    pets: searchParams.getAll("pets"),
    furnished: searchParams.get("furnished") === "true",
    available_now: searchParams.get("available_now") === "true",
  };

  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);

  useEffect(() => {
    fetch("/api/filter-options?type=units")
      .then((r) => r.json())
      .then((d) => d.options && setOptions(d.options))
      .catch(() => {});
  }, []);

  const fetchUnits = useCallback(async (f: Filters, s: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      f.buildings.forEach((b) => params.append("building", b));
      f.neighbourhood.forEach((n) => params.append("neighbourhood", n));
      if (f.min_price) params.set("min_price", f.min_price);
      if (f.max_price) params.set("max_price", f.max_price);
      f.bedrooms.forEach((b) => params.append("bedrooms", String(b)));
      f.bathrooms.forEach((b) => params.append("bathrooms", String(b)));
      if (f.promo) params.set("promo", "true");
      f.parking.forEach((p) => params.append("parking", p));
      if (f.utilities_included) params.set("utilities_included", "true");
      f.utilities.forEach((u) => params.append("utilities", u));
      f.amenities.forEach((a) => params.append("amenities", a));
      f.appliances.forEach((a) => params.append("appliances", a));
      f.pets.forEach((p) => params.append("pets", p));
      if (f.furnished) params.set("furnished", "true");
      if (f.available_now) params.set("available_now", "true");

      const res = await fetch(`/api/units?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      let results: Unit[] = data.units ?? [];
      if (s === "price_asc") results = results.sort((a, b) => a.price - b.price);
      else if (s === "price_desc") results = results.sort((a, b) => b.price - a.price);

      setUnits(results);
    } catch {
      setError("Couldn't load units. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits(applied, sort);
    const params = new URLSearchParams();
    applied.buildings.forEach((b) => params.append("building", b));
    applied.neighbourhood.forEach((n) => params.append("neighbourhood", n));
    if (applied.min_price) params.set("min_price", applied.min_price);
    if (applied.max_price) params.set("max_price", applied.max_price);
    applied.bedrooms.forEach((b) => params.append("bedrooms", String(b)));
    applied.bathrooms.forEach((b) => params.append("bathrooms", String(b)));
    if (applied.promo) params.set("promo", "true");
    applied.parking.forEach((p) => params.append("parking", p));
    if (applied.utilities_included) params.set("utilities_included", "true");
    applied.utilities.forEach((u) => params.append("utilities", u));
    applied.amenities.forEach((a) => params.append("amenities", a));
    applied.appliances.forEach((a) => params.append("appliances", a));
    applied.pets.forEach((p) => params.append("pets", p));
    if (applied.furnished) params.set("furnished", "true");
    if (applied.available_now) params.set("available_now", "true");
    router.replace(`/properties${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [applied, sort, fetchUnits, router]);

  function applyFilters() {
    setApplied(draft);
    setMobileSidebarOpen(false);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  const appliedFilterCount = countFilters(applied);
  const sidebarProps = { draft, setDraft, applied, sort, setSort, clearFilters, applyFilters, options };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Available Units</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {loading ? "Loading..." : `${units.length} unit${units.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:border-brand-blue transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {appliedFilterCount > 0 && (
              <span className="w-5 h-5 bg-brand-navy text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {appliedFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[260px] shrink-0">
            <div className="sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto">
              <UnitFilterSidebar {...sidebarProps} />
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
              <div className="relative w-80 max-w-full bg-gray-50 h-full overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-brand-navy">Filters</span>
                  <button onClick={() => setMobileSidebarOpen(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <UnitFilterSidebar {...sidebarProps} />
              </div>
            </div>
          )}

          {/* Results */}
          <main className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">{error}</p>
                <button onClick={() => fetchUnits(applied, sort)} className="text-brand-blue text-sm font-medium hover:text-brand-navy">
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <UnitSkeletonCard key={i} />
                ))}
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">No units found</h3>
                <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                <button onClick={clearFilters} className="text-brand-blue text-sm font-medium hover:text-brand-navy">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {units.map((unit) => (
                  <UnitCard key={unit.id} unit={unit} onBookVisit={setBookingUnit} onViewDetails={setDetailUnit} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {bookingUnit && <BookVisitModal unit={bookingUnit} onClose={() => setBookingUnit(null)} />}
      {detailUnit && (
        <UnitDetailModal
          unit={detailUnit}
          onClose={() => setDetailUnit(null)}
          onBookVisit={(u) => { setDetailUnit(null); setBookingUnit(u); }}
        />
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
