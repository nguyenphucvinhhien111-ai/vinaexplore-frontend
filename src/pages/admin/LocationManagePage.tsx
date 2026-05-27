import React, { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  MapPin,
  User,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { locationApi } from "@/api/locationApi";
import { adminApi } from "@/api/adminApi";
import type { Location } from "@/types/database";
import ConfirmModal from "@/components/common/ConfirmModal";
import { EditLocationModal } from "@/components/location/EditLocationModal";

const ITEMS_PER_PAGE = 8;

const LocationManagementPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    locationId: number | null;
    locationName: string;
  }>({
    isOpen: false,
    locationId: null,
    locationName: "",
  });

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const res: any = locationApi.getAll
        ? await locationApi.getAll()
        : await locationApi.getByStatus("APPROVED");

      const data = Array.isArray(res)
        ? res
        : res?.data?.content || res?.content || res?.data || [];
      const sortedData = data.sort(
        (a: Location, b: Location) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setLocations(sortedData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách địa điểm:", error);
      toast.error("Không thể tải danh sách địa điểm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = (id: number, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      locationId: id,
      locationName: name,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.locationId) return;

    const id = deleteConfirm.locationId;
    setIsProcessing(`delete-${id}`);
    try {
      await adminApi.deleteLocation(id);

      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      toast.success("Đã xóa địa điểm thành công!");

      if (paginatedLocations.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      setDeleteConfirm({ isOpen: false, locationId: null, locationName: "" });
    } catch (error) {
      toast.error("Lỗi khi xóa địa điểm. Vui lòng thử lại.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEditSuccess = () => {
    fetchLocations(); 
  };

  return (
    <div className="min-h-screen bg-background font-body p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-background">
              Quản lý Địa điểm
            </h1>
            <p className="text-on-surface-variant mt-2">
              Xem, tìm kiếm, chỉnh sửa hoặc xóa các địa điểm trên hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder="Tìm tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
              />
            </div>
            <button className="hidden sm:flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition shadow-sm whitespace-nowrap">
              <Plus size={20} /> Thêm mới
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
            <AlertTriangle
              className="mx-auto text-amber-500/50 mb-4"
              size={48}
            />
            <h3 className="text-lg font-bold text-on-surface mb-1">
              Không tìm thấy địa điểm nào
            </h3>
            <p className="text-on-surface-variant">
              Thử thay đổi từ khóa tìm kiếm xem sao.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {paginatedLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-2xl p-4 transition-all flex flex-col group shadow-sm hover:shadow-md"
                >
                  <div className="flex gap-4 mb-4">
                    <img
                      src={
                        loc.coverImage ||
                        "https://placehold.co/150x150?text=No+Image"
                      }
                      alt={loc.name}
                      className="w-[72px] h-[72px] rounded-xl object-cover bg-surface-variant shrink-0 border border-outline-variant/20"
                    />
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors"
                        title={loc.name}
                      >
                        {loc.name}
                      </h3>
                      <p
                        className="text-xs text-on-surface-variant mt-1 flex items-start gap-1 line-clamp-2"
                        title={loc.address}
                      >
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        {loc.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-variant/50 px-2.5 py-1 rounded-md">
                      <User size={12} />
                      <span className="truncate max-w-[80px]">
                        {loc.creatorFullName || `ID: ${loc.creatorId || "N/A"}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLocation(loc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="Sửa địa điểm"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        disabled={isProcessing === `delete-${loc.id}`}
                        className="p-1.5 text-error hover:bg-error/10 rounded-lg transition disabled:opacity-50"
                        title="Xóa địa điểm"
                      >
                        {isProcessing === `delete-${loc.id}` ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-outline-variant/20">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 rounded-full bg-surface border border-outline-variant/30 hover:bg-surface-variant disabled:opacity-40 transition"
                >
                  <ChevronLeft size={20} className="text-on-surface" />
                </button>
                <span className="text-sm font-medium text-on-surface-variant bg-surface px-4 py-1.5 rounded-full border border-outline-variant/30">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 rounded-full bg-surface border border-outline-variant/30 hover:bg-surface-variant disabled:opacity-40 transition"
                >
                  <ChevronRight size={20} className="text-on-surface" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {editingLocation && (
        <EditLocationModal
          isOpen={!!editingLocation}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
          onSuccess={handleEditSuccess}
          isAdmin={true}
        />
      )}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, locationId: null, locationName: "" })
        }
        onConfirm={confirmDelete}
        title="Xóa địa điểm"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn địa điểm "${deleteConfirm.locationName}" không? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vĩnh viễn"
        isProcessing={isProcessing === `delete-${deleteConfirm.locationId}`}
      />
    </div>
  );
};

export default LocationManagementPage;
