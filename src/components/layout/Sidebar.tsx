import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Clock3,
  PlusCircle,
  UserCircle2,
  Info,
  Hourglass,
  MessageCircleMore,
  X,
  Filter,
  ChevronDown,
  Map,
  Users,
  MapPinned,
  ClipboardCheck,
} from "lucide-react";
import InteractiveMapModal from "@/components/map/InteractiveMapModal";

import useFilterStore from "@/store/useFilterStore";
import { PROVINCES } from "@/utils/constants";
import useAuthStore from "@/store/useAuthStore";
import { CreateLocationModal } from "../auth/CreateLocationModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation(); // Lấy pathname hiện tại để active menu
  const { selectedTagId, setTagId } = useFilterStore();
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  const isAdmin = user?.role === "ROLE_ADMIN";

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProvinceName =
    PROVINCES.find((p) => p.id === selectedTagId)?.name ||
    "Chọn Tỉnh/Thành phố";

  const navItems = [
    {
      label: "Trang chủ",
      icon: Home,
      path: isLoggedIn ? "/feed" : "/",
      public: true,
    },
    { label: "Khám phá", icon: Compass, path: "/explore", public: false },
    {
      label: "Lịch sử check-in",
      icon: Clock3,
      path: "/checkin-history",
      public: false,
    },
    {
      label: "Đánh giá của tôi",
      icon: MessageCircleMore,
      path: "/review-history",
      public: false,
    },
    {
      label: "Đang chờ duyệt",
      icon: Hourglass,
      path: "/pending-locations",
      public: false,
    },
    {
      label: "Tạo địa điểm",
      icon: PlusCircle,
      path: "/create-location",
      public: false,
      isAction: true,
    },
    {
      label: "Trang cá nhân",
      icon: UserCircle2,
      path: "/profile",
      public: false,
    },
    {
      label: "Giới thiệu",
      icon: Info,
      path: "https://www.facebook.com/profile.php?id=61589645975356",
      public: true,
      external: true,
    },
  ];

  const adminNavItems = [
    { label: "Quản lý tài khoản", icon: Users, path: "/admin/users" },
    { label: "Quản lý địa điểm", icon: MapPinned, path: "/admin/locations" },
    {
      label: "Xét duyệt địa điểm",
      icon: ClipboardCheck,
      path: "/admin/approvals",
    },
  ];

  const visibleNavItems = isLoggedIn
    ? navItems
    : navItems.filter((item) => item.public);

  return (
    <>
      <InteractiveMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />
      <CreateLocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          console.log("Đã đề xuất địa điểm thành công!");
        }}
      />

      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 h-screen w-80 bg-surface/90 backdrop-blur-2xl border-r border-outline-variant/20 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col px-4 py-6 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        <div className="flex items-start justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-primary tracking-tight">
              VinaExplore
            </h2>
            <span className="text-xs text-on-surface-variant font-medium mt-1">
              Hành trình khám phá Việt Nam
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
          <div className="mb-6 relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 mb-3 px-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-on-surface">
                LỌC ĐỊA ĐIỂM
              </span>
            </div>

            <div className="px-2">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-all text-left"
              >
                <span className="truncate">{selectedProvinceName}</span>
                <ChevronDown
                  className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-2 right-2 mt-2 py-2 bg-surface border border-outline-variant rounded-xl shadow-2xl z-[80] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-150">
                  <div
                    onClick={() => {
                      setTagId("All");
                      setIsDropdownOpen(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-primary/10 ${selectedTagId === "All" ? "text-primary font-bold bg-primary-container/20" : "text-on-surface"}`}
                  >
                    Tất cả Tỉnh/Thành phố
                  </div>
                  {PROVINCES.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setTagId(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-4 py-3 text-sm cursor-pointer transition-colors ${selectedTagId === p.id ? "bg-primary text-on-primary font-bold" : "text-on-surface hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-8 px-2">
            <div
              onClick={() => setIsMapOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-outline-variant/30 h-48 group cursor-pointer shadow-sm"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC09Wq1q-7EaJ7a2_RAnXmXuOm3oDIbF5-xhrxLsQvcf4sLnoxs0qTUOKqyf0DAN8qq7JHAe1xHMGxES_S-OFa5fx0DHa5HFKU3S4uAUgM1M2EbypBAVjVmUMj9TWRII84HOvu8yLyrwoLRcULy5v8X4_ZNKQpJBEb3hmJOvYgH390tKXn5u2zbqpv9vgNVWoW82duu2WvupBHOnuiEXObVOq3d3Gziyhrk3n1P3otz-SBTw7cpye_ZjiZf03yQcy33t99zhq697Fsj"
                alt="Vietnam Map"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-white font-bold text-lg">Mở bản đồ</span>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Map className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="mt-4 w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-full font-semibold shadow-md transition-colors cursor-pointer"
            >
              Xem bản đồ tương tác
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item, index) => {
              const Icon = item.icon;

              if (item.isAction) {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-on-surface-variant hover:bg-surface-container-highest hover:text-primary text-left"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              }

              if (item.external) {
                return (
                  <a
                    key={index}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </a>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${location.pathname === item.path ? "fill-current" : ""}`}
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {isAdmin && (
            <div className="mt-8 mb-4 border-t border-outline-variant/30 pt-6">
              <div className="px-4 mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  QUẢN TRỊ VIÊN
                </span>
              </div>

              <nav className="flex flex-col gap-1 pb-10">
                {adminNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={`admin-${index}`}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? "fill-current" : ""}`}
                      />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
