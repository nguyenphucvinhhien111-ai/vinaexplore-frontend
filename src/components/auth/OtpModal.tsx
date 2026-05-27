import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, Unlock, Timer } from "lucide-react";

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  onVerify?: (otp: string) => void;
  onResend?: () => void; 
}

export default function OtpModal({
  isOpen,
  onClose,
  email = "voyager@vinatour.com",
  onVerify,
  onResend,
}: OtpModalProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [timeLeft, setTimeLeft] = useState<number>(300);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);

    if (!isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setTimeLeft(300);
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
 
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, "");
    if (!val && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (onVerify) {
      onVerify(otpString);
    }
  };

  const handleResend = () => {
    if (timeLeft > 0) return;

    setTimeLeft(300); 
    if (onResend) {
      onResend(); 
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      <div className="bg-background dark:bg-[#1a1c1e] w-full max-w-[450px] rounded-[32px] p-8 flex flex-col relative z-10 shadow-2xl border border-outline-variant/20 dark:border-gray-800 antialiased overflow-hidden">
        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-3 text-center items-center w-full block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-outline-variant/30 shadow-inner mb-2">
              <Unlock className="w-6 h-6 text-tertiary" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-background tracking-tight">
              Mã xác thực
            </h1>

            <p className="text-on-surface-variant font-body text-sm leading-relaxed px-2">
              Chúng tôi vừa gửi mã bảo mật 6 chữ số đến email{" "}
              <span className="text-on-surface font-semibold">{email}</span>.
              Vui lòng nhập mã vào bên dưới để xác nhận.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 w-full block"
          >
            <div className="flex justify-between gap-2 w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  placeholder="•"
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-headline font-bold bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline-variant/40"
                />
              ))}
            </div>

            <div className="flex items-center justify-between w-full block px-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Timer className="w-4 h-4 text-outline-variant shrink-0" />
                {/* Hiển thị thời gian đã format */}
                <span
                  className={`font-body tracking-wider text-xs font-medium ${
                    timeLeft === 0 ? "text-error" : ""
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={timeLeft > 0}
                className={`text-xs font-headline font-semibold transition-all ${
                  timeLeft > 0
                    ? "text-outline-variant cursor-not-allowed opacity-70"
                    : "text-tertiary hover:underline cursor-pointer"
                }`}
              >
                Gửi lại mã
              </button>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-6 rounded-xl bg-primary text-on-primary font-headline font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md block"
            >
              <span>Xác thực tài khoản</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="text-center mt-2 w-full block">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-body font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
