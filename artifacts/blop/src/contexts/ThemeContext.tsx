import { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme = "indigo" | "forest" | "cognac" | "espresso" | "gold" | "rose" | "ocean" | "obsidian";
export type AppMode = "light" | "dark" | "system";

export const THEME_DEFINITIONS: Record<ColorTheme, { name: string; description: string; primaryHsl: string; accentHsl: string; chartPalette: string[] }> = {
  indigo:   { name: "Indigo",    description: "Premium deep indigo",    primaryHsl: "243 76% 52%", accentHsl: "270 75% 65%", chartPalette: ["#4040d8","#8838d0","#5058f0","#a060e8","#3028c0","#7050d8","#9020e0"] },
  forest:   { name: "Forest",    description: "Deep finance green",      primaryHsl: "158 52% 24%", accentHsl: "14 85% 62%",  chartPalette: ["#2d8a62","#e8784e","#66b88a","#d4a030","#4aacac","#c47858","#9abe9a"] },
  cognac:   { name: "Cognac",    description: "Rich warm brown",         primaryHsl: "20 58% 28%",  accentHsl: "38 88% 52%",  chartPalette: ["#8a3c1a","#e09030","#b06838","#c4b440","#9a5c30","#e0a870","#c08870"] },
  espresso: { name: "Espresso",  description: "Dark coffee & caramel",   primaryHsl: "25 38% 20%",  accentHsl: "42 82% 50%",  chartPalette: ["#6a3820","#c89030","#8a5838","#b0a030","#7a4828","#d0b870","#9a7858"] },
  gold:     { name: "Gold Rush", description: "Antique gold & copper",   primaryHsl: "42 65% 32%",  accentHsl: "18 78% 52%",  chartPalette: ["#8a6820","#c84830","#b08830","#e07840","#9a7828","#d4a838","#d07858"] },
  rose:     { name: "Rose",      description: "Dusty mauve & blush",     primaryHsl: "340 45% 35%", accentHsl: "10 80% 60%",  chartPalette: ["#8a3850","#d07848","#b04868","#c88870","#9a2860","#d09870","#c07888"] },
  ocean:    { name: "Ocean",     description: "Deep navy & teal",        primaryHsl: "215 55% 30%", accentHsl: "185 65% 42%", chartPalette: ["#2a4898","#28a0a0","#3a68c8","#30b8b8","#1a3880","#4890b0","#3080a0"] },
  obsidian: { name: "Obsidian",  description: "Charcoal & purple",       primaryHsl: "248 45% 35%", accentHsl: "280 60% 58%", chartPalette: ["#5038a8","#9838c0","#6050d0","#a858d8","#3828a0","#7850c8","#c040d0"] },
};

interface ThemeContextValue {
  colorTheme: ColorTheme;
  mode: AppMode;
  setColorTheme: (t: ColorTheme) => void;
  setMode: (m: AppMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorTheme: "indigo",
  mode: "light",
  setColorTheme: () => {},
  setMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(
    () => (localStorage.getItem("blop-color-theme") as ColorTheme) ?? "indigo"
  );
  const [mode, setModeState] = useState<AppMode>(
    () => (localStorage.getItem("blop-mode") as AppMode) ?? "light"
  );
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", colorTheme);

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && prefersDark.matches);
      setIsDark(dark);
      root.classList.toggle("dark", dark);

      // Sync native status bar style and background color
      if (window.hasOwnProperty("Capacitor")) {
        import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
          StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
          StatusBar.setBackgroundColor({ color: dark ? "#06060F" : "#F7F7FA" }).catch(() => {});
        });
      }
    };

    apply();
    prefersDark.addEventListener("change", apply);
    return () => prefersDark.removeEventListener("change", apply);
  }, [colorTheme, mode]);

  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t);
    localStorage.setItem("blop-color-theme", t);
  };

  const setMode = (m: AppMode) => {
    setModeState(m);
    localStorage.setItem("blop-mode", m);
  };

  return (
    <ThemeContext.Provider value={{ colorTheme, mode, setColorTheme, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
