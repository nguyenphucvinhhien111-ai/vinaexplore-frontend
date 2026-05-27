import type { User } from "@/types/database";
import axiosClient from "./axiosClient";
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateFullNameRequest,
} from "@/types/api";

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient.post<void, string>("/auth/login", data),

  changePassword: (data: ChangePasswordRequest) =>
    axiosClient.post<void, string>("/auth/change-password", data),

  sendRegisterOtp: (data: ForgotPasswordRequest) =>
    axiosClient.post<void, string>("/auth/register-otp", data),

  register: (data: RegisterRequest) =>
    axiosClient.post<void, string>("/auth/register", data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    axiosClient.post<void, string>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosClient.post<void, string>("/auth/reset-password", data),

  updateFullName: (data: UpdateFullNameRequest) =>
    axiosClient.patch<User>("/users/profile/fullname", data),
};
