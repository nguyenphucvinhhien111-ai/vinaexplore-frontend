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

import type { LocationRequest } from "@/types/api";
import { locationApi } from "@/api/locationApi";
import { PROVINCES } from "@/utils/constants";

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

interface Tag {
  id: number;
  name: string;
}

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | string>("");
  const [longitude, setLongitude] = useState<number | string>("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | "">("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false); // State cho hiệu ứng xoay
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTags = async () => {
        try {
          const response: any = await locationApi.getTags();
          setAvailableTags(response || []);
        } catch (err) {
          console.error("Lỗi load tags:", err);
        }
      };
      fetchTags();

      setMapCenter([13.7782, 109.2275]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const provinceTags = availableTags.filter((tag) =>
    PROVINCES.some(
      (p) =>
        p.name === tag.name ||
        tag.name.includes("Tỉnh") ||
        tag.name.includes("Thành phố"),
    ),
  );
  const otherTags = availableTags.filter((tag) => !provinceTags.includes(tag));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
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
          alert("Không thể lấy tọa độ. Vui lòng cấp quyền truy cập vị trí.");
          setIsLocating(false); 
        },
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
    }
  };

  const handleSearchAddressOnMap = async () => {
    if (!address) {
      alert("Vui lòng nhập địa chỉ trước khi tìm kiếm!");
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
        alert(
          "Không tìm thấy địa chỉ này trên bản đồ. Vui lòng nhập chi tiết hơn hoặc chọn tay.",
        );
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tìm kiếm địa chỉ.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !latitude || !longitude || !selectedProvinceId) {
      setError("Vui lòng nhập đầy đủ Tên, Địa chỉ, Tỉnh thành và Tọa độ!");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const finalTagIds = [...selectedTagIds, Number(selectedProvinceId)];

      const payload: LocationRequest = {
        name,
        description,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        tagIds: finalTagIds,
      };

      await locationApi.create(payload, imageFile || undefined);

      alert("Đăng ký địa điểm thành công! Vui lòng chờ Admin phê duyệt.");
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi tạo địa điểm.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setAddress("");
    setLatitude("");
    setLongitude("");
    setSelectedTagIds([]);
    setSelectedProvinceId("");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setIsLocating(false);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleModalClose}
      ></div>

      <div className="bg-background dark:bg-[#1a1c1e] w-full max-w-4xl rounded-[32px] border border-outline-variant/20 dark:border-gray-800 shadow-2xl flex flex-col max-h-[95vh] relative z-10 overflow-hidden antialiased">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-gray-800 p-6">
          <h2 className="text-2xl font-bold text-on-background font-headline tracking-tight">
            Đề xuất Địa điểm mới
          </h2>
          <button
            onClick={handleModalClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-gray-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-on-surface grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5 flex flex-col">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">
                Tên địa điểm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Bãi biển Kỳ Co..."
                className="w-full rounded-xl bg-surface-container dark:bg-[#2a2d31] border border-outline-variant/30 px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-on-surface dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Tỉnh / Thành phố <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedProvinceId}
                onChange={(e) => setSelectedProvinceId(Number(e.target.value))}
                className="w-full rounded-xl bg-surface-container dark:bg-[#2a2d31] border border-outline-variant/30 px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-on-surface dark:text-white appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  -- Chọn Tỉnh / Thành phố --
                </option>
                {provinceTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Mô tả giới thiệu
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chia sẻ vài điều thú vị..."
                className="w-full rounded-xl bg-surface-container dark:bg-[#2a2d31] border border-outline-variant/30 p-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-on-surface dark:text-white resize-none"
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <label className="block text-sm font-bold mb-3">
                Đặc điểm (Tags)
              </label>
              <div className="max-h-36 overflow-y-auto custom-scrollbar pr-2 pb-1 border border-outline-variant/20 rounded-xl p-3 bg-surface-container/30 dark:bg-[#2a2d31]/30">
                <div className="flex flex-wrap gap-2">
                  {otherTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-primary border-primary text-on-primary shadow-md"
                            : "bg-surface dark:bg-[#1a1c1e] border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                  {otherTags.length === 0 && (
                    <span className="text-xs text-on-surface-variant italic">
                      Không có tags phụ nào.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 mt-4">
                Ảnh bìa
              </label>
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
                    <span className="text-xs text-primary font-medium underline">
                      Đổi ảnh khác
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
                    <Upload size={24} />
                    <p className="text-xs font-bold mt-1">
                      Kéo thả hoặc nhấn để tải ảnh
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <div>
              <label className="block text-sm font-bold mb-2">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ..."
                  className="flex-1 rounded-xl bg-surface-container dark:bg-[#2a2d31] border border-outline-variant/30 px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 text-on-surface dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleSearchAddressOnMap}
                  disabled={isSearchingLocation}
                  className="px-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                  title="Tìm trên bản đồ"
                >
                  <Search
                    size={18}
                    className={isSearchingLocation ? "animate-pulse" : ""}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold">Chỉ định tọa độ</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80 font-bold bg-primary/10 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                <Navigation
                  size={14}
                  className={isLocating ? "animate-spin" : ""}
                />
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
                className="w-full rounded-lg bg-surface-container dark:bg-[#2a2d31] border border-outline-variant/30 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Kinh độ (Lng)"
                className="w-full rounded-lg bg-surface-container dark:bg-[#2a2d31] border border-outline-variant/30 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-on-surface-variant italic">
              * Gợi ý: Bạn có thể click trực tiếp lên bản đồ bên dưới để ghim
              tọa độ.
            </p>

            {/* BẢN ĐỒ MINI */}
            <div className="flex-1 min-h-[300px] w-full rounded-2xl overflow-hidden border border-outline-variant/30 relative z-0 mt-2 shadow-inner bg-surface-container-highest">
              <MapContainer
                center={mapCenter || [13.7782, 109.2275]}
                zoom={13}
                className="w-full h-full"
              >
                <MapController center={mapCenter} />
                <MapClickHandler
                  setPosition={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {latitude && longitude && (
                  <Marker
                    position={[Number(latitude), Number(longitude)]}
                    icon={redIcon}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-outline-variant/20 dark:border-gray-800 bg-background dark:bg-[#1a1c1e] p-6 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isLoading}
            className="px-6 py-3 rounded-full bg-transparent border border-outline-variant/50 text-on-surface font-bold hover:bg-surface-container-highest dark:hover:bg-gray-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? "Đang gửi..." : "Gửi Đề Xuất"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
