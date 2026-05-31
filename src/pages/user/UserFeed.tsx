import { useState, useEffect } from "react";
import LocationFeedCard from "@/components/location/LocationFeedCard";
import UserSidebar from "@/components/layout/UserSidebar";
import type { Location } from "@/types/database";
import { locationApi } from "@/api/locationApi";
import useAuthStore from "@/store/useAuthStore";
import useFilterStore from "@/store/useFilterStore";
import { PROVINCES } from "@/utils/constants";

export default function UserFeed() {
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const { selectedTagId } = useFilterStore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleViewDetail = (location: Location) => {
    console.log("Xem chi tiết:", location.id);
  };

  useEffect(() => {
    const fetchFeedLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await locationApi.getAll();
        const approvedLocations = (data || [])
          .filter((loc: Location) => loc.status === "APPROVED")
          .sort(
            (a: Location, b: Location) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setLocations(approvedLocations);
      } catch (err: any) {
        console.error("Lỗi khi tải bảng tin:", err);
        setError("Không thể tải bảng tin. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedLocations();

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

  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex gap-8 items-start justify-center"
      style={{
        height: "calc(100vh - 72px)",
      }}
    >
      <div className="flex-1 w-full max-w-4xl h-full overflow-y-auto pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="pt-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center min-h-[300px] gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-on-surface-variant font-body text-sm animate-pulse">
                Đang tải bảng tin...
              </p>
            </div>
          ) : error ? (
            <div className="text-left py-8">
              <p className="text-error mb-4 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium"
              >
                Thử lại
              </button>
            </div>
          ) : filteredLocations.length === 0 ? ( 
            <div className="text-left py-12">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-3 block">
                post_add
              </span>
              <p className="text-on-surface-variant font-body text-sm">
                {selectedTagId !== "All"
                  ? `Chưa có hoạt động nào tại ${currentProvinceName}. Hãy là người đầu tiên check-in!`
                  : "Chưa có hoạt động nào. Hãy là người đầu tiên check-in!"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-start w-full">
              {filteredLocations
                .filter((location) => location && location.createdAt)
                .map((location) => (
                  <div key={location.id} className="w-full mb-6">
                    <LocationFeedCard
                      location={location}
                      currentUserId={currentUserId}
                      onViewDetail={handleViewDetail}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block shrink-0 h-full w-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <UserSidebar />
      </div>
    </div>
  );
}
