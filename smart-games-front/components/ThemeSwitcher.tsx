"use client";

import { ThemeKey, THEMES } from "@/constants/themes";
import { useTheme } from "@/context/ThemesContext";

export const ThemeSwitcher = () => {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      {availableThemes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          aria-pressed={theme === t.id}
          className={`
            flex justify-between items-center gap-3 rounded-2xl border px-4 py-3
            text-left font-bold transition-colors cursor-pointer
            ${
              theme === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-line bg-surface-3 text-fg hover:border-muted"
            }
          `}
        >
     

            {t.name}

            <div className="flex gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEMES[t.id].colors["--surface-2"] }}>
                <Dot id={t.id} color="--primary"/>
                <Dot id={t.id} color="--secondary"/>
                <Dot id={t.id} color="--surface-3"/>
            </div>

        </button>
      ))}
    </div>
  );
};

type DotProps = {
    id: ThemeKey;
    color: keyof typeof THEMES.dark.colors;
};

const Dot = ({ id, color }: DotProps) => {
    return (
        <span
            className="inline-block h-4 w-4 shrink-0 rounded-full"
            style={{
                backgroundColor: THEMES[id].colors[color],
            }}
        />
    );
};