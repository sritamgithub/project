import { create } from "zustand";

type ThemeState = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};

export const useTheme = create<ThemeState>((set) => ({
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  },
}));

// Initialize theme from localStorage or system preference
export function initializeTheme() {
  const stored = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  const theme = stored
    ? (stored as "light" | "dark")
    : systemPrefersDark
      ? "dark"
      : "light";
  useTheme.getState().setTheme(theme);
}
