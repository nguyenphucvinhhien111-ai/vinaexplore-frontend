import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";

export default function GuestGuard() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}
