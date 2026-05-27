import axiosClient from "./axiosClient";
import type { User } from "@/types/database";

export const userApi = {
  getAllUsers: () => axiosClient.get<void, User[]>("/users"),

  getMe: () => axiosClient.get<void, User>("/users/me"),
  checkUsernameExists: (username: string) =>
    axiosClient.get<void, boolean>(
      `/users/exists/username?username=${username}`,
    ),

  checkEmailExists: (email: string) =>
    axiosClient.get<void, boolean>(`/users/exists/email?email=${email}`),

  getUserById: (id: number) => axiosClient.get<void, User>(`/users/${id}`),

  updateAvatar: (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return axiosClient.put<void, User>("/users/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  toggleFollow: (followerId: number, followedId: number) =>
    axiosClient.post<void, string>(
      `/followers/${followerId}/follow/${followedId}`,
    ),

  getFollowing: (userId: number) =>
    axiosClient.get<void, User[]>(`/followers/${userId}/following`),

  getFollowers: (userId: number) =>
    axiosClient.get<void, User[]>(`/followers/${userId}/followers`),
};
