"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import BuildingCard from "@/components/ui/BuildingCard";
import { BuildingSkeletonCard } from "@/components/ui/SkeletonCard";
import { Building, NEIGHBOURHOODS, AMENITIES, AMENITY_LABELS } from "@/lib/types";

interface Filters {
  neighbourhood: string[];
  min_price: string;
  max_price: string;
  amenities: string[];
  sort: string;
}

const EMPTY_BUILDING_FILTERS: Filters = {
  neighbourhood: [],
  min_price: "",
  max_price: "",
  amenities: [],
  sort: "price_asc",
};

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

interface BuildingFilterSidebarProps {
  draft: Filters;
  setDraft: React.Dispatch<React.SetStateAction<Filters>>;
  applied: Filters;
  clearFilters: () => void;
  applyFilters: () => void;
}

function BuildingFilterSidebar({
  draft,
  setDraft,
  applied,
  clearFilters,
  applyFilters,
}: BuildingFilterSidebarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const draftFilterCount =
    draft.neighbourhood.length +
    draft.amenities.length +
    (draft.min_price ? 1 : 0) +
    (draft.max_price ? 1 : 0);

  const appliedFilterCount =
    applied.neighbourhood.length +
    applied.amenities.length +
    (applied.min_price ? 1 : 0) +
    (applied.max_price ? 1 : 0);

  function toggleNeighbourhood(n: string) {
    setDraft((f) => ({
      ...f,
      neighbourhood: f.neighbourhood.includes(n)
        ? f.neighbourhood.filter((x) => x !== n)
        : [...f.neighbourhood, n],
    }));
  }

  function toggleAmenity(a: string) {
    setDraft((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-navy" />
          <span className="font-semibold text-brand-navy text-sm">Filters</span>
          {appliedFilterCount > 0 && (
            <span className="w-5 h-5 bg-brand-navy text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {appliedFilterCount}
            </span>
          )}
        </div>
        {draftFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-400 hover:text-brand-navy transition-colors"
          >
            Clear all
          </button>
        )}
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

      {/* Neighbourhood */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Neighbourhood</p>
        <div className="flex flex-wrap gap-2">
          {NEIGHBOURHOODS.map((n) => (
            <FilterPill key={n} active={draft.neighbourhood.includes(n)} onClick={() => toggleNeighbourhood(n)}>
              {n}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Price / month</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Min $"
            value={draft.min_price}
            onChange={(e) => setDraft((f) => ({ ...f, min_price: e.target.value.replace(/\D/g, "") }))}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <span className="text-gray-300 text-xs shrink-0">to</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Max $"
            value={draft.max_price}
            onChange={(e) => setDraft((f) => ({ ...f, max_price: e.target.value.replace(/\D/g, "") }))}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-brand-navy transition-colors"
        >
          Advanced Filters
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>

        {advancedOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <FilterPill key={a} active={draft.amenities.includes(a)} onClick={() => toggleAmenity(a)}>
                  {AMENITY_LABELS[a]}
                </FilterPill>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="px-5 py-4">
        <button
          onClick={applyFilters}
          className="w-full bg-brand-navy text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-brand-blue transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function BuildingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const initial: Filters = {
    neighbourhood: searchParams.getAll("neighbourhood"),
    min_price: searchParams.get("min_price") ?? "",
    max_price: searchParams.get("max_price") ?? "",
    amenities: searchParams.getAll("amenities"),
    sort: searchParams.get("sort") ?? "price_asc",
  };

  const [draft, setDraft] = useState<Filters>(initial);
  const [applied, setApplied] = useState<Filters>(initial);

  const fetchBuildings = useCallback(async (f: Filters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      f.neighbourhood.forEach((n) => params.append("neighbourhood", n));
      if (f.min_price) params.set("min_price", f.min_price);
      if (f.max_price) params.set("max_price", f.max_price);
      f.amenities.forEach((a) => params.append("amenities", a));

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

  const appliedFilterCount =
    applied.neighbourhood.length +
    applied.amenities.length +
    (applied.min_price ? 1 : 0) +
    (applied.max_price ? 1 : 0);

  const sidebarProps = { draft, setDraft, applied, clearFilters, applyFilters };

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
            <div className="sticky top-[80px]">
              <BuildingFilterSidebar {...sidebarProps} />
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileSidebarOpen(false)}
              />
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
                <button
                  onClick={() => fetchBuildings(applied)}
                  className="text-brand-blue text-sm font-medium hover:text-brand-navy transition-colors"
                >
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
                <button
                  onClick={clearFilters}
                  className="text-brand-blue text-sm font-medium hover:text-brand-navy transition-colors"
                >
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
