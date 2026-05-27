import React, { useState, useEffect } from "react";
import type { Location, Review } from "@/types/database";
import { interactApi } from "@/api/interactApi";
import Modal from "@/components/common/Modal";
import LocationDetailModal from "./LocationDetailModal";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/common/ConfirmModal";
import useAuthStore from "@/store/useAuthStore";

interface LocationFeedCardProps {
  location: Location;
  currentUserId?: number;
  onViewDetail?: (location: Location) => void;
}

const LocationFeedCard: React.FC<LocationFeedCardProps> = ({
  location,
  currentUserId,
  onViewDetail,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(
    location.favoriteCount || 0,
  );

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  const [checkinCount, setCheckinCount] = useState(location.checkinCount || 0);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(location.reviewsCount || 0);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState("");

  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    reviewId: number | null;
  }>({
    isOpen: false,
    reviewId: null,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!location.id) return;

      try {
        const promises = [
          interactApi.getFavoriteCountByLocation(location.id),
          currentUserId
            ? interactApi.getFavorites(currentUserId)
            : Promise.resolve([]),
          currentUserId ? interactApi.getCheckinHistory() : Promise.resolve([]),
        ];

        const [realCount, myFavorites, myCheckins] =
          await Promise.all(promises);

        setFavoriteCount(realCount as number);

        if (currentUserId) {
          const alreadyLiked = (myFavorites as Location[]).some(
            (item) => item.id === location.id,
          );
          setIsFavorited(alreadyLiked);

          const alreadyCheckedIn = (myCheckins as any[]).some(
            (item: any) =>
              item.locationId === location.id ||
              item.location?.id === location.id,
          );
          setIsCheckedIn(alreadyCheckedIn);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tương tác ban đầu:", error);
      }
    };

    fetchInitialData();
    const handleStatsUpdate = (e: any) => {
      const { locationId, type, count } = e.detail;
      if (locationId === location.id) {
        if (type === "CHECKIN") setCheckinCount(count);
        else if (type === "FAVORITE") setFavoriteCount(count);
        else if (type === "REVIEW") setReviewsCount(count);
      }
    };

    const handleNewReview = (e: any) => {
      const newReview = e.detail;
      if (newReview.locationId === location.id) {
        setReviews((prev) => {
          if (prev.some((r) => r.id === newReview.id)) return prev;
          return [newReview, ...prev];
        });
        setReviewsCount((prev) => prev + 1);
      }
    };

    window.addEventListener("LOCATION_STATS_UPDATE", handleStatsUpdate);
    window.addEventListener("NEW_REVIEW_PUBLISHED", handleNewReview);

    return () => {
      window.removeEventListener("LOCATION_STATS_UPDATE", handleStatsUpdate);
      window.removeEventListener("NEW_REVIEW_PUBLISHED", handleNewReview);
    };
  }, [currentUserId, location.id]);

  if (!location) return null;

  const formattedDate = location.createdAt
    ? new Date(location.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa cập nhật";

  const handleNavigateToLogin = () => {
    window.location.href = "/login";
    setIsAuthModalOpen(false);
  };

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const data = await interactApi.getReviewsByLocation(location.id);
      setReviews(data || []);
      setReviewsCount((data || []).length);
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleToggleReviews = () => {
    const nextState = !isReviewsOpen;
    setIsReviewsOpen(nextState);
    if (nextState && reviews.length === 0) {
      fetchReviews();
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isLoadingFavorite) return;

    setIsLoadingFavorite(true);
    try {
      const realTimeCount = await interactApi.toggleFavorite(
        currentUserId,
        location.id,
      );
      setFavoriteCount(realTimeCount);
      setIsFavorited((prev) => !prev);
    } catch (error) {
      console.error("Lỗi API toggle favorite:", error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleCheckin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isLoadingCheckin || isCheckedIn) return;
    if (!navigator.geolocation) {
      toast.error("Trình duyệt/Thiết bị của bạn không hỗ trợ định vị!");
      return;
    }

    setIsLoadingCheckin(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setIsCheckedIn(true);
        setCheckinCount((prev) => prev + 1);

        try {
          await interactApi.createCheckin({
            userId: currentUserId,
            locationId: location.id,
            actualLatitude: latitude,
            actualLongitude: longitude,
          });
          toast.success("Check-in thành công!");
        } catch (error) {
          setIsCheckedIn(false);
          setCheckinCount((prev) => Math.max(0, prev - 1));
          console.error("Lỗi khi check-in:", error);
          toast.error(
            "Check-in thất bại: Vị trí hiện tại của bạn không khớp với địa điểm này!",
          );
        } finally {
          setIsLoadingCheckin(false);
        }
      },
      (error) => {
        console.error("Lỗi lấy vị trí:", error);
        toast.error(
          "Không thể lấy vị trí. Vui lòng cấp quyền truy cập định vị!",
        );
        setIsLoadingCheckin(false);
      },
      {
        enableHighAccuracy: true, 
        timeout: 10000, 
      },
    );
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingComment(review.comment || "");
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId) return;
    try {
      await interactApi.updateReview(editingReviewId, {
        comment: editingComment,
        rating: 5,
      });
      toast.success("Cập nhật bình luận thành công!");
      setEditingReviewId(null);
      fetchReviews();
    } catch (error) {
      console.error("Lỗi cập nhật bình luận:", error);
      toast.error("Không thể cập nhật bình luận.");
    }
  };

  const handleDeleteReview = (id: number) => {
    setConfirmDeleteState({ isOpen: true, reviewId: id });
  };

  const confirmDeleteReview = async () => {
    if (!confirmDeleteState.reviewId) return;
    try {
      await interactApi.deleteReview(confirmDeleteState.reviewId);
      toast.success("Đã xóa bình luận!");
      fetchReviews();
    } catch (error) {
      console.error("Lỗi xóa bình luận:", error);
      toast.error("Không thể xóa bình luận.");
    } finally {
      setConfirmDeleteState({ isOpen: false, reviewId: null });
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUserId) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await interactApi.createReview({
        comment: newComment.trim(),
        rating: newRating,
        userId: currentUserId,
        locationId: location.id,
      });

      await fetchReviews();
      setNewComment("");
      setNewRating(5);
      toast.success("Gửi đánh giá thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error("Đã xảy ra lỗi khi gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenDetail = () => {
    setIsDetailModalOpen(true);
    if (onViewDetail) {
      onViewDetail(location);
    }
  };

  return (
    <>
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl mb-6 overflow-hidden shadow-[0_2px_10px_rgba(25,27,35,0.02)]">
        {/* --- Header --- */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href={`/profile/${location.creatorId}`} className="shrink-0">
              <img
                src={
                  location.creatorAvatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(location.creatorFullName || location.creatorUsername || "User")}&background=random`
                }
                className="w-10 h-10 rounded-full border border-outline-variant/50 object-cover"
                alt="User avatar"
              />
            </a>
            <div>
              <a
                href={`/profile/${location.creatorId}`}
                className="text-on-surface font-headline font-semibold text-sm hover:text-primary transition-colors inline-block"
              >
                {location.creatorFullName ||
                  location.creatorUsername ||
                  "Người dùng ẩn danh"}
              </a>
              <p className="text-on-surface-variant font-label text-xs mt-0.5">
                {formattedDate} •
                <span
                  className="text-primary font-medium ml-1 cursor-pointer hover:underline"
                  onClick={handleOpenDetail}
                >
                  Đang ở {location.name}
                </span>
              </p>
            </div>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>

        <div className="px-4 pb-3 text-on-surface font-body text-sm leading-relaxed whitespace-pre-wrap">
          {location.description}
        </div>

        <div
          className="relative cursor-pointer overflow-hidden bg-surface-container-highest flex justify-center"
          onClick={handleOpenDetail}
        >
          <img
            src={
              location.coverImage ||
              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80"
            }
            className="w-full h-auto max-h-[500px] object-cover hover:opacity-95 transition-opacity"
            alt={location.name}
          />
        </div>

        <div className="px-4 py-3 flex items-center justify-end border-b border-outline-variant/20">
          <div className="text-on-surface-variant font-label text-xs flex items-center gap-2.5">
            <span>{favoriteCount} lượt thích</span>
            <span>•</span>
            <span
              className="cursor-pointer hover:underline"
              onClick={handleToggleReviews}
            >
              {reviewsCount} đánh giá
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-primary/80">
              <span className="material-symbols-outlined text-[14px]">
                location_on
              </span>
              {checkinCount} lượt đến
            </span>
          </div>
        </div>

        <div className="flex items-center px-2 py-1">
          <button
            onClick={handleToggleFavorite}
            disabled={isLoadingFavorite}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors font-headline font-semibold text-sm disabled:opacity-50 ${
              isFavorited
                ? "text-error bg-error/10"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isFavorited ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              favorite
            </span>
            <span>{isFavorited ? "Đã yêu thích" : "Yêu thích"}</span>
          </button>

          <button
            onClick={handleCheckin}
            disabled={isLoadingCheckin || isCheckedIn}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors font-headline font-semibold text-sm disabled:opacity-50 ${
              isCheckedIn
                ? "text-tertiary bg-tertiary/10"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${isLoadingCheckin ? "animate-bounce" : ""}`}
              style={isCheckedIn ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              pin_drop
            </span>
            <span>
              {isLoadingCheckin
                ? "Đang định vị..."
                : isCheckedIn
                  ? "Đã đến"
                  : "Check-in"}
            </span>
          </button>

          <button
            onClick={handleToggleReviews}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors font-headline font-semibold text-sm ${
              isReviewsOpen
                ? "text-primary bg-primary/5"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              chat_bubble
            </span>
            <span>Bình luận</span>
          </button>
        </div>

        {isReviewsOpen && (
          <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-4 space-y-4 animate-in fade-in duration-200">
            {/* Form viết bình luận */}
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant">
                  Chấm điểm:
                </span>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => {
                        if (!currentUserId) setIsAuthModalOpen(true);
                        else setNewRating(star);
                      }}
                      className={`material-symbols-outlined text-base ${
                        star <= newRating
                          ? "text-[#FFB300]"
                          : "text-outline-variant/40"
                      }`}
                      style={
                        star <= newRating
                          ? { fontVariationSettings: "'FILL' 1" }
                          : {}
                      }
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={1}
                  value={newComment}
                  onClick={() => {
                    if (!currentUserId) setIsAuthModalOpen(true);
                  }}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết đánh giá của bạn..."
                  className="flex-1 bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/60 rounded-lg px-3 py-2 text-xs outline-none resize-none border border-transparent focus:border-primary/40"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || !newComment.trim()}
                  className="bg-primary text-on-primary px-3 rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {isSubmittingReview ? (
                    <span className="material-symbols-outlined animate-spin text-sm">
                      refresh
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">
                      send
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {isLoadingReviews ? (
                <div className="flex justify-center py-4 text-primary">
                  <span className="material-symbols-outlined animate-spin">
                    refresh
                  </span>
                </div>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-surface p-3 rounded-xl border border-outline-variant/10 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/profile/${review.creatorId}`}
                          className="shrink-0"
                        >
                          <img
                            src={
                              review.creatorAvatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(review.creatorFullName || review.creatorUsername || "User")}`
                            }
                            className="w-6 h-6 rounded-full object-cover"
                            alt="avatar"
                          />
                        </a>
                        <a
                          href={`/profile/${review.creatorId}`}
                          className="font-semibold text-on-surface text-xs hover:text-primary transition-colors"
                        >
                          {review.creatorFullName ||
                            review.creatorUsername ||
                            "Ẩn danh"}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(review.rating)].map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-[12px] text-[#FFB300]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        {(review.creatorId === currentUserId ||
                          useAuthStore.getState().user?.role ===
                            "ROLE_ADMIN") && (
                          <div className="flex items-center gap-2 ml-2 border-l border-outline-variant/30 pl-2">
                            {review.creatorId === currentUserId && (
                              <button
                                onClick={() => handleEditReview(review)}
                                className="text-on-surface-variant hover:text-primary transition-colors"
                                title="Sửa"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  edit
                                </span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-on-surface-variant hover:text-error transition-colors"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                delete
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingReviewId === review.id ? (
                      <div className="mt-2 space-y-2 pl-8">
                        <textarea
                          value={editingComment}
                          onChange={(e) => setEditingComment(e.target.value)}
                          className="w-full bg-surface-container-highest text-on-surface rounded-lg px-3 py-1.5 text-xs outline-none resize-none border border-primary/30"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingReviewId(null)}
                            className="text-[10px] px-2 py-1 rounded bg-surface-variant hover:bg-outline-variant/30 transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleUpdateReview}
                            className="text-[10px] px-2 py-1 rounded bg-primary text-on-primary hover:opacity-90 transition-colors"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-on-surface-variant text-xs leading-relaxed pl-8">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-on-surface-variant/60 italic text-xs py-2">
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        type="login_required"
        onLogin={handleNavigateToLogin}
      />

      <LocationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        location={location}
        currentUserId={currentUserId}
        onReviewSuccess={() => fetchReviews()}
      />

      <ConfirmModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState({ isOpen: false, reviewId: null })}
        onConfirm={confirmDeleteReview}
        title="Xóa bình luận"
        message="Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác."
        confirmLabel="Xóa ngay"
      />
    </>
  );
};

export default LocationFeedCard;
