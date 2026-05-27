import axiosClient from "./axiosClient";
import type { Notification } from "@/types/database";

export const notificationApi = {
  getNotifications: (userId: number) =>
    axiosClient.get<void, Notification[]>(`/notifications/user/${userId}`),

  getUnreadCount: (userId: number) =>
    axiosClient.get<void, number>(`/notifications/user/${userId}/unread-count`),

  markAsRead: (notificationId: number) =>
    axiosClient.put<void, string>(`/notifications/${notificationId}/read`),

  markAllAsRead: (userId: number) =>
    axiosClient.put<void, string>(`/notifications/user/${userId}/read-all`),
};
