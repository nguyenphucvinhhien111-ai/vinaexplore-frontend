import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Star, Send, Loader2 } from "lucide-react";
import type { LocationEntity, Review } from "@/types/database";
import { interactApi } from "@/api/interactApi";
import Modal from "../common/Modal";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "react-toastify";
import { EditLocationModal } from "./EditLocationModal";
import ConfirmModal from "../common/ConfirmModal";

interface LocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationEntity | null;
  onPlanRoute?: () => void;
  currentUserId?: number;
  onReviewSuccess?: () => void;
  onDeleteReview?: (id: number) => void;
}

export default function LocationDetailModal({
  isOpen,
  onClose,
  location,
  onPlanRoute,
  currentUserId,
  onReviewSuccess,
  onDeleteReview,
}: LocationDetailModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [currentRating, setCurrentRating] = useState(location?.rating || 0);
  const [currentReviewCount, setCurrentReviewCount] = useState(location?.reviewsCount || 0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState("");

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  const [checkinCount, setCheckinCount] = useState(location?.checkinCount || 0);

  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    reviewId: number | null;
  }>({
    isOpen: false,
    reviewId: null,
  });

  const [isDetailUpdated, setIsDetailUpdated] = useState(false); // Helper state to trigger re-renders if needed

  const storeUserId = useAuthStore((state) => state.user?.id);
  const activeUserId = currentUserId || storeUserId;

  useEffect(() => {
    const handleStatsUpdate = (e: any) => {
      const { locationId, type, count } = e.detail;
      if (locationId === location?.id) {
        if (type === "CHECKIN") {
          setCheckinCount(count);
        } else if (type === "FAVORITE") {
        } else if (type === "REVIEW") {
          setCurrentRating(e.detail.rating);
          setCurrentReviewCount(count);
        }
      }
    };

    const handleNewReview = (e: any) => {
      const newReview = e.detail;
      if (newReview.locationId === location?.id) {
        setReviews((prev) => {
          if (prev.some((r) => r.id === newReview.id)) return prev;
          return [newReview, ...prev];
        });
      }
    };

    const handleLocationUpdate = (e: any) => {
      const updatedLoc = e.detail;
      if (updatedLoc.id === location?.id) {
        if (updatedLoc.rating !== undefined) setCurrentRating(updatedLoc.rating);
        if (updatedLoc.reviewsCount !== undefined) setCurrentReviewCount(updatedLoc.reviewsCount);
        if (updatedLoc.checkinCount !== undefined) setCheckinCount(updatedLoc.checkinCount);
      }
    };

    const handleAvatarUpdate = (e: any) => {
      const data = e.detail;
      setReviews((prev) => 
        prev.map((r) => {
          if (r.creatorId === data.userId) {
            return { ...r, creatorAvatar: data.avatarUrl };
          }
          return r;
        })
      );
    };

    window.addEventListener("LOCATION_STATS_UPDATE", handleStatsUpdate);
    window.addEventListener("NEW_REVIEW_PUBLISHED", handleNewReview);
    window.addEventListener("NEW_LOCATION_PUBLISHED", handleLocationUpdate);
    window.addEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    return () => {
      window.removeEventListener("LOCATION_STATS_UPDATE", handleStatsUpdate);
      window.removeEventListener("NEW_REVIEW_PUBLISHED", handleNewReview);
      window.removeEventListener("NEW_LOCATION_PUBLISHED", handleLocationUpdate);
      window.removeEventListener("USER_AVATAR_UPDATED", handleAvatarUpdate);
    };
  }, [location?.id]);

  const fetchReviews = async () => {
    if (!location) return;
    setIsLoadingReviews(true);
    try {
      const data = await interactApi.getReviewsByLocation(location.id);
      const loadedReviews = data || [];
      setReviews(loadedReviews);

      if (loadedReviews.length > 0) {
        const totalStars = loadedReviews.reduce((sum, review) => sum + review.rating, 0);
        setCurrentRating(totalStars / loadedReviews.length);
        setCurrentReviewCount(loadedReviews.length);
      }
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const checkUserInteraction = async () => {
    if (!activeUserId || !location) return;
    try {
      const myCheckins = await interactApi.getCheckinHistory();
      const alreadyCheckedIn = (myCheckins as any[]).some(
        (item: any) => item.locationId === location.id || item.location?.id === location.id,
      );
      setIsCheckedIn(alreadyCheckedIn);
    } catch (error) {
      console.error("Lỗi khi tải trạng thái tương tác:", error);
    }
  };

  useEffect(() => {
    if (isOpen && location) {
      Promise.all([fetchReviews(), checkUserInteraction()]);
    } else {
      setReviews([]);
      setIsCheckedIn(false);
    }
  }, [isOpen, location, activeUserId]);

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
      if (onDeleteReview) onDeleteReview(confirmDeleteState.reviewId);
    } catch (error) {
      console.error("Lỗi xóa bình luận:", error);
      toast.error("Không thể xóa bình luận.");
    } finally {
      setConfirmDeleteState({ isOpen: false, reviewId: null });
    }
  };

  const handleCheckin = async () => {
    if (!activeUserId) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isLoadingCheckin || isCheckedIn || !location) return;
    if (location.status === "PENDING") {
      toast.error("Không thể check-in tại địa điểm đang chờ duyệt!");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị!");
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
            userId: activeUserId,
            locationId: location.id,
            actualLatitude: latitude,
            actualLongitude: longitude,
          });
          toast.success("Check-in thành công!");
        } catch (error) {
          setIsCheckedIn(false);
          setCheckinCount((prev) => Math.max(0, prev - 1));
          toast.error("Check-in thất bại!");
        } finally {
          setIsLoadingCheckin(false);
        }
      },
      () => {
        toast.error("Không thể lấy vị trí!");
        setIsLoadingCheckin(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmitReview = async () => {
    if (!activeUserId) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await interactApi.createReview({
        comment: newComment.trim(),
        rating: newRating,
        userId: activeUserId,
        locationId: location!.id,
      });
      setNewComment("");
      setNewRating(5);
      await fetchReviews();
      if (onReviewSuccess) onReviewSuccess();
      toast.success("Gửi đánh giá thành công!");
    } catch (error) {
      toast.error("Lỗi khi gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleNavigateToLogin = () => {
    window.location.href = "/login";
    setIsAuthModalOpen(false);
  };

  if (!isOpen || !location) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-surface w-full max-w-6xl max-h-[95vh] rounded-3xl shadow-2xl overflow-y-auto flex flex-col border border-outline-variant/20">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-surface-container-highest/80 hover:bg-surface-container-highest text-on-surface rounded-full transition-colors shadow-sm">
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[400px] rounded-3xl overflow-hidden shadow-sm bg-surface-container-highest">
              <img src={location.coverImage || "https://via.placeholder.com/800x600"} alt={location.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-on-surface leading-tight">
                  {location.name}
                  {location.status === "PENDING" && <span className="ml-3 px-3 py-1 bg-tertiary/10 text-tertiary text-sm font-semibold rounded-full">Chờ duyệt</span>}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium">{location.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary/80">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-semibold">{checkinCount} lượt đến</span>
                  </div>
                </div>
                <p className="mt-6 text-on-surface-variant leading-relaxed text-sm md:text-base">
                  {location.description || "Hệ thống chưa cập nhật mô tả cho địa điểm này."}
                </p>
              </div>

              <div className="mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => { if (onPlanRoute) onPlanRoute(); else { window.dispatchEvent(new CustomEvent("OPEN_GLOBAL_MAP_ROUTING", { detail: location })); onClose(); } }} className="sm:col-span-2 bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]">
                    <span className="material-symbols-outlined">map</span> Lên Kế Hoạch Ngay
                  </button>

                  {location.creatorId === activeUserId && (
                    <button onClick={() => setIsEditModalOpen(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-4 px-6 rounded-2xl transition-all border border-amber-200 flex items-center justify-center gap-2 active:scale-[0.98]">
                      <span className="material-symbols-outlined">edit</span> Sửa Thông Tin
                    </button>
                  )}

                  <button onClick={handleCheckin} disabled={isLoadingCheckin || isCheckedIn || location.status === "PENDING"} className={`font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] border ${isCheckedIn ? "bg-tertiary/10 text-tertiary border-tertiary/20" : "bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80 border-outline-variant/30"} ${location.creatorId !== activeUserId ? "sm:col-span-2" : ""}`}>
                    <MapPin className={`w-5 h-5 ${isLoadingCheckin ? "animate-bounce" : ""}`} />
                    <span>{isLoadingCheckin ? "Đang định vị..." : isCheckedIn ? "Đã Check-in" : "Tôi Đang Ở Đây"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-outline-variant/20" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-on-surface">Cộng Đồng Đánh Giá ({currentReviewCount})</h3>
              <div className="space-y-4">
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img src={review.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.creatorFullName || review.creatorUsername)}`} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                          <div>
                            <div className="font-semibold text-sm">{review.creatorFullName || review.creatorUsername}</div>
                            <div className="text-[11px] text-on-surface-variant/60">{formatDate(review.createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (<Star key={i} className="w-4 h-4 text-[#FFB300] fill-[#FFB300]" />))}
                          </div>
                          {(review.creatorId === activeUserId || useAuthStore.getState().user?.role === "ROLE_ADMIN") && (
                            <div className="flex items-center gap-2 ml-2 border-l pl-2 border-outline-variant/30">
                              {review.creatorId === activeUserId && (
                                <button onClick={() => handleEditReview(review)} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                              )}
                              <button onClick={() => handleDeleteReview(review.id)} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            </div>
                          )}
                        </div>
                      </div>
                      {editingReviewId === review.id ? (
                        <div className="mt-4 space-y-3">
                          <textarea value={editingComment} onChange={(e) => setEditingComment(e.target.value)} className="w-full bg-surface-container-highest rounded-xl px-4 py-2 text-sm outline-none resize-none" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingReviewId(null)} className="text-xs px-3 py-1.5 rounded-lg bg-surface-variant">Hủy</button>
                            <button onClick={handleUpdateReview} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-on-primary">Lưu</button>
                          </div>
                        </div>
                      ) : (<p className="mt-4 text-on-surface-variant text-sm whitespace-pre-wrap">{review.comment}</p>)}
                    </div>
                  ))
                ) : (<p className="text-on-surface-variant/80 italic text-sm">Chưa có đánh giá nào.</p>)}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 flex items-center gap-4">
                <div className="text-4xl font-black text-primary">{currentRating.toFixed(1)}</div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-5 h-5 ${star <= Math.round(currentRating) ? "text-[#FFB300] fill-[#FFB300]" : "text-outline-variant/30"}`} />))}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">Đánh giá trung bình</div>
                </div>
              </div>
              {location.status !== "PENDING" && (
                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
                  <h4 className="font-bold mb-4">Viết đánh giá</h4>
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (<Star key={star} onClick={() => setNewRating(star)} className={`w-6 h-6 cursor-pointer ${star <= newRating ? "text-[#FFB300] fill-[#FFB300]" : "text-outline-variant/50"}`} />))}
                    </div>
                    <textarea rows={3} placeholder="Ý kiến của bạn..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm outline-none resize-none" />
                    <button onClick={handleSubmitReview} disabled={isSubmittingReview || !newComment.trim()} className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl flex justify-center items-center gap-2">
                      {isSubmittingReview ? <Loader2 className="animate-spin w-5 h-5" /> : <>Gửi Đánh Giá <Send className="w-4 h-4" /></>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} type="login_required" onLogin={handleNavigateToLogin} />
      {isEditModalOpen && (
        <EditLocationModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} location={location} onSuccess={() => { setIsEditModalOpen(false); onClose(); }} isAdmin={useAuthStore.getState().user?.role === "ROLE_ADMIN"} />
      )}
      <ConfirmModal isOpen={confirmDeleteState.isOpen} onClose={() => setConfirmDeleteState({ isOpen: false, reviewId: null })} onConfirm={confirmDeleteReview} title="Xóa bình luận" message="Bạn có chắc chắn muốn xóa bình luận này không?" confirmLabel="Xóa ngay" />
    </div>,
    document.body
  );
}
