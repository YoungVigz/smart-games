"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { THEMES, ThemeKey } from "@/constants/themes";

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  availableThemes: { id: ThemeKey; name: string }[];
  getColor: (token: keyof typeof THEMES.dark.colors) => string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "smartgames_theme";

const applyThemeVars = (themeKey: ThemeKey) => {
  const root = document.documentElement;
  const themeColors = THEMES[themeKey].colors;
  
  Object.entries(themeColors).forEach(([cssVar, hexValue]) => {
    root.style.setProperty(cssVar, hexValue);
  });
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    const initialTheme = saved && THEMES[saved] ? saved : "dark";
    
    setThemeState(initialTheme);
    applyThemeVars(initialTheme);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyThemeVars(newTheme);
  };

  const getColor = (token: keyof typeof THEMES.dark.colors): string => {
    return THEMES[theme].colors[token];
  };

  const availableThemes = (Object.keys(THEMES) as ThemeKey[]).map((key) => ({
    id: key,
    name: THEMES[key].name,
  }));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes, getColor }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};