import React, { useState } from "react";
import { Mail, Lock, User, Compass, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authApi } from "@/api/authApi";
import OtpModal from "@/components/auth/OtpModal";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.warning("Vui lòng đồng ý với Điều khoản & Chính sách!");
      return;
    }

    try {
      setIsLoading(true);
      await authApi.sendRegisterOtp({ email });

      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setIsOtpModalOpen(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi mã OTP!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setIsLoading(true);

      await authApi.register({
        username,
        email,
        password,
        otp,
      });

      toast.success("Đăng ký thành công! Đăng nhập đi quẩy thôi 🎉");
      setIsOtpModalOpen(false);
      navigate("/login");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-background font-body antialiased">
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
        </div>
        <div className="flex items-start justify-center pt-16 pb-12 sm:pt-20 px-6 sm:px-12 bg-background relative z-10 w-full overflow-y-auto">
          <div className="w-full max-w-md min-w-[320px] sm:min-w-[400px] shrink-0 flex flex-col gap-6 mx-auto">
            <div className="flex gap-3 w-full block">
              <button
                type="button"
                onClick={() => {
                  const apiUrl =
                    import.meta.env.VITE_API_URL || "http://localhost:8080/api";
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

            <div className="relative flex items-center w-full block">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="mx-4 text-xs font-body text-outline-variant uppercase tracking-wider shrink-0">
                Hoặc đăng ký bằng email
              </span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            <form
              onSubmit={handleSendOtp}
              className="flex flex-col gap-4 w-full block"
            >
              <div className="flex flex-col gap-2 w-full block">
                <label
                  htmlFor="name"
                  className="block text-xs font-headline font-semibold text-on-surface-variant uppercase"
                >
                  Tên đăng nhập
                </label>
                <div className="relative flex items-center block w-full">
                  <User className="w-5 h-5 absolute left-4 text-outline-variant pointer-events-none z-10" />
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 text-on-surface font-body text-sm placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full block">
                <label
                  htmlFor="email"
                  className="block text-xs font-headline font-semibold text-on-surface-variant uppercase"
                >
                  Địa chỉ Email
                </label>
                <div className="relative flex items-center block w-full">
                  <Mail className="w-5 h-5 absolute left-4 text-outline-variant pointer-events-none z-10" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@vinatour.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 text-on-surface font-body text-sm placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full block">
                <label
                  htmlFor="password"
                  className="block text-xs font-headline font-semibold text-on-surface-variant uppercase"
                >
                  Mật khẩu
                </label>
                <div className="relative flex items-center block w-full">
                  <Lock className="w-5 h-5 absolute left-4 text-outline-variant pointer-events-none z-10" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 text-on-surface font-body text-sm placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-outline-variant font-body block">
                  Mật khẩu phải có ít nhất 8 ký tự.
                </p>
              </div>

              <div className="flex items-start justify-start mt-1 w-full block">
                <input
                  id="agree-terms"
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer bg-surface shrink-0"
                />
                <label
                  htmlFor="agree-terms"
                  className="ml-2 block text-xs font-body text-on-surface-variant cursor-pointer leading-tight"
                >
                  Tôi đồng ý với{" "}
                  <a
                    href="#terms"
                    className="text-primary hover:underline font-semibold"
                  >
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a
                    href="#privacy"
                    className="text-primary hover:underline font-semibold"
                  >
                    Chính sách bảo mật
                  </a>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-6 rounded-xl bg-primary text-on-primary font-headline font-bold text-base hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-md block"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center font-body text-sm text-on-surface-variant block w-full">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-headline font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </main>

      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        email={email}
        onVerify={handleVerifyOtp}
      />
    </div>
  );
}
