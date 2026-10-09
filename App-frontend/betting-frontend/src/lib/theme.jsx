import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pryzm-theme";
const ThemeCtx = createContext(null);

function readTheme() {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t === "light" || t === "dark") return t;
  } catch { /* storage unavailable */ }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
