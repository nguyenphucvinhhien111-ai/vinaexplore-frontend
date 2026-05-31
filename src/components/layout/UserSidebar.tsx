import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { userApi } from "@/api/userApi";
import { interactApi } from "@/api/interactApi";
import { locationApi } from "@/api/locationApi";
import type { User, Location } from "@/types/database";
import { PlusCircle } from "lucide-react";
import useFilterStore from "@/store/useFilterStore";
import { PROVINCES } from "@/utils/constants";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import { CreateLocationModal } from "../auth/CreateLocationModal";

interface UserSidebarProps {
  user?: User | null;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const TrendingLocationItem: React.FC<{
  location: Location;
  realtimeFavoriteCount: number;
  onClick: () => void;
}> = ({ location, realtimeFavoriteCount, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer group block"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-container-highest overflow-hidden shrink-0">
        <img
          src={
            location.coverImage ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80"
          }
          alt={location.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 min-w-0 block">
        <p className="font-bold text-on-surface text-xs group-hover:text-primary transition-colors truncate block">
          {location.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] font-medium text-amber-500 flex items-center">
            ★ {location.rating ? location.rating.toFixed(1) : "0.0"}
          </span>
          <span className="text-[11px] text-on-surface-variant block truncate">
            • {formatNumber(realtimeFavoriteCount)} lượt thích
          </span>
        </div>
      </div>
    </div>
  );
};

const UserSidebar: React.FC<UserSidebarProps> = ({ user: initialUser }) => {
  // 🟢 LẤY STATE TỈNH THÀNH TỪ ZUSTAND
  const { selectedTagId } = useFilterStore();

  const [currentUser, setCurrentUser] = useState<User | null>(
    initialUser || null,
  );

  const [checkinsCount, setCheckinsCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingList, setFollowingList] = useState<User[]>([]);

  // 🟢 STATE CHO ĐỊA ĐIỂM, MODAL VÀ REALTIME LIKES
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [favoriteCounts, setFavoriteCounts] = useState<Record<number, number>>(
    {},
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    const fetchUserData = (userId: number) => {
      interactApi
        .getCheckinHistory()
        .then((checkins) => setCheckinsCount(checkins.length))
        .catch((err) => console.error("Lỗi tải check-in:", err));

      userApi
        .getFollowers(userId)
        .then((followers) => setFollowersCount(followers.length))
        .catch((err) => console.error("Lỗi tải followers:", err));

      userApi
        .getFollowing(userId)
        .then((following) => setFollowingList(following))
        .catch((err) => console.error("Lỗi tải following:", err));
    };

    if (currentUser && currentUser.id) {
      fetchUserData(currentUser.id);
    } else {
      if (typeof userApi.getMe === "function") {
        userApi
          .getMe()
          .then((fetchedUser) => {
            if (fetchedUser) {
              setCurrentUser(fetchedUser);
              if (fetchedUser.id) fetchUserData(fetchedUser.id);
            }
          })
          .catch((err) =>
            console.error("Lỗi tự động lấy thông tin GetMe:", err),
          );
      }
    }

    locationApi
      .getAll()
      .then((locations) => {
        setAllLocations(locations);
      })
      .catch((err) => console.error("Lỗi tải danh sách địa điểm:", err));
  }, [currentUser?.id]);

  // 🟢 LỌC DANH SÁCH THEO TỈNH THÀNH
  const currentProvinceName = PROVINCES.find(
    (p) => p.id === selectedTagId,
  )?.name;

  const filteredForTrending = useMemo(() => {
    return selectedTagId === "All"
      ? allLocations
      : allLocations.filter((loc) =>
          loc.tags?.some((tag: any) =>
            typeof tag === "string"
              ? tag === currentProvinceName
              : tag.id === selectedTagId,
          ),
        );
  }, [allLocations, selectedTagId, currentProvinceName]);

  useEffect(() => {
    const fetchRealtimeFavorites = async () => {
      const newCounts: Record<number, number> = { ...favoriteCounts };
      let hasChanges = false;

      const promises = filteredForTrending.map(async (loc) => {
        if (loc.id && newCounts[loc.id] === undefined) {
          try {
            const count = await interactApi.getFavoriteCountByLocation(loc.id);
            newCounts[loc.id] = count;
            hasChanges = true;
          } catch (error) {
            newCounts[loc.id] = (loc as any).favoriteCount || 0; 
          }
        }
      });

      await Promise.all(promises);
      if (hasChanges) {
        setFavoriteCounts(newCounts);
      }
    };

    if (filteredForTrending.length > 0) {
      fetchRealtimeFavorites();
    }
  }, [filteredForTrending]); 

  const trendingLocations = [...filteredForTrending]
    .sort((a, b) => {
      const getScore = (loc: Location) => {
        // Lấy số liệu
        const checkins = loc.checkinCount || 0;
        const favorites =
          favoriteCounts[loc.id] ?? ((loc as any).favoriteCount || 0);
        const reviews = (loc as any).reviewsCount || 0;
        const rating = loc.rating || 0;

        // Tính điểm cơ bản
        const baseScore =
          checkins * 5 + favorites * 3 + reviews * 2 + rating * 10;

        let freshnessBonus = 0;
        if (loc.createdAt) {
          const createdAtDate = new Date(loc.createdAt).getTime();
          const daysOld = (Date.now() - createdAtDate) / (1000 * 60 * 60 * 24);
          freshnessBonus = Math.max(30 - daysOld, 0);
        }

        return baseScore + freshnessBonus;
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);

      return scoreB - scoreA; 
    })
    .slice(0, 3); 

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const displayName =
    currentUser?.fullName || currentUser?.username || "Người dùng ẩn danh";
  const displayRole =
    currentUser?.role === "ROLE_ADMIN"
      ? "🛡️ Quản trị viên"
      : "✨ Thành viên VinaExplore";
  const avatarUrl =
    currentUser?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  return (
    <>
      <aside className="w-full flex flex-col gap-6 sticky top-24 h-fit font-body">
        <div className="flex flex-col p-6 gap-2 border-l border-outline-variant/10 bg-surface-container-low rounded-2xl shadow-xl block">
          <Link
            to="/profile"
            className="flex flex-col items-center text-center mb-6 group cursor-pointer block"
          >
            <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-tertiary shadow-md">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover border-4 border-surface"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-6 h-6 bg-tertiary rounded-full border-4 border-surface"></span>
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
              {displayName}
            </h2>
            <p className="text-primary text-base md:text-lg mt-1 font-semibold">
              {displayRole}
            </p>
          </Link>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Tạo địa điểm</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 block">
          <div className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/10 text-center block">
            <span className="text-2xl font-black text-primary block">
              {formatNumber(checkinsCount)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mt-1 block">
              Check-ins
            </span>
          </div>

          <div className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/10 text-center block">
            <span className="text-2xl font-black text-tertiary block">
              {formatNumber(followersCount)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mt-1 block">
              Followers
            </span>
          </div>

          <div className="col-span-2 bg-surface-container-highest p-4 rounded-2xl border border-outline-variant/10 flex items-center justify-between block">
            <div className="flex -space-x-3">
              {followingList.slice(0, 3).map((followedUser) => {
                const followName =
                  followedUser.fullName || followedUser.username || "User";
                return (
                  <img
                    key={followedUser.id}
                    src={
                      followedUser.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(followName)}&background=random`
                    }
                    alt={followName}
                    className="w-9 h-9 rounded-full border-2 border-surface object-cover"
                    title={followName}
                  />
                );
              })}
              {followingList.length > 3 && (
                <div className="w-9 h-9 rounded-full border-2 border-surface bg-surface-bright flex items-center justify-center text-[10px] font-bold text-on-surface">
                  +{followingList.length - 3}
                </div>
              )}
              {followingList.length === 0 && (
                <span className="text-xs text-on-surface-variant pl-2 font-normal">
                  Chưa theo dõi ai
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
              Following
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 block">
          <h4 className="text-on-surface font-bold text-sm mb-4 flex items-center gap-2 font-headline block">
            <span className="material-symbols-outlined text-tertiary text-lg">
              trending_up
            </span>
            Trending
            {selectedTagId !== "All" && (
              <span className="text-xs font-normal text-on-surface-variant ml-auto">
                {currentProvinceName}
              </span>
            )}
          </h4>

          <div className="space-y-4 block">
            {allLocations.length === 0 ? (
              <p className="text-xs text-on-surface-variant">
                Đang tải dữ liệu...
              </p>
            ) : trendingLocations.length === 0 ? (
              <p className="text-xs text-on-surface-variant">
                Chưa có địa điểm nổi bật tại đây.
              </p>
            ) : (
              trendingLocations.map((location) => (
                <TrendingLocationItem
                  key={location.id}
                  location={location}
                  // 🟢 TRUYỀN SỐ FAVORITE REALTIME XUỐNG ĐỂ HIỂN THỊ
                  realtimeFavoriteCount={
                    favoriteCounts[location.id!] ??
                    ((location as any).favoriteCount ||
                      location.checkinCount ||
                      0)
                  }
                  onClick={() => handleLocationClick(location)}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      <LocationDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={selectedLocation}
      />
      <CreateLocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          locationApi.getAll().then(setAllLocations);
        }}
      />
    </>
  );
};

export default UserSidebar;
