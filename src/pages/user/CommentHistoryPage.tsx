import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";
import { interactApi } from "@/api/interactApi";
import type { Location, Review } from "@/types/database";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import UserSidebar from "@/components/layout/UserSidebar";

const CommentHistoryPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [reviewsWithData, setReviewsWithData] = useState<
    (Review & { location?: Location })[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCommentHistory = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response: any = await interactApi.getReviewsByUser(
          currentUser.id,
        );

        let allReviews: Review[] = [];
        if (Array.isArray(response)) {
          allReviews = response;
        } else if (response?.content && Array.isArray(response.content)) {
          allReviews = response.content;
        } else if (response?.data && Array.isArray(response.data)) {
          allReviews = response.data;
        }

        const safeReviews = allReviews.map((rev) => ({
          ...rev,
          location:
            rev.location ||
            ({
              id: rev.locationId || 0,
              name: "Địa điểm đã bị xóa hoặc không xác định",
              address: "",
              coverImage: null,
              status: "APPROVED",
              rating: 0,
              reviewsCount: 0,
              checkinCount: 0,
              latitude: 0,
              longitude: 0,
              description: "",
              createdAt: "",
              updatedAt: "",
            } as Location),
        }));

        const sorted = safeReviews.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

        setReviewsWithData(sorted);
      } catch (err) {
        console.error("Lỗi hệ thống khi tải lịch sử đánh giá:", err);
        setError("Không thể tải lịch sử đánh giá. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommentHistory();
  }, [currentUser]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reviewsWithData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reviewsWithData.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: "--/--/----", time: "--:--" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <p>Vui lòng đăng nhập để xem lịch sử đánh giá.</p>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-background font-body py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto flex gap-8 items-start justify-center">
          <div className="flex-1 w-full max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl md:text-4xl">
                  forum
                </span>
                Lịch sử Đánh giá
              </h1>
              <p className="text-sm text-on-surface-variant mt-2">
                Xem lại những chia sẻ và cảm nhận của bạn về các địa điểm đã ghé
                thăm.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                  progress_activity
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-error">
                <p>{error}</p>
              </div>
            ) : reviewsWithData.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">
                  rate_review
                </span>
                <p className="text-on-surface-variant mb-4">
                  Bạn chưa có bài đánh giá nào.
                </p>
                <Link
                  to="/explore"
                  className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition"
                >
                  Khám phá & Đánh giá ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {currentItems.map((item) => {
                    const { date, time } = formatDateTime(item.createdAt);
                    const locData = item.location;

                    return (
                      <div
                        key={item.id}
                        onClick={() => locData?.id && handleViewDetail(locData)}
                        className="group flex flex-row items-start gap-4 bg-surface p-3.5 sm:p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                      >
                        <div className="w-[80px] h-[80px] sm:w-[110px] sm:h-[100px] shrink-0 rounded-lg overflow-hidden bg-surface-variant relative mt-0.5">
                          {locData?.coverImage ? (
                            <img
                              src={locData.coverImage}
                              alt={locData.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined">
                                image
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface truncate group-hover:text-primary transition-colors">
                                {locData?.name || "Địa điểm chưa đặt tên"}
                              </h3>
                              <span className="text-[11px] sm:text-xs text-outline shrink-0 mt-0.5">
                                {date} {time}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                              <span className="material-symbols-outlined text-[14px] shrink-0">
                                location_on
                              </span>
                              <span className="truncate">
                                {locData?.address || "Chưa cập nhật địa chỉ"}
                              </span>
                            </p>
                          </div>

                          <div className="bg-background p-2.5 rounded-lg border border-outline-variant/20">
                            <div className="flex gap-0.5 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`material-symbols-outlined text-xs sm:text-sm ${
                                    i < item.rating
                                      ? "text-amber-500"
                                      : "text-outline-variant"
                                  }`}
                                  style={{
                                    fontVariationSettings:
                                      i < item.rating ? "'FILL' 1" : "'FILL' 0",
                                  }}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                            <p className="text-xs sm:text-sm text-on-surface italic line-clamp-2">
                              "
                              {item.comment ||
                                "Người dùng không để lại lời nhắn."}
                              "
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-full bg-surface hover:bg-surface-variant text-on-surface disabled:opacity-30 transition"
                    >
                      <span className="material-symbols-outlined">
                        chevron_left
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                              currentPage === pageNum
                                ? "bg-primary text-white"
                                : "bg-surface hover:bg-surface-variant text-on-surface"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-full bg-surface hover:bg-surface-variant text-on-surface disabled:opacity-30 transition"
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:block shrink-0 w-[300px] sticky top-8">
            <UserSidebar />
          </div>
        </div>
      </main>

      {isModalOpen && selectedLocation && (
        <LocationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
          currentUserId={currentUser.id}
        />
      )}
    </>
  );
};

export default CommentHistoryPage;
