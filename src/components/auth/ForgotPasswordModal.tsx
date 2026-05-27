import React, { useState } from "react";
import { ArrowRight, ArrowLeft, KeyRound, Mail } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setEmail("");
      setError("");
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không đúng định dạng");
      return;
    }

    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      onSubmit(email);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      <div className="bg-background dark:bg-[#1a1c1e] w-full max-w-[450px] rounded-[32px] p-8 flex flex-col relative z-10 shadow-2xl border border-outline-variant/20 dark:border-gray-800 antialiased overflow-hidden">
        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-3 text-center items-center w-full block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-outline-variant/30 shadow-inner mb-2">
              <KeyRound className="w-6 h-6 text-tertiary" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-background tracking-tight">
              Quên mật khẩu?
            </h1>

            <p className="text-on-surface-variant font-body text-sm leading-relaxed px-2">
              Đừng lo lắng! Vui lòng nhập địa chỉ email liên kết với tài khoản
              của bạn. Chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 w-full block"
          >
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail
                    className={`w-5 h-5 transition-colors ${error ? "text-error" : "text-outline-variant"}`}
                  />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(""); 
                  }}
                  placeholder="Nhập email của bạn..."
                  className={`w-full pl-11 pr-4 py-3.5 bg-surface-container-low border rounded-xl text-on-surface font-body focus:outline-none transition-all placeholder:text-outline-variant/50 ${
                    error
                      ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                      : "border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
                />
              </div>
              {/* Hiển thị lỗi nếu có */}
              {error && (
                <span className="text-error text-xs font-medium pl-1 animate-pulse">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-2 py-3.5 px-6 rounded-xl text-on-primary font-headline font-bold text-base transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md block ${
                isSubmitting
                  ? "bg-primary/70 cursor-wait"
                  : "bg-primary hover:opacity-90 active:scale-[0.99]"
              }`}
            >
              <span>{isSubmitting ? "Đang xử lý..." : "Nhận mã xác thực"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>

            <div className="text-center mt-2 w-full block">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-body font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại đăng nhập</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
