import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy bỏ",
  isProcessing = false,
  type = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <AlertTriangle className="text-error w-8 h-8" />,
      button: "bg-error hover:bg-error/90 text-white",
      bg: "bg-error/10",
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500 w-8 h-8" />,
      button: "bg-amber-500 hover:bg-amber-600 text-white",
      bg: "bg-amber-500/10",
    },
    info: {
      icon: <AlertTriangle className="text-primary w-8 h-8" />,
      button: "bg-primary hover:bg-primary/90 text-white",
      bg: "bg-primary/10",
    },
  };

  const style = typeStyles[type];

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-surface w-[calc(100%-2rem)] max-w-md min-w-[280px] rounded-[32px] shadow-2xl overflow-hidden border border-outline-variant/20 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`p-5 rounded-3xl ${style.bg} mb-6`}>
            {style.icon}
          </div>
          
          <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">
            {title}
          </h3>
          
          <p className="text-on-surface-variant text-base leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="p-6 bg-surface-container-low/50 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-on-surface hover:bg-surface-container-highest transition-all disabled:opacity-50 active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 ${style.button}`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
,
    document.body
  );
}
