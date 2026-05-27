import React, { useState, useEffect } from "react";
import { userApi } from "@/api/userApi";
import { locationApi } from "@/api/locationApi";
import { interactApi } from "@/api/interactApi";
import type { User, Location } from "@/types/database";
import LocationFeedCard from "@/components/location/LocationFeedCard";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import FriendSidebar from "@/components/layout/FriendSidebar";

const ExplorePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [feedLocations, setFeedLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchExploreFeed = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const user = await userApi.getMe();
        if (!user || !user.id) {
          setIsLoading(false);
          return;
        }

        setCurrentUser(user);

        const [followingList, allLocations] = await Promise.all([
          interactApi.getFollowing(user.id),
          locationApi.getAll(),
        ]);

        const followingIds = followingList.map(
          (item: any) => item.followedId || item.id,
        );

        const filteredFeed = allLocations.filter(
          (loc) => loc.creatorId && followingIds.includes(loc.creatorId),
        );

        const sortedFeed = filteredFeed.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setFeedLocations(sortedFeed);
      } catch (err) {
        console.error("Lỗi khi tải bảng tin khám phá:", err);
        setError("Không thể tải bảng tin. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreFeed();
  }, []);

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex gap-8 items-start justify-center"
        style={{
          height: "calc(100vh - 72px)",
        }}
      >
        <div className="flex-1 w-full max-w-4xl h-full overflow-y-auto pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="pt-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-start min-h-[300px] gap-4">
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
            ) : feedLocations.length === 0 ? (
              <div className="text-left py-12">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-3 block">
                  explore_off
                </span>
                <p className="text-on-surface-variant font-body text-sm">
                  Những người bạn theo dõi chưa đăng bài viết nào, hoặc bạn chưa
                  theo dõi ai. <br className="hidden sm:block" /> Hãy xem gợi ý
                  kết bạn bên cạnh nhé!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start w-full">
                {feedLocations.map((location) => (
                  <div key={location.id} className="w-full mb-6">
                    <LocationFeedCard
                      location={location}
                      currentUserId={currentUser?.id}
                      onViewDetail={handleViewDetail}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block shrink-0 h-full w-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <FriendSidebar />
        </div>
      </div>

      {isModalOpen && selectedLocation && (
        <LocationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
          currentUserId={currentUser?.id}
        />
      )}
    </>
  );
};

export default ExplorePage;
