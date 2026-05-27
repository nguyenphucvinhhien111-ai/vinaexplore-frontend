import React, { useState, useEffect } from "react";
import {
  Search,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/useAuthStore";
import { adminApi } from "@/api/adminApi";
import ConfirmModal from "@/components/common/ConfirmModal";

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  avatar?: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
  status: "ACTIVE" | "BANNED";
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const UserManagementPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    actionKey: string | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Xác nhận",
    onConfirm: () => {},
    actionKey: null,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res: any = await adminApi.getUsers();
      const data = Array.isArray(res)
        ? res
        : res?.data?.content || res?.content || res?.data || [];
      const mappedData = data.map((u: any) => ({
        ...u,
        status: u.active ? "ACTIVE" : "BANNED",
        avatar: u.avatarUrl
      }));

      const sortedData = mappedData.sort(
        (a: AppUser, b: AppUser) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setUsers(sortedData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      toast.error("Không thể tải danh sách tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleToggleStatus = async (
    id: number,
    currentStatus: string,
    name: string,
  ) => {
    const isBanning = currentStatus === "ACTIVE";
    setConfirmState({
      isOpen: true,
      title: isBanning ? "Khóa tài khoản" : "Mở khóa tài khoản",
      message: `Bạn có chắc chắn muốn ${isBanning ? "KHÓA" : "MỞ KHÓA"} tài khoản của ${name} không?`,
      confirmLabel: isBanning ? "Khóa ngay" : "Mở khóa",
      actionKey: `status-${id}`,
      onConfirm: async () => {
        setIsProcessing(`status-${id}`);
        try {
          await adminApi.toggleUserStatus(id);

          setUsers((prev) =>
            prev.map((u) =>
              u.id === id
                ? { ...u, status: isBanning ? "BANNED" : "ACTIVE" }
                : u,
            ),
          );
          toast.success(
            isBanning
              ? `Đã khóa tài khoản ${name}`
              : `Đã mở khóa tài khoản ${name}`,
          );
        } catch (error) {
          toast.error("Lỗi khi thay đổi trạng thái.");
        } finally {
          setIsProcessing(null);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRoleChange = async (
    id: number,
    currentRole: string,
    name: string,
  ) => {
    const newRole = currentRole === "ROLE_ADMIN" ? "ROLE_USER" : "ROLE_ADMIN";
    setConfirmState({
      isOpen: true,
      title: "Thay đổi quyền hạn",
      message: `Bạn có chắc chắn muốn chuyển quyền của ${name} thành ${newRole} không?`,
      confirmLabel: "Thay đổi",
      actionKey: `role-${id}`,
      onConfirm: async () => {
        setIsProcessing(`role-${id}`);
        try {
          await adminApi.updateUserRole(id, newRole);

          setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, role: newRole as any } : u)),
          );
          toast.success(`Đã cập nhật quyền thành ${newRole}`);
        } catch (error) {
          toast.error("Lỗi khi thay đổi quyền.");
        } finally {
          setIsProcessing(null);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDelete = async (id: number, name: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xóa tài khoản",
      message: `⚠️ NGUY HIỂM: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${name}"? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa vĩnh viễn",
      actionKey: `delete-${id}`,
      onConfirm: async () => {
        setIsProcessing(`delete-${id}`);
        try {
          await adminApi.deleteUser(id);

          setUsers((prev) => prev.filter((u) => u.id !== id));
          toast.success("Đã xóa tài khoản!");
          if (paginatedUsers.length === 1 && currentPage > 1)
            setCurrentPage((p) => p - 1);
        } catch (error) {
          toast.error("Lỗi khi xóa tài khoản.");
        } finally {
          setIsProcessing(null);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-background font-body p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-background flex items-center gap-3">
              <UserCog className="text-primary" size={32} /> Quản lý Tài khoản
            </h1>
            <p className="text-on-surface-variant mt-2">
              Phân quyền, khóa hoặc xóa thành viên trong hệ thống.
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <UserCog
                className="mx-auto text-outline-variant mb-4"
                size={48}
              />
              <h3 className="text-lg font-bold text-on-surface mb-1">
                Không có tài khoản nào
              </h3>
              <p className="text-on-surface-variant">
                Thử tìm với từ khóa khác xem sao.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-variant/30 text-on-surface-variant text-sm border-b border-outline-variant/30">
                    <th className="p-4 font-bold">Người dùng</th>
                    <th className="p-4 font-bold w-40">Vai trò</th>
                    <th className="p-4 font-bold w-32">Trạng thái</th>
                    <th className="p-4 font-bold w-32 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-variant/10 transition-colors"
                    >

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`
                            }
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-on-surface flex items-center gap-2">
                              {user.fullName}
                              {user.id === currentUser?.id && (
                                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <Mail size={12} /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            handleRoleChange(user.id, user.role, user.fullName)
                          }
                          disabled={
                            user.id === currentUser?.id || isProcessing !== null
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.role === "ROLE_ADMIN"
                              ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                              : "bg-surface-variant text-on-surface-variant hover:bg-outline-variant/30"
                          }`}
                          title="Click để đổi quyền"
                        >
                          {isProcessing === `role-${user.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : user.role === "ROLE_ADMIN" ? (
                            <ShieldAlert size={14} />
                          ) : (
                            <Shield size={14} />
                          )}
                          {user.role.replace("ROLE_", "")}
                        </button>
                      </td>

                      <td className="p-4">
                        <span
                          className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.status === "ACTIVE"
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {user.status === "ACTIVE" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Ban size={14} />
                          )}
                          {user.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                user.id,
                                user.status,
                                user.fullName,
                              )
                            }
                            disabled={
                              user.id === currentUser?.id ||
                              isProcessing !== null
                            }
                            className="p-2 text-on-surface-variant hover:text-amber-600 hover:bg-amber-500/10 rounded-xl transition disabled:opacity-30 disabled:hover:bg-transparent"
                            title={
                              user.status === "ACTIVE"
                                ? "Khóa tài khoản"
                                : "Mở khóa tài khoản"
                            }
                          >
                            {isProcessing === `status-${user.id}` ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : user.status === "ACTIVE" ? (
                              <Ban size={18} />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(user.id, user.fullName)}
                            disabled={
                              user.id === currentUser?.id ||
                              isProcessing !== null
                            }
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Xóa vĩnh viễn"
                          >
                            {isProcessing === `delete-${user.id}` ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 p-4 border-t border-outline-variant/30 bg-surface-variant/10">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 rounded-full bg-surface border border-outline-variant/30 hover:bg-surface-variant disabled:opacity-40 transition shadow-sm"
              >
                <ChevronLeft size={20} className="text-on-surface" />
              </button>
              <span className="text-sm font-medium text-on-surface-variant bg-surface px-4 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 rounded-full bg-surface border border-outline-variant/30 hover:bg-surface-variant disabled:opacity-40 transition shadow-sm"
              >
                <ChevronRight size={20} className="text-on-surface" />
              </button>
            </div>
          )}
        </div>
      </div>

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

export default UserManagementPage;
