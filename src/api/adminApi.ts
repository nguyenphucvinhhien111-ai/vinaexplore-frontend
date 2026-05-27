import axiosClient from "./axiosClient";
import type { Location, LocationEdit } from "@/types/database";

export const adminApi = {
  approveLocation: (id: number) =>
    axiosClient.put<void, Location>(`/locations/${id}/approve`),

  rejectLocation: (id: number) =>
    axiosClient.put<void, Location>(`/locations/${id}/reject`),

  getPendingEdits: () =>
    axiosClient.get<void, LocationEdit[]>("/location-edits/pending"),

  approveEdit: (editId: number) =>
    axiosClient.put<void, string>(`/location-edits/${editId}/approve`),

  rejectEdit: (editId: number) =>
    axiosClient.put<void, string>(`/location-edits/${editId}/reject`),

  getUsers: () => axiosClient.get<void, any[]>("/users"),
  toggleUserStatus: (userId: number) => axiosClient.put<void, string>(`/users/${userId}/toggle-active`),
  updateUserRole: (userId: number, role: string) => axiosClient.put<void, string>(`/users/${userId}/role`, { role }),
  deleteUser: (userId: number) => axiosClient.delete<void, string>(`/users/${userId}`),
  deleteLocation: (id: number) => axiosClient.delete<void, void>(`/locations/${id}`),
};
