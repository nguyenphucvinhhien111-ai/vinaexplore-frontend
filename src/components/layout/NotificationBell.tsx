import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { notificationApi } from "@/api/notificationApi";
import useAuthStore from "@/store/useAuthStore";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, setNotifications } = useWebSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res: any = await notificationApi.getNotifications(user.id);
        if (res) {
          setNotifications(res);
        }
      } catch (err) {
        console.error("Lỗi lấy thông báo", err);
      }
    };
    fetchNotifications();

    // Lắng nghe click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationApi.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateString: string) => {
    // Đảm bảo UTC time được convert đúng sang local time
    const utcDateString = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
    const date = new Date(utcDateString);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-outline hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-surface font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-[70px] left-4 right-4 sm:absolute sm:top-auto sm:right-0 sm:left-auto mt-2 sm:w-96 bg-surface border border-outline-variant/30 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
            <h3 className="font-bold text-on-surface">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <Check size={14} /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant text-sm">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-outline-variant/10 hover:bg-surface-container-highest transition-colors ${!notif.isRead ? "bg-primary/5" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm text-on-surface ${!notif.isRead ? "font-semibold" : ""}`}
                      >
                        {notif.message}
                      </p>
                      <span className="text-xs text-on-surface-variant mt-1 block">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 shrink-0"
                        title="Đánh dấu đã đọc"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
