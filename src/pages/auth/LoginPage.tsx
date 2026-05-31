import React, { useState } from "react";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Compass,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { userApi } from "@/api/userApi";
import useAuthStore from "@/store/useAuthStore";
import type { LoginRequest } from "@/types/api";
import { toast } from "react-toastify";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import OtpModal from "@/components/auth/OtpModal";
import ResetPasswordModal from "@/components/auth/ResetPasswordModal";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");

  const handleForgotPasswordSubmit = async (email: string) => {
    try {
      await authApi.forgotPassword({ email }); 

      setResetEmail(email);
      setIsForgotModalOpen(false);
      setIsOtpModalOpen(true);
      toast.success(`Đã gửi mã xác thực đến ${email}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể gửi mã xác thực. Vui lòng thử lại!",
      );
    }
  };

  const handleVerifyOtp = (otp: string) => {
    setResetOtp(otp);
    setIsOtpModalOpen(false);
    setIsResetModalOpen(true);
  };

  const handleResendOtp = async () => {
    try {
      await authApi.forgotPassword({ email: resetEmail });
      toast.success("Đã gửi lại mã xác thực mới!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi gửi lại mã!");
    }
  };

  const handleResetPasswordSubmit = async (newPassword: string) => {
    try {
      await authApi.resetPassword({
        email: resetEmail,
        otp: resetOtp,
        newPassword: newPassword,
      });

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setIsResetModalOpen(false);

      setUsername(resetEmail);
      setPassword("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Đổi mật khẩu thất bại, mã xác thực có thể đã hết hạn.",
      );
      setIsResetModalOpen(false);
      setIsOtpModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const loginPayload: LoginRequest = { username, password };
      const token = await authApi.login(loginPayload);

      if (token) {
        localStorage.setItem("token", token);
        const currentUser = await userApi.getMe();
        toast.success("Đăng nhập thành công! Chào mừng trở lại 🎉");
        login(currentUser, token);
        navigate("/feed", { replace: true });
      }
    } catch (error: any) {
      localStorage.removeItem("token");
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-background font-body antialiased relative">
      <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 relative overflow-x-hidden">
        <div className="hidden lg:flex relative p-12 items-center justify-center overflow-hidden w-full h-full select-none">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img
            alt="Vinatour background"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop"
          />
          <div className="relative z-20 w-full max-w-lg min-w-[380px] shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 flex flex-col gap-6 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2.5 rounded-xl text-white shadow-inner">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-headline font-bold tracking-wider uppercase">
                VINAEXPLORE
              </h2>
            </div>
            <h1 className="text-4xl lg:text-5xl font-headline font-extrabold leading-tight drop-shadow-sm">
              Khám phá vẻ đẹp <br />
              <span className="text-primary font-black block mt-2 drop-shadow">
                Bất tận.
              </span>
            </h1>
            <p className="text-white/90 font-body text-base leading-relaxed">
              Cùng nhau khám phá những trải nghiệm du lịch độc đáo và đáng nhớ
              nhất tại Việt Nam.
            </p>
          </div>
        <div className="flex items-center justify-center p-6 sm:p-12 bg-background relative z-10 w-full">
          <div className="w-full max-w-md min-w-[320px] sm:min-w-[400px] shrink-0 flex flex-col gap-6 mx-auto">
            <div className="flex flex-col gap-2 text-center lg:text-left block w-full">
              <h1 className="text-3xl font-headline font-bold text-on-background whitespace-nowrap">
                Chào mừng trở lại
              </h1>
              <p className="text-on-surface-variant font-body text-sm">
                Đăng nhập để tiếp tục hành trình của bạn
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-body animate-fade-in">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 w-full block"
            >
              <div className="flex flex-col gap-2 w-full block">
                <label
                  htmlFor="username"
                  className="block text-xs font-headline font-semibold text-on-surface-variant uppercase"
                >
                  Tên đăng nhập
                </label>
                <div className="relative flex items-center block w-full">
                  <UserIcon className="w-5 h-5 absolute left-4 text-outline-variant pointer-events-none z-10" />
                  <input
                    id="username"
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="Nhập tên đăng nhập..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 text-on-surface font-body text-sm placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full block">
                <div className="flex justify-between items-center block w-full">
                  <label
                    htmlFor="password"
                    className="block text-xs font-headline font-semibold text-on-surface-variant uppercase"
                  >
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-body text-primary hover:underline shrink-0 pl-2 cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative flex items-center block w-full">
                  <Lock className="w-5 h-5 absolute left-4 text-outline-variant pointer-events-none z-10" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-12 text-on-surface font-body text-sm placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-outline-variant hover:text-on-surface transition-colors cursor-pointer z-10 disabled:opacity-60"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-start mt-1 w-full block">
                <input
                  id="remember-me"
                  type="checkbox"
                  disabled={isLoading}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer bg-surface disabled:opacity-60"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm font-body text-on-surface-variant cursor-pointer"
                >
                  Duy trì đăng nhập
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-6 rounded-xl bg-primary text-on-primary font-headline font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md block disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center w-full block">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="mx-4 text-xs font-body text-outline-variant uppercase tracking-wider shrink-0">
                Hoặc đăng nhập bằng
              </span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            <div className="flex gap-3 w-full block">
              <button
                type="button"
                onClick={() => {
                  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
                  const baseUrl = apiUrl.replace(/\/api$/, "");
                  window.location.href = `${baseUrl}/oauth2/authorization/google`;
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface border border-outline-variant/30 hover:bg-surface-variant transition-colors text-on-surface font-body text-sm font-medium cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="whitespace-nowrap">Google</span>
              </button>
            </div>

            <p className="text-center font-body text-sm text-on-surface-variant block w-full">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-headline font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSubmit={handleForgotPasswordSubmit}
      />

      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        email={resetEmail}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSubmit={handleResetPasswordSubmit}
      />
    </div>
  );
}
