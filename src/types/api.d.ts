// src/types/api.d.ts

// --- AUTH REQUESTS ---
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface UpdateFullNameRequest {
  fullName: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// --- LOCATION REQUESTS ---
export interface LocationRequest {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  tagIds?: number[]; 
}

export interface LocationEditRequest {
  newName?: string;
  newDescription?: string;
  newAddress?: string;
  newLatitude?: number;
  newLongitude?: number;
  newTagIds?: number[];
}

// --- INTERACT REQUESTS ---
export interface CheckinRequest {
  userId: number;
  locationId: number;
  actualLatitude: number;
  actualLongitude: number;
}

export interface ReviewRequest {
  comment: string;
  rating: number;
  locationId: number;
  userId: number;
}

export interface TagRequest {
  name: string;
}
