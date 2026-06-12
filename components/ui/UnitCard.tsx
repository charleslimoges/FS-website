import { Bed, Bath, Maximize2, Car, PawPrint, Sofa, Zap, Tag, HardHat, Wrench, Sparkles } from "lucide-react";
import { Unit } from "@/lib/types";

interface UnitCardProps {
  unit: Unit;
  onBookVisit?: (unit: Unit) => void;
  onViewDetails?: (unit: Unit) => void;
}

/** A labelled group of "included" chips (utilities / appliances / amenities). */
function IncludedGroup({
  icon, items, className,
}: {
  icon: React.ReactNode;
  items: string[];
  className: string;
}) {
  if (!items.length) return null;
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-gray-300 mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <span key={it} className={`text-[11px] px-1.5 py-0.5 rounded-md border ${className}`}>
            {it.trim()}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function UnitCard({ unit, onViewDetails }: UnitCardProps) {
  const isConstruction = unit.status === "in_construction";

  const parkingLabel =
    unit.parking === "included" ? "Parking Incl." : unit.parking === "available" ? "Parking Avail." : null;
  const petsLabel =
    unit.pets === "yes" ? "Pets OK" : unit.pets === "cats_only" ? "Cats Only" : null;

  const firstImage = unit.images?.[0];
  const address = unit.building_name || unit.building_neighbourhood || "";

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden shadow-card card-hover flex flex-col cursor-pointer"
      onClick={() => onViewDetails?.(unit)}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100 overflow-hidden shrink-0">
        {firstImage ? (
          <img
            src={firstImage.thumbnails?.large?.url ?? firstImage.url}
            alt={address || "Unit"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-gray-300" />
          </div>
        )}
        {unit.promo && !isConstruction && (
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
              <Tag className="w-3 h-3" /> Promo
            </span>
          </div>
        )}
        {isConstruction && (
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
              <HardHat className="w-3 h-3" /> In Construction
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Price — the headline */}
        <p className="text-2xl font-bold text-brand-navy leading-none mb-2">
          ${unit.price.toLocaleString()}
          <span className="text-gray-400 font-normal text-sm"> /mo</span>
        </p>

        {/* Address — light, secondary */}
        {address && (
          <p className="text-sm text-gray-500 leading-snug line-clamp-2 mb-3">{address}</p>
        )}

        {/* Beds / baths / sqft */}
        <div className="flex items-center gap-4 text-gray-500 text-sm mb-3">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms} bd`}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {unit.bathrooms} ba
          </span>
          {unit.sqft > 0 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              {unit.sqft.toLocaleString()} ft²
            </span>
          )}
        </div>

        {/* Quick badges */}
        {(parkingLabel || petsLabel || unit.furnished) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {parkingLabel && (
              <span className="flex items-center gap-1 bg-sky-50 text-sky-700 text-xs px-2.5 py-1 rounded-lg border border-sky-100">
                <Car className="w-3 h-3" /> {parkingLabel}
              </span>
            )}
            {petsLabel && (
              <span className="flex items-center gap-1 bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-lg border border-rose-100">
                <PawPrint className="w-3 h-3" /> {petsLabel}
              </span>
            )}
            {unit.furnished && (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-lg border border-amber-100">
                <Sofa className="w-3 h-3" /> Furnished
              </span>
            )}
          </div>
        )}

        {/* Detailed included: utilities · appliances · amenities */}
        {(unit.utilities.length > 0 || unit.appliances.length > 0 || unit.amenities.length > 0) && (
          <div className="space-y-1.5 mb-4 pt-3 border-t border-gray-50">
            <IncludedGroup
              icon={<Zap className="w-3.5 h-3.5" />}
              items={unit.utilities}
              className="bg-violet-50 text-violet-700 border-violet-100"
            />
            <IncludedGroup
              icon={<Wrench className="w-3.5 h-3.5" />}
              items={unit.appliances}
              className="bg-teal-50 text-teal-700 border-teal-100"
            />
            <IncludedGroup
              icon={<Sparkles className="w-3.5 h-3.5" />}
              items={unit.amenities}
              className="bg-indigo-50 text-indigo-700 border-indigo-100"
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto">
          {isConstruction ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium">
              <HardHat className="w-4 h-4" /> In Construction · Contact Us
            </div>
          ) : unit.available_date ? (
            <p className="text-xs text-gray-400">
              Available:{" "}
              <span className="text-gray-600 font-medium">
                {new Date(unit.available_date) <= new Date()
                  ? "Now"
                  : new Date(unit.available_date).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
