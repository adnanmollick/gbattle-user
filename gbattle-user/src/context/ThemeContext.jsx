import { createContext, useContext, useEffect } from "react";

export const theme = {
  // Base
  bg: "#06040f",
  bgGrad: "linear-gradient(135deg, #06040f 0%, #0d0820 50%, #06040f 100%)",
  
  // Glass morphism
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
  glassStrong: "rgba(255, 255, 255, 0.08)",
  glassBorderStrong: "rgba(167, 139, 250, 0.3)",
  
  // Cards
  card: "rgba(255, 255, 255, 0.04)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  cardHover: "rgba(167, 139, 250, 0.08)",
  
  // Primary
  primary: "#a78bfa",
  primaryDeep: "#7c3aed",
  primaryLight: "#c4b5fd",
  
  // Gradients
  grad: "linear-gradient(135deg, #7c3aed, #a78bfa)",
  gradGold: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  gradGreen: "linear-gradient(135deg, #059669, #34d399)",
  gradRed: "linear-gradient(135deg, #dc2626, #f87171)",
  
  // Glow
  glow: "rgba(124, 58, 237, 0.4)",
  glowSoft: "rgba(167, 139, 250, 0.2)",
  
  // Text
  text: "#f5f3ff",
  textDim: "rgba(245, 243, 255, 0.7)",
  textFaint: "rgba(245, 243, 255, 0.4)",
  
  // Status
  green: "#34d399",
  greenBg: "rgba(52, 211, 153, 0.1)",
  greenBorder: "rgba(52, 211, 153, 0.3)",
  red: "#f87171",
  redBg: "rgba(248, 113, 113, 0.1)",
  redBorder: "rgba(248, 113, 113, 0.3)",
  gold: "#fbbf24",
  goldBg: "rgba(251, 191, 36, 0.1)",
  blue: "#60a5fa",
  blueBg: "rgba(96, 165, 250, 0.1)",
  orange: "#fb923c",
  orangeBg: "rgba(251, 146, 60, 0.1)",
  
  // Nav
  navBg: "rgba(6, 4, 15, 0.85)",
  navBorder: "rgba(167, 139, 250, 0.15)",
};

const ThemeContext = createContext(theme);
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.margin = "0";
    document.body.style.fontFamily = "'Hind Siliguri', sans-serif";
    // Load fonts
    if (!document.getElementById("gbattle-fonts")) {
      const link = document.createElement("link");
      link.id = "gbattle-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
