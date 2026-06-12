"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import BuildingCard from "@/components/ui/BuildingCard";
import MultiSelect from "@/components/ui/MultiSelect";
import { BuildingSkeletonCard } from "@/components/ui/SkeletonCard";
import { Building, FilterOptions } from "@/lib/types";

const EMPTY_OPTIONS: FilterOptions = {
  neighbourhoods: [], amenities: [], utilities: [], appliances: [],
  pets: [], parking: [], bedrooms: [], bathrooms: [],
};

interface Filters {
  neighbourhood: string[];
  min_price: string;
  max_price: string;
  amenities: string[];
  utilities: string[];
  appliances: string[];
  pets: string[];
  parking: string[];
  bedrooms: number[];
  bathrooms: number[];
  sort: string;
}

const EMPTY_BUILDING_FILTERS: Filters = {
  neighbourhood: [], min_price: "", max_price: "", amenities: [], utilities: [],
  appliances: [], pets: [], parking: [], bedrooms: [], bathrooms: [], sort: "price_asc",
};

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

function countFilters(f: Filters): number {
  return (
    f.neighbourhood.length + f.amenities.length + f.utilities.length + f.appliances.length +
    f.pets.length + f.parking.length + f.bedrooms.length + f.bathrooms.length +
    (f.min_price ? 1 : 0) + (f.max_price ? 1 : 0)
  );
}

interface SidebarProps {
  draft: Filters;
  setDraft: React.Dispatch<React.SetStateAction<Filters>>;
  applied: Filters;
  clearFilters: () => void;
  applyFilters: () => void;
  options: FilterOptions;
}

function BuildingFilterSidebar({ draft, setDraft, applied, clearFilters, applyFilters, options }: SidebarProps) {
  const setList = (key: keyof Filters) => (next: string[]) => setDraft((f) => ({ ...f, [key]: next }));
  function toggleNum(key: "bedrooms" | "bathrooms", value: number) {
    setDraft((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  }

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
            value={draft.sort}
            onChange={(e) => setDraft((f) => ({ ...f, sort: e.target.value }))}
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
      <div className="px-5 py-4 space-y-4">
        <MultiSelect label="Neighbourhood" options={options.neighbourhoods} selected={draft.neighbourhood} onChange={setList("neighbourhood")} />
        <MultiSelect label="Building Amenities" options={options.amenities} selected={draft.amenities} onChange={setList("amenities")} />
        <MultiSelect label="Utilities Included" options={options.utilities} selected={draft.utilities} onChange={setList("utilities")} />
        <MultiSelect label="In-Unit Appliances" options={options.appliances} selected={draft.appliances} onChange={setList("appliances")} />
        <MultiSelect label="Pets" options={options.pets} selected={draft.pets} onChange={setList("pets")} />
        <MultiSelect label="Parking" options={options.parking} selected={draft.parking} onChange={setList("parking")} />
      </div>
    </div>
  );
}

function BuildingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [options, setOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const initial: Filters = {
    neighbourhood: searchParams.getAll("neighbourhood"),
    min_price: searchParams.get("min_price") ?? "",
    max_price: searchParams.get("max_price") ?? "",
    amenities: searchParams.getAll("amenities"),
    utilities: searchParams.getAll("utilities"),
    appliances: searchParams.getAll("appliances"),
    pets: searchParams.getAll("pets"),
    parking: searchParams.getAll("parking"),
    bedrooms: searchParams.getAll("bedrooms").map(Number),
    bathrooms: searchParams.getAll("bathrooms").map(Number),
    sort: searchParams.get("sort") ?? "price_asc",
  };

  const [draft, setDraft] = useState<Filters>(initial);
  const [applied, setApplied] = useState<Filters>(initial);

  useEffect(() => {
    fetch("/api/filter-options?type=buildings")
      .then((r) => r.json())
      .then((d) => d.options && setOptions(d.options))
      .catch(() => {});
  }, []);

  const fetchBuildings = useCallback(async (f: Filters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      f.neighbourhood.forEach((n) => params.append("neighbourhood", n));
      if (f.min_price) params.set("min_price", f.min_price);
      if (f.max_price) params.set("max_price", f.max_price);
      f.amenities.forEach((a) => params.append("amenities", a));
      f.utilities.forEach((u) => params.append("utilities", u));
      f.appliances.forEach((a) => params.append("appliances", a));
      f.pets.forEach((p) => params.append("pets", p));
      f.parking.forEach((p) => params.append("parking", p));
      f.bedrooms.forEach((b) => params.append("bedrooms", String(b)));
      f.bathrooms.forEach((b) => params.append("bathrooms", String(b)));

      const res = await fetch(`/api/buildings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      let results: Building[] = data.buildings ?? [];
      if (f.sort === "price_asc") results = results.sort((a, b) => a.min_price - b.min_price);
      else if (f.sort === "price_desc") results = results.sort((a, b) => b.max_price - a.max_price);

      setBuildings(results);
    } catch {
      setError("Couldn't load buildings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings(applied);
    const params = new URLSearchParams();
    applied.neighbourhood.forEach((n) => params.append("neighbourhood", n));
    if (applied.min_price) params.set("min_price", applied.min_price);
    if (applied.max_price) params.set("max_price", applied.max_price);
    applied.amenities.forEach((a) => params.append("amenities", a));
    applied.utilities.forEach((u) => params.append("utilities", u));
    applied.appliances.forEach((a) => params.append("appliances", a));
    applied.pets.forEach((p) => params.append("pets", p));
    applied.parking.forEach((p) => params.append("parking", p));
    applied.bedrooms.forEach((b) => params.append("bedrooms", String(b)));
    applied.bathrooms.forEach((b) => params.append("bathrooms", String(b)));
    if (applied.sort !== "price_asc") params.set("sort", applied.sort);
    router.replace(`/buildings${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [applied, fetchBuildings, router]);

  function applyFilters() {
    setApplied(draft);
    setMobileSidebarOpen(false);
  }

  function clearFilters() {
    setDraft(EMPTY_BUILDING_FILTERS);
    setApplied(EMPTY_BUILDING_FILTERS);
  }

  const appliedFilterCount = countFilters(applied);
  const sidebarProps = { draft, setDraft, applied, clearFilters, applyFilters, options };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Our Buildings</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {loading
                ? "Loading..."
                : `${buildings.length} building${buildings.length !== 1 ? "s" : ""} available across Montreal`}
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
              <BuildingFilterSidebar {...sidebarProps} />
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
                <BuildingFilterSidebar {...sidebarProps} />
              </div>
            </div>
          )}

          {/* Results */}
          <main className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">{error}</p>
                <button onClick={() => fetchBuildings(applied)} className="text-brand-blue text-sm font-medium hover:text-brand-navy transition-colors">
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <BuildingSkeletonCard key={i} />
                ))}
              </div>
            ) : buildings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">No buildings found</h3>
                <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                <button onClick={clearFilters} className="text-brand-blue text-sm font-medium hover:text-brand-navy transition-colors">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {buildings.map((building) => (
                  <BuildingCard key={building.id} building={building} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function BuildingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <BuildingsContent />
    </Suspense>
  );
}
