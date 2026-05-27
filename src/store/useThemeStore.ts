import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  const storedPrefs = localStorage.getItem("theme-preference");
  if (storedPrefs) return storedPrefs as Theme;

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";

  return "light";
};

const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme-preference", newTheme);
      return { theme: newTheme };
    }),
}));

export default useThemeStore;
