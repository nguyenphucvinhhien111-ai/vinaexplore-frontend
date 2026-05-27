import { create } from "zustand";
import type { User } from "@/types/database";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (userData: User, token: string) => void;
  logout: () => void;
}

const getInitialToken = () => localStorage.getItem("token");
const getInitialUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken() && !!getInitialUser(),

  login: (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
