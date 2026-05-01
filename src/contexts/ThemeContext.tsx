import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
interface Ctx {
  theme: Theme;
  toggle: (originX?: number, originY?: number) => void;
}
const ThemeCtx = createContext<Ctx | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("kassa.theme") as Theme | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("kassa.theme", theme);
  }, [theme]);

  const toggle = useCallback((originX?: number, originY?: number) => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const x = originX ?? window.innerWidth / 2;
    const y = originY ?? window.innerHeight / 2;
    root.style.setProperty("--ripple-x", `${x}px`);
    root.style.setProperty("--ripple-y", `${y}px`);

    // @ts-ignore - View Transitions API
    if (typeof document.startViewTransition === "function") {
      // @ts-ignore
      document.startViewTransition(() => setTheme(next));
    } else {
      setTheme(next);
    }
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
