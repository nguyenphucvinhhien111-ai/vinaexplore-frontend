import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { userApi } from "@/api/userApi";
import { interactApi } from "@/api/interactApi";
import { locationApi } from "@/api/locationApi";
import type { User, Location } from "@/types/database";
import LocationGridCard from "@/components/location/LocationGridCard";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import FollowListModal from "@/components/user/FollowListModal";
import { authApi } from "@/api/authApi";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"posts" | "unapproved" | "saved">(
    "posts",
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [createdLocations, setCreatedLocations] = useState<Location[]>([]); 
  const [unapprovedLocations, setUnapprovedLocations] = useState<Location[]>([]); 
  const [savedLocations, setSavedLocations] = useState<Location[]>([]); 

  const [checkinsCount, setCheckinsCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Follow Modal states
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState("");
  const [followModalUsers, setFollowModalUsers] = useState<User[]>([]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Cropping states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const passwordError = newPassword && confirmPassword && newPassword !== confirmPassword ? "Mật khẩu xác nhận không khớp!" : "";
  const lengthError = newPassword && newPassword.length < 6 ? "Mật khẩu mới phải có ít nhất 6 ký tự!" : "";
  const isPasswordValid = oldPassword && newPassword.length >= 6 && newPassword === confirmPassword;

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleStatsUpdate = (e: any) => {
      const data = e.detail;
      // Nếu là sự kiện refresh stats của chính mình
      if (data?.action === "REFRESH_FOLLOWERS" && data?.userId === currentUser?.id) {
        userApi.getFollowers(currentUser.id).then((followers) => {
          setFollowersCount(followers.length);
        }).catch(console.error);
      }
    };

    const handleAvatarUpdate = (e: any) => {
      const data = e.detail;
      if (currentUser?.id === data.userId) {
        setCurrentUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
      }
    };

    window.addEventListener("REFRESH_USER_STATS", handleStatsUpdate);
    window.addEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    return () => {
      window.removeEventListener("REFRESH_USER_STATS", handleStatsUpdate);
      window.removeEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const user = await userApi.getMe();
        if (user) {
          setCurrentUser(user);

          if (user.id) {
            const [checkinHistory, followers, following, favorites] =
              await Promise.all([
                interactApi.getCheckinHistory().catch(() => []),
                userApi.getFollowers(user.id).catch(() => []),
                userApi.getFollowing(user.id).catch(() => []),
                interactApi.getFavorites(user.id).catch(() => []), // Lấy danh sách Đã lưu
              ]);

            setCheckinsCount(checkinHistory.length);
            setFollowersCount(followers.length);
            setFollowingCount(following.length);
            const approvedFavorites = favorites.filter(
              (loc: Location) => loc.status === "APPROVED",
            );
            setSavedLocations(approvedFavorites);

            try {
              const myLocations = await locationApi.getByUserId(user.id);
              const approvedMyLocations = (myLocations || []).filter(
                (loc: Location) => loc.status === "APPROVED",
              );
              const pendingOrRejectedLocations = (myLocations || []).filter(
                (loc: Location) => loc.status !== "APPROVED",
              );
              setCreatedLocations(approvedMyLocations);
              setUnapprovedLocations(pendingOrRejectedLocations);
            } catch (err) {
              console.error("Lỗi lấy danh sách bài viết:", err);
              setCreatedLocations([]);
              setUnapprovedLocations([]);
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang cá nhân:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSaveName = async () => {
    const currentDisplayName =
      currentUser?.fullName || currentUser?.username || "";

    if (!editNameValue.trim() || editNameValue === currentDisplayName) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsUpdatingName(true);
      await authApi.updateFullName({ fullName: editNameValue });
      setCurrentUser((prev) =>
        prev ? { ...prev, fullName: editNameValue } : prev,
      );
      setIsEditingName(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật tên:", error);
      alert("Có lỗi xảy ra khi cập nhật tên!");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result?.toString() || null);
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      setIsUploadingAvatar(true);
      setIsCropModalOpen(false); 
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      if (!croppedImage) throw new Error("Không thể xử lý ảnh");

      const updatedUser = await userApi.updateAvatar(croppedImage);
      setCurrentUser(updatedUser as any); 
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error: any) {
      console.error("Lỗi khi cập nhật ảnh đại diện:", error);
      toast.error(error.response?.data || "Cập nhật ảnh đại diện thất bại!");
    } finally {
      setIsUploadingAvatar(false);
      setImageToCrop(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    
    try {
      setIsChangingPassword(true);
      await authApi.changePassword({ oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Lỗi đổi mật khẩu:", error);
      toast.error(error.response?.data || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleFollowersClick = async () => {
    if (!currentUser) return;
    try {
      const followers = await interactApi.getFollowers(currentUser.id);
      setFollowModalUsers(followers);
      setFollowModalTitle("Người theo dõi");
      setIsFollowModalOpen(true);
    } catch (error) {
      console.error("Lỗi lấy danh sách người theo dõi", error);
    }
  };

  const handleFollowingClick = async () => {
    if (!currentUser) return;
    try {
      const following = await interactApi.getFollowing(currentUser.id);
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

  if (!currentUser) {
    return (
      <div className="md:ml-80 min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        <p>Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.</p>
      </div>
    );
  }

  const displayName =
    currentUser.fullName || currentUser.username || "Người dùng ẩn danh";
  const avatarUrl =
    currentUser.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  return (
    <>
      <main className="min-h-screen bg-background font-body-md text-on-surface pb-20 md:pb-0">
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <div className="flex flex-col items-center md:flex-row md:items-center gap-6 md:gap-10 w-full">
            {/* Avatar */}
              <div className="relative group shrink-0 flex justify-center">
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-surface-variant relative">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="material-symbols-outlined animate-spin text-white text-3xl">
                        progress_activity
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 md:bottom-1 md:right-1 bg-primary text-white p-1.5 md:p-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]">
                    add_a_photo
                  </span>
                </button>
              </div>

            {/* Stats */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2 justify-center md:justify-start w-full">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="font-headline-md text-xl md:text-2xl font-bold text-on-surface bg-surface-container px-3 py-1 rounded-md border border-outline focus:outline-primary w-full max-w-[250px]"
                      autoFocus
                      disabled={isUpdatingName}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isUpdatingName}
                      className="p-2 w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Lưu"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isUpdatingName ? "hourglass_empty" : "check"}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      disabled={isUpdatingName}
                      className="p-2 w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant hover:bg-outline-variant flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Hủy"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        close
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center md:justify-start w-full">
                    <h3 className="font-headline-md text-3xl md:text-3xl font-bold text-on-surface text-center md:text-left">
                      {displayName}
                    </h3>
                    <button
                      onClick={() => {
                        setEditNameValue(displayName); 
                        setIsEditingName(true); 
                      }}
                      className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors flex items-center justify-center"
                      title="Chỉnh sửa tên"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        edit
                      </span>
                    </button>
                  </div>
                )}
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

              <div className="w-full max-w-2xl mx-auto md:mx-0 mt-4 flex items-center justify-center md:justify-start gap-4">
                <p className="font-bold text-on-surface mb-1">
                  {currentUser.role === "ROLE_ADMIN"
                    ? "🛡️ Quản trị viên"
                    : "✨ Thành viên VinaExplore"}
                </p>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-3 py-1 text-sm bg-surface-variant text-on-surface-variant rounded-md hover:bg-outline-variant transition-colors flex items-center gap-1 mb-1"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        </section>

        <nav className="border-t border-outline-variant sticky top-16 md:top-0 bg-surface/80 backdrop-blur-md z-30 w-full">
          <div className="w-full flex items-stretch">
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

            <button
              onClick={() => setActiveTab("unapproved")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 border-t-[3px] transition-all duration-200 ${
                activeTab === "unapproved"
                  ? "border-error text-error bg-error/5"
                  : "border-transparent text-on-surface-variant hover:text-error hover:bg-surface-container/40"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === "unapproved" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                pending_actions
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold hidden md:block">
                Không được duyệt
              </span>
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 border-t-[3px] transition-all duration-200 ${
                activeTab === "saved"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container/40"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === "saved" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                bookmark
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold hidden md:block">
                Đã lưu
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
                  <p>Bạn chưa tạo địa điểm nào.</p>
                </div>
              ) : (
                createdLocations.map((location, index) => (
                  <LocationGridCard
                    key={location.id || index}
                    location={location}
                    currentUserId={currentUser.id}
                    onViewDetail={handleViewDetail}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "unapproved" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {unapprovedLocations.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant text-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
                    pending_actions
                  </span>
                  <p>Bạn không có địa điểm nào đang chờ duyệt hoặc bị từ chối.</p>
                </div>
              ) : (
                unapprovedLocations.map((location, index) => (
                  <LocationGridCard
                    key={location.id || index}
                    location={location}
                    currentUserId={currentUser.id}
                    onViewDetail={handleViewDetail}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {savedLocations.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant text-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
                    bookmark
                  </span>
                  <p>Bạn chưa lưu địa điểm nào.</p>
                </div>
              ) : (
                savedLocations.map((location, index) => (
                  <LocationGridCard
                    key={location.id || index}
                    location={location}
                    currentUserId={currentUser.id}
                    onViewDetail={handleViewDetail}
                  />
                ))
              )}
            </div>
          )}
        </section>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-2xl flex justify-around items-center z-50 border-t border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface-variant">
            home
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">
            explore
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">
            add_box
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">
            favorite
          </span>
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_circle
          </span>
        </nav>
      </main>

      {isModalOpen && selectedLocation && (
        <LocationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
        />
      )}

      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        title={followModalTitle}
        users={followModalUsers}
      />

      {isPasswordModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md min-w-[320px] shadow-2xl border border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-4">Đổi mật khẩu</h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-surface-container border border-outline focus:outline-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg bg-surface-container border focus:outline-primary ${lengthError ? 'border-error focus:border-error' : 'border-outline'}`}
                />
                {lengthError && <p className="text-error text-xs mt-1">{lengthError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg bg-surface-container border focus:outline-primary ${passwordError ? 'border-error focus:border-error' : 'border-outline'}`}
                />
                {passwordError && <p className="text-error text-xs mt-1">{passwordError}</p>}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-variant text-on-surface-variant hover:bg-outline-variant transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword || !isPasswordValid}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isChangingPassword && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isCropModalOpen && imageToCrop && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface rounded-xl p-4 md:p-6 w-[95vw] md:w-full max-w-lg min-w-[320px] md:min-w-[400px] shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface">Căn chỉnh ảnh đại diện</h3>
            <div className="relative w-full h-[60vh] max-h-[400px] bg-black/10 rounded-lg overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant">remove</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <span className="material-symbols-outlined text-on-surface-variant">add</span>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImageToCrop(null);
                }}
                className="px-4 py-2 rounded-lg bg-surface-variant text-on-surface-variant hover:bg-outline-variant transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default UserProfile;
