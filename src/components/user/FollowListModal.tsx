import { createPortal } from "react-dom";
import { X, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@/types/database";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
}

export default function FollowListModal({ isOpen, onClose, title, users }: FollowListModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface w-full max-w-md min-w-[320px] md:min-w-[400px] rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 bg-surface z-10">
          <div className="w-8"></div>
          <h3 className="text-lg font-bold text-on-surface font-headline">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh] p-4 flex flex-col gap-4 bg-surface">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant gap-2">
              <UserIcon className="w-10 h-10 opacity-50" />
              <p className="text-sm font-body">Không có người dùng nào</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3">
                <Link 
                  to={`/profile/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.username} 
                      className="w-11 h-11 rounded-full object-cover border border-outline-variant/30 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-on-surface-variant" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-on-surface truncate">
                      {user.username}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {user.fullName || user.username}
                    </span>
                  </div>
                </Link>
                <Link
                  to={`/profile/${user.id}`}
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-surface-variant hover:bg-outline-variant/30 text-on-surface text-sm font-semibold transition-colors shrink-0"
                >
                  Xem
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
