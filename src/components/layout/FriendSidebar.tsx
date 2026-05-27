import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { userApi } from "@/api/userApi";
import { interactApi } from "@/api/interactApi";
import type { User } from "@/types/database";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "react-toastify";

const FriendSidebar: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFollowIds, setLoadingFollowIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser || !currentUser.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [allUsersResponse, followingResponse] = await Promise.all([
          userApi.getAllUsers(),
          interactApi.getFollowing(currentUser.id).catch(() => []),
        ]);

        const allUsers = allUsersResponse || [];

        const followingIds = followingResponse.map(
          (f: any) => f.followedId || f.id,
        );

        const filteredUsers = allUsers.filter(
          (u) => u.id !== currentUser.id && !followingIds.includes(u.id),
        );

        const shuffled = filteredUsers.sort(() => 0.5 - Math.random());
        setSuggestedUsers(shuffled.slice(0, 8)); 
      } catch (error) {
        console.error("Lỗi khi tải gợi ý theo dõi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  const handleFollow = async (targetUserId: string | number) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để theo dõi người dùng này.");
      return;
    }

    try {
      setLoadingFollowIds((prev) => [...prev, String(targetUserId)]);

      await interactApi.toggleFollow(currentUser.id, Number(targetUserId));

      setSuggestedUsers((prev) => prev.filter((u) => u.id !== targetUserId));

      toast.success("Đã theo dõi");
    } catch (error) {
      console.error("Lỗi khi theo dõi người dùng:", error);
      toast.error("Đã xảy ra lỗi, vui lòng thử lại!");
    } finally {
      setLoadingFollowIds((prev) =>
        prev.filter((id) => id !== String(targetUserId)),
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Ngày tạo: --/--/----";
    const date = new Date(dateString);
    return `Tham gia: ${date.toLocaleDateString("vi-VN")}`;
  };

  return (
    <aside className="w-full flex flex-col gap-6 font-body">
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 shadow-lg">
        <h4 className="text-on-surface font-bold text-sm mb-5 flex items-center gap-2 font-headline">
          <span className="material-symbols-outlined text-primary text-lg">
            person_search
          </span>
          Gợi ý theo dõi
        </h4>

        <div className="space-y-5">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-outline-variant/20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-outline-variant/20 rounded w-1/2" />
                    <div className="h-2 bg-outline-variant/10 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <p className="text-[11px] text-on-surface-variant text-center py-4 italic">
              Không tìm thấy người dùng mới để gợi ý.
            </p>
          ) : (
            suggestedUsers.map((user) => {
              const displayName =
                user.fullName || user.username || "Người dùng ẩn danh";
              const avatarUrl =
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

              const isFollowingLoad = loadingFollowIds.includes(
                String(user.id),
              );

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 group w-full overflow-hidden"
                >
                  <Link to={`/profile/${user.id}`} className="shrink-0">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border border-outline-variant/20 group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${user.id}`} className="block truncate">
                      <p className="font-bold text-on-surface text-xs group-hover:text-primary transition-colors truncate">
                        {displayName}
                      </p>
                    </Link>
                    <p className="text-[10px] text-on-surface-variant truncate opacity-70">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleFollow(user.id)}
                    disabled={isFollowingLoad}
                    className="shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                  >
                    {isFollowingLoad ? (
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "Theo dõi"
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};

export default FriendSidebar;
