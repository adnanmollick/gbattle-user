import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function LoginPrompt({ onClose, message }) {
  const { theme } = useTheme();
  const { exitGuest } = useAuth();

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.cardSolid, borderRadius: 22, padding: "32px 24px",
        maxWidth: 340, width: "100%", textAlign: "center",
        border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow,
      }}>
        <div style={{ fontSize: 50, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 800, fontSize: 18, color: theme.text, marginBottom: 8 }}>
          লগইন প্রয়োজন
        </div>
        <div style={{ color: theme.textDim, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          {message || "এই ফিচার ব্যবহার করতে আপনাকে লগইন করতে হবে।"}
        </div>
        <button onClick={() => { exitGuest(); onClose && onClose(); }} style={{
          width: "100%", background: theme.accentGrad, color: "#fff", border: "none",
          borderRadius: 14, padding: "13px", fontFamily: "Orbitron,sans-serif",
          fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 10,
          boxShadow: "0 6px 18px rgba(124,58,237,0.4)",
        }}>
          লগইন / রেজিস্টার
        </button>
        <button onClick={onClose} style={{
          width: "100%", background: "transparent", color: theme.textFaint,
          border: "none", padding: "8px", fontSize: 12, cursor: "pointer",
        }}>
          পরে করব
        </button>
      </div>
    </div>
  );
}
