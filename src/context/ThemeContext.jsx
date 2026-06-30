import { createContext, useContext, useState, useEffect } from "react";

const THEMES = {
  purple: {
    name: "purple",
    bg: "#0b0a14",
    bgGrad: "linear-gradient(180deg,#0d0b1a 0%,#0b0a14 100%)",
    card: "rgba(255,255,255,0.05)",
    cardBorder: "rgba(255,255,255,0.08)",
    cardSolid: "#16131f",
    inputBg: "rgba(255,255,255,0.07)",
    inputBorder: "rgba(255,255,255,0.12)",
    text: "#f1eefb",
    textDim: "rgba(241,238,251,0.7)",
    textFaint: "rgba(241,238,251,0.38)",
    primary: "#a78bfa",
    primaryDeep: "#7c3aed",
    accentGrad: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    accentGlow: "rgba(124,58,237,0.35)",
    heroGrad: "linear-gradient(135deg,#4c1d95,#7c3aed)",
    navBg: "rgba(13,11,26,0.92)",
    navActive: "#a78bfa",
    navInactive: "rgba(241,238,251,0.4)",
    topbar: "rgba(13,11,26,0.85)",
  },
  red: {
    name: "red",
    bg: "#100708",
    bgGrad: "linear-gradient(180deg,#1a0a0c 0%,#100708 100%)",
    card: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(244,63,94,0.15)",
    cardSolid: "#1c1012",
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(244,63,94,0.22)",
    text: "#fdeef0",
    textDim: "rgba(253,238,240,0.7)",
    textFaint: "rgba(253,238,240,0.4)",
    primary: "#fb7185",
    primaryDeep: "#e11d48",
    accentGrad: "linear-gradient(135deg,#be123c,#fb7185)",
    accentGlow: "rgba(225,29,72,0.4)",
    heroGrad: "linear-gradient(135deg,#7f1d1d,#be123c)",
    navBg: "rgba(26,10,12,0.94)",
    navActive: "#fb7185",
    navInactive: "rgba(253,238,240,0.4)",
    topbar: "rgba(26,10,12,0.88)",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("gbattle_theme") || "purple");
  const theme = THEMES[mode] || THEMES.purple;

  const toggleTheme = () => {
    const next = mode === "purple" ? "red" : "purple";
    setMode(next);
    localStorage.setItem("gbattle_theme", next);
  };

  useEffect(() => {
    if (!document.getElementById("hind-font")) {
      const link = document.createElement("link");
      link.id = "hind-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Orbitron:wght@400;700;800;900&display=swap";
      document.head.appendChild(link);
    }
    document.body.style.background = theme.bg;
  }, [theme.bg]);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
