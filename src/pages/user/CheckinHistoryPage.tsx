import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";
import { interactApi } from "@/api/interactApi";
import { locationApi } from "@/api/locationApi";
import type { Checkin, Location } from "@/types/database";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import UserSidebar from "@/components/layout/UserSidebar"; // ✅ Import UserSidebar

const CheckinHistoryPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCheckinHistory = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await interactApi.getCheckinHistory();
        const allCheckins = response || [];

        const checkinsWithFullLocation = await Promise.all(
          allCheckins.map(async (checkin: any) => {
            try {
              const locDetail = await locationApi.getById(checkin.locationId);
              return { ...checkin, location: locDetail };
            } catch (err) {
              return {
                ...checkin,
                location: {
                  id: checkin.locationId,
                  name: checkin.locationName || "Địa điểm chưa đặt tên",
                  address: "Chưa cập nhật địa chỉ",
                  rating: 0,
                },
              };
            }
          }),
        );

        const sortedCheckins = checkinsWithFullLocation.sort(
          (a: any, b: any) => {
            const dateA = a.checkinDate ? new Date(a.checkinDate).getTime() : 0;
            const dateB = b.checkinDate ? new Date(b.checkinDate).getTime() : 0;
            return dateB - dateA;
          },
        );

        setCheckins(sortedCheckins);
      } catch (err) {
        setError("Không thể tải lịch sử. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckinHistory();
  }, [currentUser]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = checkins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(checkins.length / itemsPerPage);

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
        <p>Vui lòng đăng nhập để xem lịch sử check-in.</p>
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
                  history
                </span>
                Lịch sử Check-in
              </h1>
              <p className="text-sm text-on-surface-variant mt-2">
                Xem lại những hành trình và địa điểm bạn đã lưu dấu chân.
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
            ) : checkins.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">
                  explore_off
                </span>
                <p className="text-on-surface-variant mb-4">
                  Bạn chưa có lịch sử check-in nào.
                </p>
                <Link
                  to="/explore"
                  className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition"
                >
                  Khám phá ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {currentItems.map((checkin: any, index) => {
                    const { date, time } = formatDateTime(checkin.checkinDate);
                    const locData = checkin.location;

                    return (
                      <div
                        key={checkin.id || index}
                        onClick={() => locData?.id && handleViewDetail(locData)}
                        className="group flex flex-row items-center gap-4 bg-surface p-3 pr-4 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                      >
                        <div className="w-[90px] h-[75px] sm:w-[120px] sm:h-[80px] shrink-0 rounded-lg overflow-hidden bg-surface-variant relative">
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

                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface truncate">
                                {locData?.name || "Địa điểm chưa đặt tên"}
                              </h3>
                              <div className="flex items-center gap-1 text-sm font-bold text-on-surface shrink-0">
                                <span
                                  className="material-symbols-outlined text-amber-500 text-[16px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                {locData?.rating
                                  ? locData.rating.toFixed(1)
                                  : "0.0"}
                              </div>
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

                          <div className="flex items-center gap-1 text-primary font-medium text-[11px] sm:text-xs mt-2">
                            <span className="material-symbols-outlined text-[14px]">
                              calendar_today
                            </span>
                            Đã đến: {date} lúc {time}
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

export default CheckinHistoryPage;
