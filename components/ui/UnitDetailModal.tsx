"use client";

import { useState } from "react";
import {
  X, Bed, Bath, Maximize2, Car, PawPrint, Sofa, Zap, Tag, MapPin, Calendar,
  Dumbbell, Waves, Sunset, ConciergeBell, Warehouse, Bike, WashingMachine,
  ChevronLeft, ChevronRight, HardHat, Refrigerator, Wind, Microwave, CookingPot,
} from "lucide-react";
import { Unit, AMENITY_LABELS, APPLIANCE_LABELS } from "@/lib/types";
import Button from "./Button";

const amenityIcons: Record<string, React.ReactNode> = {
  gym: <Dumbbell className="w-3.5 h-3.5" />,
  pool: <Waves className="w-3.5 h-3.5" />,
  rooftop: <Sunset className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  concierge: <ConciergeBell className="w-3.5 h-3.5" />,
  storage: <Warehouse className="w-3.5 h-3.5" />,
  bike_storage: <Bike className="w-3.5 h-3.5" />,
  laundry: <WashingMachine className="w-3.5 h-3.5" />,
  elevator: <span className="text-[11px] font-bold">↑↓</span>,
  balcony: <span className="text-[10px] font-bold">🪟</span>,
  terrace: <span className="text-[10px] font-bold">🌿</span>,
  dog_wash: <span className="text-[10px] font-bold">🐾</span>,
};

const applianceIcons: Record<string, React.ReactNode> = {
  washer_dryer: <WashingMachine className="w-3.5 h-3.5" />,
  dishwasher: <span className="text-[10px] font-bold">🍽</span>,
  fridge: <Refrigerator className="w-3.5 h-3.5" />,
  stove: <CookingPot className="w-3.5 h-3.5" />,
  microwave: <Microwave className="w-3.5 h-3.5" />,
  air_conditioning: <Wind className="w-3.5 h-3.5" />,
};

interface UnitDetailModalProps {
  unit: Unit;
  onClose: () => void;
  onBookVisit?: (unit: Unit) => void;
}

export default function UnitDetailModal({ unit, onClose, onBookVisit }: UnitDetailModalProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = unit.images ?? [];
  const isConstruction = unit.status === "in_construction";

  const availableLabel =
    isConstruction
      ? null
      : !unit.available_date
      ? null
      : new Date(unit.available_date) <= new Date()
      ? "Now"
      : new Date(unit.available_date).toLocaleDateString("en-CA", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image gallery */}
        {images.length > 0 ? (
          <div className="relative h-56 bg-gray-100 overflow-hidden rounded-t-3xl">
            <img
              src={images[imageIndex].thumbnails?.large?.url ?? images[imageIndex].url}
              alt={`Unit ${unit.unit_number}`}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setImageIndex(i => Math.max(0, i - 1)); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setImageIndex(i => Math.min(images.length - 1, i + 1)); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Close button overlay on image */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : null}

        {/* Header */}
        <div className={`sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between z-10 ${images.length > 0 ? "" : "rounded-t-3xl"}`}>
          <div>
            {unit.building_name && (
              <p className="text-xs text-gray-400 mb-0.5">{unit.building_name}</p>
            )}
            <h2 className="text-xl font-bold text-brand-navy">Unit {unit.unit_number}</h2>
            {unit.building_neighbourhood && (
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {unit.building_neighbourhood}
              </div>
            )}
          </div>
          {images.length === 0 && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 ml-4 mt-1"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* In construction banner */}
          {isConstruction && (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
              <HardHat className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-700">In Construction</p>
                <p className="text-xs text-orange-600">This unit is currently under construction. Contact us to pre-register your interest.</p>
              </div>
            </div>
          )}

          {/* Price + promo */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-brand-blue">
              ${unit.price.toLocaleString()}
              <span className="text-base font-normal text-gray-400">/mo</span>
            </span>
            {unit.promo && !isConstruction && (
              <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                <Tag className="w-3 h-3" /> Promo
              </span>
            )}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <Bed className="w-5 h-5 text-brand-navy mx-auto mb-1" />
              <p className="font-semibold text-brand-navy text-sm">
                {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms} bd`}
              </p>
              <p className="text-xs text-gray-400">Bedrooms</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <Bath className="w-5 h-5 text-brand-navy mx-auto mb-1" />
              <p className="font-semibold text-brand-navy text-sm">{unit.bathrooms}</p>
              <p className="text-xs text-gray-400">Bathrooms</p>
            </div>
            {unit.sqft > 0 && (
              <div className="bg-gray-50 rounded-2xl p-3 text-center">
                <Maximize2 className="w-5 h-5 text-brand-navy mx-auto mb-1" />
                <p className="font-semibold text-brand-navy text-sm">{unit.sqft.toLocaleString()}</p>
                <p className="text-xs text-gray-400">ft²</p>
              </div>
            )}
          </div>

          {/* Availability */}
          {availableLabel && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-brand-blue shrink-0" />
              <span className="text-gray-500">Available:</span>
              <span className="font-semibold text-brand-navy">{availableLabel}</span>
            </div>
          )}

          {/* Description */}
          {unit.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{unit.description}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Details</p>
            <div className="flex flex-wrap gap-2">
              {unit.parking && unit.parking !== "none" && (
                <span className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs px-3 py-1.5 rounded-xl">
                  <Car className="w-3.5 h-3.5" />
                  {unit.parking === "included" ? "Parking Included" : "Parking Available"}
                </span>
              )}
              {unit.pets && unit.pets !== "no" && (
                <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-1.5 rounded-xl">
                  <PawPrint className="w-3.5 h-3.5" />
                  {unit.pets === "yes" ? "Pets OK" : "Cats Only"}
                </span>
              )}
              {unit.furnished && (
                <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-xl">
                  <Sofa className="w-3.5 h-3.5" /> Furnished
                </span>
              )}
              {unit.utilities_included && (
                <span className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs px-3 py-1.5 rounded-xl">
                  <Zap className="w-3.5 h-3.5" /> Utilities Included
                </span>
              )}
              {unit.floor > 0 && (
                <span className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-xl">
                  Floor {unit.floor}
                </span>
              )}
            </div>
          </div>

          {/* Appliances */}
          {unit.appliances && unit.appliances.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">In-Unit Appliances</p>
              <div className="flex flex-wrap gap-2">
                {unit.appliances.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-xl">
                    {applianceIcons[a] ?? null}
                    {APPLIANCE_LABELS[a] ?? a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Building amenities */}
          {unit.amenities && unit.amenities.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Building Amenities</p>
              <div className="flex flex-wrap gap-2">
                {unit.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-xl">
                    {amenityIcons[a] ?? null}
                    {AMENITY_LABELS[a] ?? a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pt-2">
            {isConstruction ? (
              <Button variant="primary" size="md" fullWidth onClick={() => { onClose(); onBookVisit?.(unit); }}>
                <HardHat className="w-4 h-4" /> Pre-Register Interest
              </Button>
            ) : (
              <Button variant="primary" size="md" fullWidth onClick={() => { onClose(); onBookVisit?.(unit); }}>
                Book a Visit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
