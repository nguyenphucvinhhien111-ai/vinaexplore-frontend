import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  ChevronLeft,
  Loader2,
  ChevronRight,
  Edit,
} from "lucide-react";
import { adminApi } from "@/api/adminApi";
import { locationApi } from "@/api/locationApi";
import type { Location, LocationEdit } from "@/types/database";
import { toast } from "react-toastify";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import { EditLocationModal } from "@/components/location/EditLocationModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import useAuthStore from "@/store/useAuthStore";

const ITEMS_PER_PAGE = 5;

const ApprovalPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [pendingLocations, setPendingLocations] = useState<Location[]>([]);
  const [pendingEdits, setPendingEdits] = useState<LocationEdit[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [locPage, setLocPage] = useState(1);
  const [editPage, setEditPage] = useState(1);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel: string;
    actionKey: string | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmLabel: "Xác nhận",
    actionKey: null,
  });

  const handleOpenModal = (loc: Location) => {
    setSelectedLocation(loc);
    setIsModalOpen(true);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [locRes, editRes] = await Promise.all([
        locationApi.getByStatus("PENDING"),
        adminApi.getPendingEdits(), 
      ]);

      const pendingLocs = Array.isArray(locRes)
        ? locRes
        : (locRes as any)?.data || [];
      setPendingLocations(pendingLocs);

      const allEdits =
        (editRes as any)?.data?.content ||
        (editRes as any)?.content ||
        (editRes as any)?.data ||
        editRes ||
        [];
      const pEdits = allEdits.filter(
        (edit: LocationEdit) => edit.status === "PENDING",
      );
      setPendingEdits(pEdits);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu phê duyệt:", error);
      toast.error("Không thể tải dữ liệu phê duyệt.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLocationAction = (
    e: React.MouseEvent,
    id: number,
    action: "approve" | "reject",
    name: string,
  ) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: action === "approve" ? "Phê duyệt địa điểm" : "Từ chối địa điểm",
      message: `Bạn có chắc chắn muốn ${action === "approve" ? "phê duyệt" : "từ chối"} địa điểm "${name}" không?`,
      confirmLabel: action === "approve" ? "Phê duyệt" : "Từ chối",
      actionKey: `loc-${action}-${id}`,
      onConfirm: async () => {
        setIsProcessing(`loc-${action}-${id}`);
        try {
          if (action === "approve") {
            await adminApi.approveLocation(id);
          } else {
            await adminApi.rejectLocation(id);
          }

          setPendingLocations((prev) => prev.filter((loc) => loc.id !== id));
          toast.success(
            action === "approve"
              ? "Đã duyệt địa điểm!"
              : "Đã từ chối địa điểm!",
          );

          if (paginatedLocations.length === 1 && locPage > 1)
            setLocPage(locPage - 1);
        } catch (error) {
          toast.error("Có lỗi xảy ra khi xử lý.");
        } finally {
          setIsProcessing(null);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleEditAction = (
    e: React.MouseEvent,
    id: number,
    action: "approve" | "reject",
    name: string,
  ) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: action === "approve" ? "Duyệt yêu cầu sửa" : "Bỏ qua yêu cầu sửa",
      message: `Bạn có chắc chắn muốn ${action === "approve" ? "duyệt" : "bỏ qua"} yêu cầu chỉnh sửa cho "${name}" không?`,
      confirmLabel: action === "approve" ? "Cập nhật" : "Bỏ qua",
      actionKey: `edit-${action}-${id}`,
      onConfirm: async () => {
        setIsProcessing(`edit-${action}-${id}`);
        try {
          if (action === "approve") {
            await adminApi.approveEdit(id);
          } else {
            await adminApi.rejectEdit(id);
          }

          setPendingEdits((prev) => prev.filter((edit) => edit.id !== id));
          toast.success(
            action === "approve"
              ? "Đã cập nhật yêu cầu!"
              : "Đã từ chối yêu cầu!",
          );

          if (paginatedEdits.length === 1 && editPage > 1)
            setEditPage(editPage - 1);
        } catch (error) {
          toast.error("Có lỗi xảy ra khi xử lý.");
        } finally {
          setIsProcessing(null);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const locTotalPages = Math.ceil(pendingLocations.length / ITEMS_PER_PAGE);
  const paginatedLocations = pendingLocations.slice(
    (locPage - 1) * ITEMS_PER_PAGE,
    locPage * ITEMS_PER_PAGE,
  );

  const editTotalPages = Math.ceil(pendingEdits.length / ITEMS_PER_PAGE);
  const paginatedEdits = pendingEdits.slice(
    (editPage - 1) * ITEMS_PER_PAGE,
    editPage * ITEMS_PER_PAGE,
  );

  const PaginationControls = ({
    currentPage,
    totalPages,
    setPage,
  }: {
    currentPage: number;
    totalPages: number;
    setPage: (p: number) => void;
  }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-on-surface-variant">
          Trang {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
          className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-bold text-on-background">
            Quản lý Phê duyệt
          </h1>
          <p className="text-on-surface-variant mt-2">
            Duyệt nhanh các địa điểm và thay đổi từ cộng đồng.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              progress_activity
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <h2 className="text-xl font-bold text-on-surface">
                  Địa điểm tạo mới
                </h2>
                <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
                  {pendingLocations.length}
                </span>
              </div>

              {pendingLocations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle
                    className="mx-auto text-success/50 mb-3"
                    size={40}
                  />
                  <p className="text-on-surface-variant text-sm">
                    Không có địa điểm mới.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedLocations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => handleOpenModal(loc)}
                      className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col cursor-pointer hover:border-primary/50 transition"
                    >
                      <div className="flex gap-4 mb-3">
                        <img
                          src={
                            loc.coverImage ||
                            "https://placehold.co/100x100?text=No+Image"
                          }
                          alt={loc.name}
                          className="w-20 h-20 rounded-xl object-cover border border-outline-variant/20 bg-surface-variant shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-on-surface line-clamp-1 truncate">
                            {loc.name}
                          </h3>
                          <p className="text-xs text-on-surface-variant mt-1 flex items-start gap-1 line-clamp-2">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            {loc.address}
                          </p>
                          <p className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-1 rounded mt-2 font-medium w-fit">
                            <User size={10} />
                            {loc.creatorFullName ||
                              loc.creatorUsername ||
                              loc.author?.fullName ||
                              `ID: ${loc.creatorId || "Ẩn danh"}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2 pt-3 border-t border-outline-variant/20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLocation(loc);
                          }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                          title="Sửa trước khi duyệt"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) =>
                            handleLocationAction(e, loc.id, "reject", loc.name)
                          }
                          disabled={isProcessing !== null}
                          className="flex-1 py-2 rounded-lg border border-error text-error font-bold text-xs hover:bg-error/10 transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing === `loc-reject-${loc.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={14} />
                          )}
                          Từ chối
                        </button>
                        <button
                          onClick={(e) =>
                            handleLocationAction(e, loc.id, "approve", loc.name)
                          }
                          disabled={isProcessing !== null}
                          className="flex-1 py-2 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing === `loc-approve-${loc.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Phê duyệt
                        </button>
                      </div>
                    </div>
                  ))}

                  <PaginationControls
                    currentPage={locPage}
                    totalPages={locTotalPages}
                    setPage={setLocPage}
                  />
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <h2 className="text-xl font-bold text-on-surface">
                  Yêu cầu chỉnh sửa
                </h2>
                <span className="bg-amber-500/10 text-amber-600 text-xs px-2.5 py-1 rounded-full font-bold">
                  {pendingEdits.length}
                </span>
              </div>

              {pendingEdits.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle
                    className="mx-auto text-success/50 mb-3"
                    size={40}
                  />
                  <p className="text-on-surface-variant text-sm">
                    Không có yêu cầu chỉnh sửa.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedEdits.map((edit) => (
                    <div
                      key={edit.id}
                      onClick={() => {
                        if (edit.originalLocation) {
                          handleOpenModal(edit.originalLocation as Location);
                        } else {
                          toast.error("Không có dữ liệu gốc để xem!");
                        }
                      }}
                      className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col cursor-pointer hover:border-amber-500/30 transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock size={10} /> Đề xuất sửa
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium truncate">
                          {edit.originalLocation?.name ||
                            `Địa điểm ID ${edit.locationId}`}
                        </span>
                      </div>

                      <div className="bg-surface-container-highest p-3 rounded-xl border border-outline-variant/30 mb-3">
                        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                          Dữ liệu mới:
                        </h4>
                        {edit.newName && (
                          <p className="text-xs mb-1 truncate">
                            <span className="font-medium">Tên:</span>{" "}
                            {edit.newName}
                          </p>
                        )}
                        {edit.newAddress && (
                          <p className="text-xs mb-1 truncate">
                            <span className="font-medium">Đ/c:</span>{" "}
                            {edit.newAddress}
                          </p>
                        )}
                        {edit.newDescription && (
                          <p className="text-xs text-on-surface-variant italic line-clamp-1">
                            "{edit.newDescription}"
                          </p>
                        )}

                        {!edit.newName &&
                          !edit.newAddress &&
                          !edit.newDescription && (
                            <p className="text-xs text-on-surface-variant italic">
                              Đổi tọa độ, ảnh hoặc thẻ.
                            </p>
                          )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={(e) =>
                            handleEditAction(
                              e,
                              edit.id,
                              "reject",
                              edit.originalLocation?.name || "địa điểm",
                            )
                          }
                          disabled={isProcessing !== null}
                          className="flex-1 py-2 rounded-lg border border-error text-error font-bold text-xs hover:bg-error/10 transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing === `edit-reject-${edit.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={14} />
                          )}
                          Bỏ qua
                        </button>
                        <button
                          onClick={(e) =>
                            handleEditAction(
                              e,
                              edit.id,
                              "approve",
                              edit.originalLocation?.name || "địa điểm",
                            )
                          }
                          disabled={isProcessing !== null}
                          className="flex-1 py-2 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing === `edit-approve-${edit.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Cập nhật
                        </button>
                      </div>
                    </div>
                  ))}

                  <PaginationControls
                    currentPage={editPage}
                    totalPages={editTotalPages}
                    setPage={setEditPage}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && selectedLocation && (
        <LocationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={selectedLocation}
          currentUserId={currentUser?.id}
        />
      )}

      {editingLocation && (
        <EditLocationModal
          isOpen={!!editingLocation}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
          onSuccess={() => {
            fetchData();
            setEditingLocation(null);
          }}
          isAdmin={true}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        isProcessing={isProcessing === confirmState.actionKey}
      />
    </div>
  );
};

export default ApprovalPage;
