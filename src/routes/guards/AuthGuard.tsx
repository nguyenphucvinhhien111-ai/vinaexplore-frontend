import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";

export default function AuthGuard() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
