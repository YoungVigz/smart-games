"use client";

import { useTheme } from "@/context/ThemesContext";
import { useConsoleStore } from "@/stores/useConsoleStore";
import { Palette } from "lucide-react";

export default function ThemeButton() {
  const { theme } = useTheme();
  const openConsole = useConsoleStore((state) => state.open);

  return (
    <div onClick={() => openConsole("themes")} className="flex items-center gap-2 bg-surface-3 hover:bg-surface-1 hover:border-primary py-1.5 px-4 rounded-2xl border border-border cursor-pointer">
      <Palette size={16} className="text-text-muted" />
      <div className="font-bold">{theme.toUpperCase()}</div>
    </div>
  );
}