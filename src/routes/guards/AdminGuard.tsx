import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";

export default function AdminGuard() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ROLE_ADMIN") {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}
