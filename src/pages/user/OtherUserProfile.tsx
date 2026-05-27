import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userApi } from "@/api/userApi";
import { interactApi } from "@/api/interactApi";
import { locationApi } from "@/api/locationApi";
import type { User, Location } from "@/types/database";
import LocationGridCard from "@/components/location/LocationGridCard";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import FollowListModal from "@/components/user/FollowListModal";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "react-toastify";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const OtherUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentLoggedInUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"posts">("posts");

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [createdLocations, setCreatedLocations] = useState<Location[]>([]);

  const [checkinsCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Follow Modal states
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState("");
  const [followModalUsers, setFollowModalUsers] = useState<User[]>([]);

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    const handleStatsUpdate = (e: any) => {
      const data = e.detail;

      if (data?.action === "REFRESH_FOLLOWERS" && data?.userId === Number(userId)) {
        Promise.all([
          userApi.getFollowers(Number(userId)).catch(() => []),
          userApi.getFollowing(Number(userId)).catch(() => []),
        ]).then(([followers, following]) => {
          setFollowersCount(followers.length);
          setFollowingCount(following.length);
        });
      }
    };

    const handleAvatarUpdate = (e: any) => {
      const data = e.detail;
      if (Number(userId) === data.userId) {
        setTargetUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
      }
    };

    window.addEventListener("REFRESH_USER_STATS", handleStatsUpdate);
    window.addEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    return () => {
      window.removeEventListener("REFRESH_USER_STATS", handleStatsUpdate);
      window.removeEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    };
  }, [userId]);

  useEffect(() => {
    if (currentLoggedInUser?.id && currentLoggedInUser.id === Number(userId)) {
      navigate("/profile");
      return;
    }

    const fetchProfileData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);

        const user = await userApi.getUserById(Number(userId));

        if (user) {
          setTargetUser(user);

          const [followers, following, myLocations] = await Promise.all([
            userApi.getFollowers(user.id).catch(() => []),
            userApi.getFollowing(user.id).catch(() => []),
            locationApi.getByUserId(user.id).catch(() => []),
          ]);

          setFollowersCount(followers.length);
          setFollowingCount(following.length);

          const approvedLocations = (myLocations || []).filter(
            (loc: Location) => loc.status === "APPROVED",
          );
          setCreatedLocations(approvedLocations);

          if (currentLoggedInUser?.id) {
            const hasFollowed = followers.some(
              (f: any) => f.id === currentLoggedInUser.id,
            );
            setIsFollowing(hasFollowed);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang cá nhân người dùng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, currentLoggedInUser?.id, navigate]);

  const handleFollowToggle = async () => {
    if (!currentLoggedInUser) {
      toast.error("Vui lòng đăng nhập để theo dõi người dùng này.");
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await interactApi.toggleFollow(currentLoggedInUser.id, Number(userId));
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success("Đã bỏ theo dõi");
      } else {
        await interactApi.toggleFollow(currentLoggedInUser.id, Number(userId));
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success("Đã theo dõi");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi, vui lòng thử lại!");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleFollowersClick = async () => {
    if (!userId) return;
    try {
      const followers = await interactApi.getFollowers(Number(userId));
      setFollowModalUsers(followers);
      setFollowModalTitle("Người theo dõi");
      setIsFollowModalOpen(true);
    } catch (error) {
      console.error("Lỗi lấy danh sách người theo dõi", error);
    }
  };

  const handleFollowingClick = async () => {
    if (!userId) return;
    try {
      const following = await interactApi.getFollowing(Number(userId));
      setFollowModalUsers(following);
      setFollowModalTitle("Đang theo dõi");
      setIsFollowModalOpen(true);
    } catch (error) {
      console.error("Lỗi lấy danh sách đang theo dõi", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-on-surface-variant">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-6xl opacity-50">
            person_off
          </span>

          <p>Người dùng không tồn tại hoặc đã bị xóa.</p>

          <button
            onClick={() => navigate(-1)}
            className="text-primary font-semibold hover:underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    targetUser.fullName || targetUser.username || "Người dùng ẩn danh";
  const avatarUrl =
    targetUser.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  return (
    <>
      <main className="min-h-screen bg-background font-body-md text-on-surface pb-20 md:pb-0">
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <div className="flex flex-col items-center md:flex-row md:items-center gap-6 md:gap-10 w-full">
            {/* Avatar */}
            <div className="relative shrink-0 flex justify-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-surface-variant">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="font-headline-md text-3xl font-bold text-on-surface">
                  {displayName}
                </h3>

                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`px-6 py-2 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 max-w-[200px] mx-auto md:mx-0 ${
                    isFollowing
                      ? "bg-surface-variant text-on-surface-variant hover:bg-outline-variant"
                      : "bg-primary text-white hover:bg-primary/90 shadow-md"
                  }`}
                >
                  {isFollowLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">
                        {isFollowing ? "person_remove" : "person_add"}
                      </span>
                      {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 md:flex md:flex-wrap md:justify-start md:gap-10 mb-4 w-full">
                <div className="text-center md:text-left">
                  <span className="block font-bold text-xl md:text-2xl text-primary">
                    {formatNumber(checkinsCount)}
                  </span>
                  <span className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold mt-1 block">
                    Check-ins
                  </span>
                </div>
                <div className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity" onClick={handleFollowersClick}>
                  <span className="block font-bold text-xl md:text-2xl text-tertiary">
                    {formatNumber(followersCount)}
                  </span>
                  <span className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold mt-1 block">
                    Followers
                  </span>
                </div>
                <div className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity" onClick={handleFollowingClick}>
                  <span className="block font-bold text-xl md:text-2xl text-on-surface">
                    {formatNumber(followingCount)}
                  </span>
                  <span className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold mt-1 block">
                    Following
                  </span>
                </div>
              </div>

              <div className="w-full max-w-2xl mx-auto md:mx-0 mt-4">
                <p className="font-bold text-on-surface mb-1">
                  {targetUser.role === "ROLE_ADMIN"
                    ? "🛡️ Quản trị viên"
                    : "✨ Thành viên VinaExplore"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <nav className="border-t border-outline-variant sticky top-16 md:top-0 bg-surface/80 backdrop-blur-md z-30 w-full">
          <div className="w-full flex items-stretch max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 border-t-2 transition-all ${
                activeTab === "posts"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === "posts" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                grid_view
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold hidden md:block">
                Bài viết
              </span>
            </button>
          </div>
        </nav>

        <section className="w-full px-4 md:px-6 lg:px-8 py-6">
          {activeTab === "posts" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {createdLocations.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant text-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
                    imagesmode
                  </span>
                  <p>Người dùng này chưa tạo địa điểm nào.</p>
                </div>
              ) : (
                createdLocations.map((location, index) => (
                  <LocationGridCard
                    key={location.id || index}
                    location={location}
                    currentUserId={currentLoggedInUser?.id}
                    onViewDetail={handleViewDetail}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {isModalOpen && selectedLocation && (
        <LocationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
          currentUserId={currentLoggedInUser?.id}
        />
      )}

      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        title={followModalTitle}
        users={followModalUsers}
      />
    </>
  );
};

export default OtherUserProfile;
