"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = useCallback((nextTheme: Theme) => {
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : getSystemTheme();

    applyTheme(initialTheme);
    const timer = window.setTimeout(() => setThemeState(initialTheme), 0);

    return () => window.clearTimeout(timer);
  }, [applyTheme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      window.localStorage.setItem("theme", nextTheme);
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    },
    [applyTheme],
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside Providers");
  }

  return context;
}
