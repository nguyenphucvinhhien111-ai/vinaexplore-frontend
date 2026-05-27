import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit(newPassword);
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      <div className="bg-background dark:bg-[#1a1c1e] w-full max-w-[450px] rounded-[32px] p-8 flex flex-col relative z-10 shadow-2xl border border-outline-variant/20 dark:border-gray-800 antialiased overflow-hidden">
        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-3 text-center items-center w-full block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-outline-variant/30 shadow-inner mb-2">
              <ShieldCheck className="w-6 h-6 text-tertiary" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-background tracking-tight">
              Mật khẩu mới
            </h1>

            <p className="text-on-surface-variant font-body text-sm leading-relaxed px-2">
              Mã xác thực hợp lệ! Vui lòng nhập mật khẩu mới cho tài khoản của
              bạn.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 w-full block"
          >
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center">
                <Lock
                  className={`w-5 h-5 absolute left-4 pointer-events-none z-10 ${error ? "text-error" : "text-outline-variant"}`}
                />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Mật khẩu mới..."
                  className={`w-full pl-12 pr-12 py-3.5 bg-surface-container-low border rounded-xl text-on-surface font-body focus:outline-none transition-all placeholder:text-outline-variant/50 ${
                    error
                      ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                      : "border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 text-outline-variant hover:text-on-surface transition-colors cursor-pointer z-10"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center">
                <Lock
                  className={`w-5 h-5 absolute left-4 pointer-events-none z-10 ${error ? "text-error" : "text-outline-variant"}`}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Xác nhận mật khẩu..."
                  className={`w-full pl-12 pr-12 py-3.5 bg-surface-container-low border rounded-xl text-on-surface font-body focus:outline-none transition-all placeholder:text-outline-variant/50 ${
                    error
                      ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                      : "border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-outline-variant hover:text-on-surface transition-colors cursor-pointer z-10"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {error && (
                <span className="text-error text-xs font-medium pl-1 animate-pulse">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-2 py-3.5 px-6 rounded-xl text-on-primary font-headline font-bold text-base transition-all flex justify-center items-center gap-2 shadow-md block ${
                isSubmitting
                  ? "bg-primary/70 cursor-wait"
                  : "bg-primary hover:opacity-90 active:scale-[0.99] cursor-pointer"
              }`}
            >
              <span>
                {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>

            <div className="text-center mt-2 w-full block">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 text-xs font-body font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Hủy bỏ</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
