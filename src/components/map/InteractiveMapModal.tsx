import { useEffect, useState } from "react";
import {
  X,
  Navigation,
  Loader2,
  MapPin,
  RouteOff,
  AlertCircle,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import { locationApi } from "@/api/locationApi";
import type { Location } from "@/types/database";
import LocationDetailModal from "../location/LocationDetailModal";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const locationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  center?: [number, number];
  targetLocation?: Location | null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

function MapController({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

function RoutingMachine({
  start,
  end,
}: {
  start: [number, number];
  end: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;
    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      routeWhileDragging: false,
      addWaypoints: false, // Không cho user kéo thả thêm điểm
      show: false, // Ẩn bảng text chỉ đường chi tiết
      lineOptions: {
        styles: [{ color: "#0066FF", weight: 5, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10,
      },
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end]);

  return null;
}

export default function InteractiveMapModal({
  isOpen,
  onClose,
  center = [16.047079, 108.20623],
  targetLocation,
}: MapModalProps) {
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | null
  >(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [nearbyLocations, setNearbyLocations] = useState<Location[]>([]);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  const [destinationPosition, setDestinationPosition] = useState<
    [number, number] | null
  >(null);
  useEffect(() => {
    if (isOpen && targetLocation) {
      setDestinationPosition([
        targetLocation.latitude,
        targetLocation.longitude,
      ]);
    }
  }, [isOpen, targetLocation]);
  const fetchNearbyLocations = async (
    lat: number,
    lng: number,
    radius: number,
  ) => {
    setLoadingNearby(true);
    try {
      const response = await locationApi.getNearby(lat, lng, radius);
      const data = (response as any).data ?? response;
      setNearbyLocations(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      setNearbyLocations([]);
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleRadiusFetch = () => {
    if (currentPosition) {
      fetchNearbyLocations(currentPosition[0], currentPosition[1], radiusKm);
    }
  };

  const handleOpenDetail = (locationItem: Location) => {
    setSelectedLocation(locationItem);
    setIsDetailModalOpen(true);
  };

  const handleStartRouting = (loc: Location) => {
    if (!currentPosition) {
      alert("Vui lòng lấy vị trí của bạn trước khi xem chỉ đường!");
      return;
    }
    setDestinationPosition([loc.latitude, loc.longitude]);
    setIsDetailModalOpen(false);
  };

  const handleGetLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition([latitude, longitude]);
        setLoadingLocation(false);
        fetchNearbyLocations(latitude, longitude, radiusKm);
      },
      () => {
        setLoadingLocation(false);
        setLocationError(
          "Không thể lấy vị trí. Vui lòng cho phép truy cập GPS.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => handleGetLocation(), 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentPosition(null);
        setLocationError(null);
        setNearbyLocations([]);
        setDestinationPosition(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mapCenter = currentPosition || center;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20 relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface z-10 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-primary">
              Bản đồ & Địa điểm lân cận
            </h3>
          </div>

          <div className="flex items-center gap-4">
            {destinationPosition && (
              <button
                onClick={() => setDestinationPosition(null)}
                className="flex items-center gap-1.5 bg-error/10 hover:bg-error/20 text-error px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              >
                <RouteOff className="w-3.5 h-3.5" />
                <span>Hủy chỉ đường</span>
              </button>
            )}

            <button
              onClick={handleGetLocation}
              disabled={loadingLocation}
              title="Định vị vị trí của tôi"
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Navigation
                className={`w-3.5 h-3.5 ${loadingLocation ? "animate-pulse" : ""}`}
              />
              <span>Vị trí của tôi</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          {loadingLocation && (
            <div className="absolute inset-0 z-[1000] bg-surface/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="bg-surface p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-primary font-medium text-sm">
                  Đang tìm vị trí của bạn...
                </p>
              </div>
            </div>
          )}
          {loadingNearby && !loadingLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-surface/90 backdrop-blur-md shadow-lg border border-outline-variant/20 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-primary animate-in slide-in-from-top-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">Đang tải địa điểm...</span>
            </div>
          )}

          {locationError && !loadingLocation && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-error text-on-error shadow-lg rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4">
              <AlertCircle className="w-4 h-4" />
              <span>{locationError}</span>
            </div>
          )}
          {currentPosition && !destinationPosition && (
            <div className="absolute bottom-6 left-6 z-[1000] bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-outline-variant/20 w-48 animate-in fade-in slide-in-from-bottom-4">
              <label className="text-xs font-bold text-primary mb-3 flex items-center justify-between">
                <span>Bán kính tìm kiếm</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {radiusKm} km
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                onMouseUp={handleRadiusFetch} // Gọi API khi nhả chuột (Desktop)
                onTouchEnd={handleRadiusFetch} // Gọi API khi thả tay (Mobile)
                className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          )}
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="w-full h-full z-0"
          >
            <MapResizer />
            <MapController position={currentPosition} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {currentPosition && destinationPosition && (
              <RoutingMachine
                start={currentPosition}
                end={destinationPosition}
              />
            )}

            {currentPosition && (
              <Circle
                center={currentPosition}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "#0066FF",
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: "4 4",
                }}
              />
            )}

            {currentPosition && (
              <Marker position={currentPosition} icon={userIcon}>
                <Popup>
                  <p className="font-bold text-sm text-error">Vị trí của bạn</p>
                </Popup>
              </Marker>
            )}

            {nearbyLocations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={locationIcon}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <h4 className="font-bold text-sm text-primary mb-1">
                      {loc.name}
                    </h4>
                    <p className="text-xs text-on-surface flex items-start gap-1 mb-2">
                      <MapPin className="w-3 h-3 text-on-surface-variant shrink-0 mt-0.5" />
                      <span>{loc.address}</span>
                    </p>
                    <button
                      onClick={() => handleOpenDetail(loc)}
                      className="w-full bg-primary text-on-primary text-[10px] py-1.5 rounded font-bold hover:bg-primary/90 transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <LocationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        location={selectedLocation}
        onPlanRoute={() => {
          if (selectedLocation) {
            handleStartRouting(selectedLocation);
          }
        }}
      />
    </div>
  );
}
