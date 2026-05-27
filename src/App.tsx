import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import AppRouter from "./routes/AppRouter";
import useThemeStore from "./store/useThemeStore";
import { WebSocketProvider } from "./contexts/WebSocketContext";

import "react-toastify/dist/ReactToastify.css";
import "leaflet/dist/leaflet.css";

import InteractiveMapModal from "@/components/map/InteractiveMapModal";
import type { LocationEntity } from "@/types/database";

function App() {
  const { theme } = useThemeStore();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<LocationEntity | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const handleOpenMapFromAnywhere = (e: Event) => {
      const customEvent = e as CustomEvent<LocationEntity>;
      setMapTarget(customEvent.detail);
      setIsMapOpen(true);
    };

    window.addEventListener(
      "OPEN_GLOBAL_MAP_ROUTING",
      handleOpenMapFromAnywhere,
    );

    return () => {
      window.removeEventListener(
        "OPEN_GLOBAL_MAP_ROUTING",
        handleOpenMapFromAnywhere,
      );
    };
  }, []);

  return (
    <WebSocketProvider>
      <RouterProvider router={AppRouter} />

      <ToastContainer position="bottom-right" autoClose={3000} theme={theme} />

      <InteractiveMapModal
        isOpen={isMapOpen}
        onClose={() => {
          setIsMapOpen(false);
          setMapTarget(null);
        }}
        targetLocation={mapTarget}
      />
    </WebSocketProvider>
  );
}

export default App;
