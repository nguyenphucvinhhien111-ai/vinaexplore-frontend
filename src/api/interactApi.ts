import axiosClient from "./axiosClient";
import type { Location, Review, Checkin } from "@/types/database";
import type { CheckinRequest, ReviewRequest } from "@/types/api";

export const interactApi = {
  // --- CHECKIN ---
  createCheckin: (data: CheckinRequest) =>
    axiosClient.post<void, Checkin>("/checkins", data),
  getCheckinHistory: () =>
    axiosClient.get<void, Checkin[]>("/checkins/history"),

  // --- FAVORITES ---
  getFavorites: (userId: number) =>
    axiosClient.get<void, Location[]>(`/favorites/user/${userId}`),
  toggleFavorite: (userId: number, locationId: number) =>
    axiosClient.post<void, number>(
      `/favorites/user/${userId}/location/${locationId}`,
    ),
  getFavoriteCountByLocation: (locationId: number) =>
    axiosClient.get<void, number>(`/favorites/location/${locationId}/count`),

  // --- REVIEWS ---
  getReviewsByUser: (userId: number) =>
    axiosClient.get<void, Review[]>(`/reviews/user/${userId}`),
  getReviewsByLocation: (locationId: number) =>
    axiosClient.get<void, Review[]>(`/reviews/location/${locationId}`),
  createReview: (data: ReviewRequest) =>
    axiosClient.post<void, Review>("/reviews", data),
  updateReview: (id: number, data: Partial<ReviewRequest>) =>
    axiosClient.put<void, Review>(`/reviews/${id}`, data),
  deleteReview: (id: number) =>
    axiosClient.delete<void, void>(`/reviews/${id}`),

  // --- FOLLOWS ---

  toggleFollow: (followerId: number, followedId: number) =>
    axiosClient.post<void, string>(
      `/followers/${followerId}/follow/${followedId}`,
    ),

  getFollowing: (userId: number) =>
    axiosClient.get<void, any[]>(`/followers/${userId}/following`),

  getFollowers: (userId: number) =>
    axiosClient.get<void, any[]>(`/followers/${userId}/followers`),
};
