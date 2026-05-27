import { createPortal } from "react-dom";
import { LogIn, ArrowLeft } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
  type?: "login_required";
}

export default function Modal({ isOpen, onClose, onLogin, type }: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      <div className="bg-background dark:bg-[#1a1c1e] w-[calc(100%-2rem)] max-w-[400px] min-w-[300px] rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl z-10 border border-outline-variant/20 dark:border-gray-800 relative antialiased animate-in zoom-in-95 duration-200">
        <div className="w-48 h-48 mb-6 rounded-full overflow-hidden bg-surface flex items-center justify-center relative shadow-sm border border-outline-variant/30">
          <img
            alt="Traveler Illustration"
            className="object-cover w-full h-full opacity-90"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNRG3GcJTpfDLANvThxJEM9YOrfCTDM_zJc9HnOhG2VaZFDTXIMMlyw8mH7w_B_8QsI11yCyRAksPq98muZmT7v4AgtU2Rj2TAaMI8MGShysJJJn6abbDuW2vdNVlM1SiH72wiiUsS8Z7Ybgj7BcEU-vV17D0IxmNY3NyTY4HA8cEcnFJHNFml_oHlpocPNQSEjjQIXepbV_1HjkGbWm6VYCzkQIf-q1AhRUoUerC9D-FAXXH8InISVf9QAUq1Z-DHja9NuxN2QJ_m"
          />
        </div>

        {type === "login_required" ? (
          <h1 className="text-2xl font-bold text-on-background mb-2 font-headline tracking-tight">
            Đăng nhập để trải nghiệm thêm
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-on-background mb-2 font-headline tracking-tight">
            Chào mừng đến với Vinatour
          </h1>
        )}

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={onLogin}
            className="w-full bg-primary text-on-primary font-headline font-bold py-4 px-6 rounded-2xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập
          </button>

          <button
            onClick={onClose}
            className="w-full bg-transparent border border-outline-variant/50 text-on-surface font-body font-medium py-4 px-6 rounded-2xl hover:bg-surface-container-highest transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
