import React from "react";
import type { Location } from "@/types/database";

interface LocationGridCardProps {
  location: Location;
  currentUserId?: number;
  onViewDetail: (location: Location) => void;
}

const LocationGridCard: React.FC<LocationGridCardProps> = ({
  location,
  onViewDetail,
}) => {
  return (
    <div
      className="group bg-surface-container-low rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,61,155,0.1)] transition-all duration-300 cursor-pointer flex flex-col border border-outline-variant/20"
      onClick={() => onViewDetail(location)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-highest">
        <img
          src={location.coverImage || "https://via.placeholder.com/400x300"}
          alt={location.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-on-surface font-headline font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {location.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded text-xs font-bold shrink-0">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {location.rating ? location.rating.toFixed(1) : "0.0"}
            </div>
            <div className="flex items-center gap-1 bg-error/10 text-error px-1.5 py-0.5 rounded text-xs font-bold shrink-0">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              {location.favoriteCount || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-on-surface-variant text-sm font-label mb-4">
          <span className="material-symbols-outlined text-[16px]">
            location_on
          </span>
          <span className="line-clamp-1">{location.address}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationGridCard;
