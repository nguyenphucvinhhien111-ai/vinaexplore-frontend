import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { userApi } from "@/api/userApi";
import useAuthStore from "@/store/useAuthStore";

export default function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const processOAuth2 = async () => {
      const token = searchParams.get("token");

      if (token) {
        try {
          localStorage.setItem("token", token);

          const currentUser = await userApi.getMe();
          login(currentUser, token);
          navigate("/feed", { replace: true });
        } catch (error) {
          console.error("Lỗi đồng bộ dữ liệu Google:", error);
          localStorage.removeItem("token");
          navigate("/login?error=oauth2_failed", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    };

    processOAuth2();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B132B] text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-300 animate-pulse font-body">
        Đang đồng bộ tài khoản Google, vui lòng đợi...
      </p>
    </div>
  );
}
