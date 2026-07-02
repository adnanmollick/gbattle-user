import { useState, useEffect } from "react";
export default function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => onDone && onDone(), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"#06040f", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, flexDirection:"column" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)" }}></div>
      <div style={{ transform:`scale(${phase>=1?1:0.5})`, opacity:phase>=1?1:0, transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)", textAlign:"center", position:"relative" }}>
        <div style={{ width:80, height:80, borderRadius:24, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 16px", boxShadow:"0 0 40px rgba(124,58,237,0.6)" }}>⚡</div>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:28, fontWeight:900, color:"#fff", letterSpacing:3, textShadow:"0 0 20px rgba(167,139,250,0.8)" }}>G-BATTLE</div>
        <div style={{ fontSize:11, color:"rgba(167,139,250,0.7)", letterSpacing:4, marginTop:4, fontFamily:"Orbitron,sans-serif" }}>FREE FIRE TOURNAMENT</div>
      </div>
      <div style={{ position:"absolute", bottom:60, opacity:phase>=2?1:0, transition:"opacity 0.4s ease" }}>
        <div style={{ display:"flex", gap:6 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", animation:`dot 1s ease ${i*0.2}s infinite` }}></div>
          ))}
        </div>
      </div>
      <style>{`@keyframes dot{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}
