import Link from "next/link";
import { MapPin, ChevronRight, Dumbbell, Waves, Sunset, Car, ConciergeBell, Warehouse, Bike, WashingMachine, HardHat } from "lucide-react";
import { Building } from "@/lib/types";
import Badge from "./Badge";

const amenityIcons: Record<string, React.ReactNode> = {
  gym: <Dumbbell className="w-3.5 h-3.5" />,
  pool: <Waves className="w-3.5 h-3.5" />,
  rooftop: <Sunset className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  concierge: <ConciergeBell className="w-3.5 h-3.5" />,
  storage: <Warehouse className="w-3.5 h-3.5" />,
  bike_storage: <Bike className="w-3.5 h-3.5" />,
  laundry: <WashingMachine className="w-3.5 h-3.5" />,
};

interface BuildingCardProps {
  building: Building;
}

export default function BuildingCard({ building }: BuildingCardProps) {
  const displayAmenities = building.amenities.slice(0, 5);

  const formatPrice = (n: number) =>
    n ? `$${n.toLocaleString()}` : "—";

  const firstImage = building.images?.[0];

  return (
    <Link
      href={`/properties?building=${building.id}`}
      className="group block bg-white rounded-3xl overflow-hidden shadow-card card-hover"
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage.thumbnails?.large?.url ?? firstImage.url}
            alt={building.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-300 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge label={building.neighbourhood} variant="blue" />
          {building.in_construction && (
            <span className="flex items-center gap-1 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
              <HardHat className="w-3 h-3" /> In Construction
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-brand-navy text-lg leading-tight mb-1 group-hover:text-brand-blue transition-colors line-clamp-1">
          {building.name}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">{building.address}</span>
        </div>

        {/* Price range */}
        <p className="text-brand-blue font-semibold text-base mb-3">
          {formatPrice(building.min_price)} – {formatPrice(building.max_price)}
          <span className="text-gray-400 font-normal text-sm">/mo</span>
        </p>

        {/* Amenity icons */}
        {displayAmenities.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {displayAmenities.map((amenity) => (
              <div
                key={amenity}
                title={amenity.replace("_", " ")}
                className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500"
              >
                {amenityIcons[amenity] ?? (
                  <span className="text-xs">{amenity[0].toUpperCase()}</span>
                )}
              </div>
            ))}
            {building.amenities.length > 5 && (
              <span className="text-xs text-gray-400 ml-1">
                +{building.amenities.length - 5}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {building.unit_count > 0 ? `${building.unit_count} units` : "Units available"}
          </span>
          {building.in_construction ? (
            <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
              <HardHat className="w-4 h-4" /> In Construction
            </span>
          ) : (
            <span className="flex items-center gap-1 text-brand-navy text-sm font-medium group-hover:text-brand-blue transition-colors">
              View Units <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
