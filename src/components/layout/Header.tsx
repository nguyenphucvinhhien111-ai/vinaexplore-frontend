import { Link } from "react-router-dom";
import { useState } from "react";
import { Sun, Moon, Menu } from "lucide-react";
import useThemeStore from "@/store/useThemeStore";
import SearchBar from "./SmartSearchbar";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <header className="bg-surface/90 backdrop-blur-md text-primary font-body-md sticky top-0 z-50 border-b border-surface-container shadow-sm">

        <div className="flex justify-between items-center w-full px-4 md:px-8 py-3 max-w-container-max mx-auto gap-2 md:gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link
              to={isLoggedIn ? "/feed" : "/"}
              className="text-xl md:text-2xl font-black tracking-tight text-primary"
            >
              VinaExplore
            </Link>
          </div>
          <div className="flex-1 max-w-2xl hidden lg:block px-4">
            <SearchBar />
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="text-outline hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
              title="Đổi giao diện"
            >
              {theme === "light" ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} className="text-tertiary-fixed-dim" />
              )}
            </button>
            {isLoggedIn && <NotificationBell />}

            <div className="h-6 w-[1px] bg-outline-variant mx-1" />
            <div className="flex items-center gap-1">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="bg-primary text-on-primary font-label-md text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-surface-tint transition-colors shadow-md whitespace-nowrap"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-primary font-label-md text-sm md:text-base px-2 md:px-3 py-2 hover:bg-surface-container rounded-lg transition-colors"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="bg-primary text-on-primary font-label-md text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-surface-tint transition-colors shadow-md whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="lg:hidden px-4 pb-3 w-full">
          <SearchBar />
        </div>
      </header>
    </>
  );
}
