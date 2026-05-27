import { useEffect, useState } from "react";
import { locationApi } from "@/api/locationApi";
import type { Location } from "@/types/database";
import LocationGridCard from "@/components/location/LocationGridCard";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import { Loader2, Map, ChevronLeft, ChevronRight } from "lucide-react";
import useFilterStore from "@/store/useFilterStore";
import { PROVINCES } from "@/utils/constants";

export default function PublicDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { selectedTagId } = useFilterStore();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [prevTagId, setPrevTagId] = useState(selectedTagId);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (selectedTagId !== prevTagId) {
    setPrevTagId(selectedTagId);
    setCurrentPage(1);
  }

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const data = await locationApi.getAll();
        const approvedLocations = (data || [])
          .filter((loc: Location) => loc.status === "APPROVED")
          .sort(
            (a: Location, b: Location) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setLocations(approvedLocations);
      } catch (error) {
        console.error("Lỗi khi tải danh sách địa điểm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();

    const handleNewLocation = (e: any) => {
      const newLoc = e.detail;
      setLocations((prev) => {
        const index = prev.findIndex((loc) => loc.id === newLoc.id);
        if (index !== -1) {
          // Update existing
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newLoc };
          return updated;
        }
        return [newLoc, ...prev];
      });
    };

    const handleStatsUpdate = (e: any) => {
      const { locationId, type, count } = e.detail;
      setLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === locationId) {
            return {
              ...loc,
              checkinCount: type === "CHECKIN" ? count : loc.checkinCount,
              favoriteCount: type === "FAVORITE" ? count : loc.favoriteCount,
              rating: type === "REVIEW" ? e.detail.rating : loc.rating,
              reviewsCount: type === "REVIEW" ? count : loc.reviewsCount,
            };
          }
          return loc;
        }),
      );
    };

    const handleAvatarUpdate = (e: any) => {
      const data = e.detail;
      setLocations((prev) =>
        prev.map((loc) => {
          if (loc.creatorId === data.userId || loc.author?.id === data.userId) {
            return {
              ...loc,
              creatorAvatarUrl: data.avatarUrl,
              author: loc.author ? { ...loc.author, avatarUrl: data.avatarUrl } : loc.author,
            };
          }
          return loc;
        })
      );
    };

    window.addEventListener("NEW_LOCATION_PUBLISHED", handleNewLocation);
    window.addEventListener("LOCATION_STATS_UPDATE", handleStatsUpdate);
    window.addEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    return () => {
      window.removeEventListener("NEW_LOCATION_PUBLISHED", handleNewLocation);
      window.removeEventListener("LOCATION_STATS_UPDATE", handleStatsUpdate);
      window.removeEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    };
  }, []);

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const currentProvinceName = PROVINCES.find(
    (p) => p.id === selectedTagId,
  )?.name;

  const filteredLocations =
    selectedTagId === "All"
      ? locations
      : locations.filter((loc) =>
          loc.tags?.some((tag: any) =>
            typeof tag === "string"
              ? tag === currentProvinceName
              : tag.id === selectedTagId,
          ),
        );

  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLocations = filteredLocations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <Map className="w-6 h-6" />
        </div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">
          Khám phá địa điểm{" "}
          {selectedTagId !== "All" && `- ${currentProvinceName}`}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-outline-variant">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
          <p className="font-body text-sm">Đang tải danh sách địa điểm...</p>
        </div>
      ) : filteredLocations.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {currentLocations.map((loc) => (
              <LocationGridCard
                key={loc.id}
                location={loc}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 flex items-center gap-1 rounded-xl bg-surface border border-outline-variant/30 hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-on-surface"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium pr-2">
                  Trước
                </span>
              </button>

              <div className="text-sm font-medium text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-lg">
                Trang {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 flex items-center gap-1 rounded-xl bg-surface border border-outline-variant/30 hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-on-surface"
              >
                <span className="hidden sm:inline text-sm font-medium pl-2">
                  Sau
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 mt-4">
          <img
            src="https://illustrations.popsy.co/amber/falling.svg"
            alt="Empty"
            className="w-48 h-48 mx-auto mb-4 opacity-80"
          />
          <h3 className="text-lg font-headline font-semibold text-on-surface">
            Chưa có địa điểm nào phù hợp
          </h3>
          <p className="text-on-surface-variant font-body text-sm mt-1">
            {selectedTagId !== "All"
              ? `Hệ thống chưa cập nhật địa điểm tại ${currentProvinceName}.`
              : "Hệ thống đang cập nhật thêm các địa điểm mới!"}
          </p>
        </div>
      )}

      <LocationDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={selectedLocation}
      />
    </div>
  );
}
