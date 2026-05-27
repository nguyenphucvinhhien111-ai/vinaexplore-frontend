import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { locationApi } from "@/api/locationApi";
import type { Location } from "@/types/database";
import LocationGridCard from "@/components/location/LocationGridCard";
import LocationDetailModal from "@/components/location/LocationDetailModal"; // Import lại modal
import { ChevronLeft, ChevronRight } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";

export default function PendingLocationsDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUser = useAuthStore((state) => state.user);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchPendingLocations = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await locationApi.getByUserId(currentUser.id);
        const pendingLocations = (data || []).filter(
          (loc: Location) => loc.status === "PENDING",
        );

        setLocations(pendingLocations);
      } catch (err) {
        console.error("Error fetching pending locations:", err);
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingLocations();
  }, [currentUser]);

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(locations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLocations = locations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl md:text-4xl">
            pending_actions
          </span>
          Địa điểm chờ duyệt
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Xem lại các địa điểm bạn đã tạo và đang trong quá trình chờ hệ thống
          phê duyệt.
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
      ) : locations.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">
            hourglass_empty
          </span>
          <p className="text-on-surface-variant mb-4">
            Bạn không có địa điểm nào đang chờ duyệt.
          </p>
          <Link
            to="/explore"
            className="bg-primary inline-block text-white px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition"
          >
            Khám phá & Đánh giá ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {currentLocations.map((loc) => (
              <LocationGridCard
                key={loc.id}
                location={loc}
                currentUserId={currentUser?.id}
                onViewDetail={handleViewDetail} 
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 flex items-center gap-1 rounded-xl bg-surface border border-outline-variant/30 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium pr-2">
                  Trước
                </span>
              </button>
              <div className="text-sm font-medium bg-surface-container-low px-4 py-2 rounded-lg">
                Trang {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 flex items-center gap-1 rounded-xl bg-surface border border-outline-variant/30 disabled:opacity-50"
              >
                <span className="hidden sm:inline text-sm font-medium pl-2">
                  Sau
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {isModalOpen && selectedLocation && (
        <LocationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
