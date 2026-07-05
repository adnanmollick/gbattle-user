import { useEffect, useState } from "react";

export default function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 250);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => onDone && onDone(), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "radial-gradient(circle at 50% 40%, #1a0a3e 0%, #0a0118 70%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* animated grid bg */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.15,
        backgroundImage: "linear-gradient(rgba(167,139,250,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.3) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "gridmove 2.5s linear infinite",
      }} />

      {/* glow orbs */}
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.4),transparent 70%)", top:"20%", left:"-10%", filter:"blur(40px)", animation:"float1 3s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.35),transparent 70%)", bottom:"15%", right:"-8%", filter:"blur(40px)", animation:"float2 3.5s ease-in-out infinite" }} />

      {/* logo — shine G-BATTLE text (no icon box) */}
      <div style={{
        fontFamily: "Orbitron,sans-serif", fontSize: 46, fontWeight: 900,
        letterSpacing: 4, position: "relative",
        background: "linear-gradient(90deg,#a78bfa,#fff,#7c3aed)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
        opacity: phase >= 1 ? 1 : 0,
        transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        animation: phase >= 1 ? "shine 2s linear infinite" : "none",
        textShadow: "0 0 30px rgba(124,58,237,0.6)",
      }}>
        G-BATTLE
      </div>

      {/* tagline */}
      <div style={{
        marginTop: 14, fontFamily: "Orbitron,sans-serif", fontSize: 11,
        letterSpacing: 6, color: "#a78bfa", textTransform: "uppercase",
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.5s ease",
      }}>
        Battle • Win • Earn
      </div>

      {/* loading bar */}
      <div style={{ marginTop: 40, width: 160, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
          borderRadius: 3, width: phase >= 1 ? "100%" : "0%",
          transition: "width 1.3s ease", boxShadow: "0 0 12px rgba(167,139,250,0.8)",
        }} />
      </div>

      <style>{`
        @keyframes gridmove { to { transform: translateY(40px); } }
        @keyframes shine { to { background-position: 200% center; } }
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,30px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,-20px)} }
      `}</style>
    </div>
  );
}
