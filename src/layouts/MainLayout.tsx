import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import useThemeStore from "@/store/useThemeStore";

export default function MainLayout() {
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
    <div className="min-h-screen flex flex-col bg-background text-on-background transition-colors duration-300">
      <Header />
      <div className="flex flex-1 w-full">
        <main className="flex-1 px-4 md:px-8 py-6 overflow-x-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
