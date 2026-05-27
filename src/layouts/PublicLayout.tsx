import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer"; // Import cái mới này
import useThemeStore from "@/store/useThemeStore";

export default function PublicLayout() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background transition-colors duration-300 w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-container-max mx-auto px-4 md:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
