import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Search, Navigation } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LocationEditRequest } from "@/types/api";
import type { Location } from "@/types/database";
import { locationApi } from "@/api/locationApi";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "react-toastify";
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  onSuccess: () => void;
  isAdmin?: boolean;
}

function MapClickHandler({
  setPosition,
}: {
  setPosition: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  location,
  onSuccess,
  isAdmin = false,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  
  const [name, setName] = useState(location.name || "");
  const [description, setDescription] = useState(location.description || "");
  const [address, setAddress] = useState(location.address || "");
  const [latitude, setLatitude] = useState<number | string>(location.latitude || "");
  const [longitude, setLongitude] = useState<number | string>(location.longitude || "");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>([
    Number(location.latitude), 
    Number(location.longitude)
  ]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(location.coverImage || null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(location.name || "");
      setDescription(location.description || "");
      setAddress(location.address || "");
      setLatitude(location.latitude || "");
      setLongitude(location.longitude || "");
      setMapCenter([Number(location.latitude), Number(location.longitude)]);
      setImagePreview(location.coverImage || null);
    }
  }, [isOpen, location]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          setMapCenter([lat, lng]);
          setIsLocating(false);
        },
        () => {
          toast.error("Không thể lấy tọa độ. Vui lòng cấp quyền truy cập vị trí.");
          setIsLocating(false);
        },
      );
    } else {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
    }
  };

  const handleSearchAddressOnMap = async () => {
    if (!address) {
      toast.error("Vui lòng nhập địa chỉ trước khi tìm kiếm!");
      return;
    }
    setIsSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address + ", Vietnam",
        )}`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter([lat, lng]);
      } else {
        toast.error("Không tìm thấy địa chỉ này trên bản đồ. Vui lòng nhập chi tiết hơn hoặc chọn tay.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tìm kiếm địa chỉ.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !latitude || !longitude) {
      setError("Vui lòng nhập đầy đủ Tên, Địa chỉ và Tọa độ!");
      return;
    }

    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        name: name,
        description: description,
        address: address,
        latitude: Number(latitude),
        longitude: Number(longitude),
      };

      if (isAdmin) {
        await locationApi.update(location.id, payload, imageFile || undefined);
        toast.success("Cập nhật địa điểm thành công!");
      } else {
        const editPayload: LocationEditRequest = {
          newName: name !== location.name ? name : undefined,
          newDescription:
            description !== location.description ? description : undefined,
          newAddress: address !== location.address ? address : undefined,
          newLatitude:
            Number(latitude) !== location.latitude ? Number(latitude) : undefined,
          newLongitude:
            Number(longitude) !== location.longitude
              ? Number(longitude)
              : undefined,
        };
        await locationApi.submitEdit(
          currentUser.id,
          location.id,
          editPayload,
          imageFile || undefined,
        );
        toast.success(
          "Gửi đề xuất chỉnh sửa thành công! Vui lòng chờ phê duyệt.",
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi sửa địa điểm.");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      <div className="bg-background w-full max-w-4xl rounded-[32px] border border-outline-variant/20 shadow-2xl flex flex-col max-h-[95vh] relative z-10 overflow-hidden antialiased">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-6">
          <h2 className="text-2xl font-bold text-on-background">Sửa thông tin địa điểm</h2>
          <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-highest transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-on-surface grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5 flex flex-col">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Tên địa điểm <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/30 px-4 py-3 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Mô tả giới thiệu</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/30 p-4 focus:border-primary focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 mt-4">Ảnh bìa</label>
              <div className="relative border-2 border-dashed border-outline-variant/50 hover:border-primary/50 rounded-2xl p-4 text-center transition bg-surface-container/50 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-2 relative z-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-auto object-cover rounded-xl border border-outline-variant/30"
                    />
                    <span className="text-xs text-primary font-medium underline">Đổi ảnh khác</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
                    <Upload size={24} />
                    <p className="text-xs font-bold mt-1">Kéo thả hoặc nhấn để tải ảnh</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <div>
              <label className="block text-sm font-bold mb-2">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1 rounded-xl bg-surface-container border border-outline-variant/30 px-4 py-3 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSearchAddressOnMap}
                  disabled={isSearchingLocation}
                  className="px-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center disabled:opacity-50"
                >
                  <Search size={18} className={isSearchingLocation ? "animate-pulse" : ""} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold">Chỉ định tọa độ</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <Navigation size={14} className={isLocating ? "animate-spin" : ""} />
                {isLocating ? "Đang lấy..." : "Lấy vị trí của tôi"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Vĩ độ (Lat)"
                className="w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Kinh độ (Lng)"
                className="w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex-1 min-h-[300px] w-full rounded-2xl overflow-hidden border border-outline-variant/30 relative z-0 mt-2 bg-surface-container-highest">
              <MapContainer center={mapCenter || [13.7782, 109.2275]} zoom={13} className="w-full h-full">
                <MapController center={mapCenter} />
                <MapClickHandler setPosition={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {latitude && longitude && <Marker position={[Number(latitude), Number(longitude)]} icon={redIcon} />}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant/20 bg-background p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-full border border-outline-variant/50 font-bold hover:bg-surface-container-highest">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold disabled:opacity-50">
            {isLoading ? "Đang gửi..." : "Gửi Yêu Cầu Sửa"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
