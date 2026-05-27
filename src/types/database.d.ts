// src/types/database.d.ts

export type Role = "ROLE_USER" | "ROLE_ADMIN";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface LocationEntity {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  status: ApprovalStatus;
  checkinCount: number;
  createdAt: string;
  updatedAt: string;
  creatorUsername?: string;
  creatorId?: number;
  creatorAvatarUrl?: string;
  creatorFullName?: string;
  author?: User; 
  tags?: Tag[]; 
  rating: number; 
  reviewsCount: number; 
  favoriteCount: number; 
  reviews?: Review[];
}

export interface LocationEdit {
  id: number;
  locationId: number;
  userId: number;
  newName: string | null;
  newDescription: string | null;
  newAddress: string | null;
  newLatitude: number | null;
  newLongitude: number | null;
  newCoverImage: string | null;
  status: ApprovalStatus;
  createdAt: string;
  originalLocation?: LocationEntity;
  author?: User;
  newTags?: Tag[];
}

export interface Review {
  id: number;
  locationId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  creatorUsername: string;
  creatorId: number;
  creatorAvatar: string | null;
  creatorFullName: string | null;

  location?: LocationEntity;
}

export interface Checkin {
  id: number;
  userId: number;
  locationId: number;
  actualLatitude: number;
  actualLongitude: number;
  checkinDate: string;
  location?: LocationEntity;
}

export interface Notification {
  id: number;
  userId: number;
  senderId: number | null;
  type: string; 
  referenceId: number | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}
