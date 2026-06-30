import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

export function ResultsPage() {
  const { theme } = useTheme();
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,"results"), orderBy("createdAt","desc")),
      snap => setResults(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    return unsub;
  }, []);

  return (
    <div style={{ padding:"16px 18px", fontFamily:"'Hind Siliguri',sans-serif" }}>
      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:700, marginBottom:16, color:theme.text }}>🏆 ফলাফল</div>
      {results.length===0 ? (
        <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:14, padding:40, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
          <div style={{ color:theme.textFaint, fontSize:13 }}>কোনো ফলাফল নেই</div>
        </div>
      ) : results.map(r=>(
        <div key={r.id} onClick={()=>setSelected(r)} style={{ background:theme.card, border:`1.5px solid ${theme.cardBorder}`, borderRadius:16, padding:16, marginBottom:14, cursor:"pointer" }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, marginBottom:4, color:theme.text }}>{r.matchTitle}</div>
          <div style={{ fontSize:11, color:theme.textFaint, marginBottom:10 }}>{new Date(r.createdAt).toLocaleDateString("bn-BD")}</div>
          {(r.winners||[]).slice(0,3).map((w,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${theme.cardBorder}` }}>
              <span style={{ fontSize:13, color:theme.text }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"🎖️"} {w.name}</span>
              <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#4ade80" }}>৳{formatBalance(w.prize)}</span>
            </div>
          ))}
          <div style={{ fontSize:11, color:theme.primary, marginTop:8, textAlign:"right" }}>বিস্তারিত দেখুন →</div>
        </div>
      ))}

      {/* DETAIL MODAL */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:20, padding:24, width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto" }}>
            {/* CONGRATULATIONS HEADER */}
            <div style={{ textAlign:"center", marginBottom:20, background:theme.accentGrad, borderRadius:16, padding:"20px 16px" }}>
              <div style={{ fontSize:40, marginBottom:8, animation:"bounce 1s ease infinite" }}>🎉</div>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:900, color:"#fff", letterSpacing:1 }}>CONGRATULATIONS!</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:4, fontFamily:"'Hind Siliguri',sans-serif" }}>{selected.matchTitle}</div>
            </div>

            {/* WINNERS */}
            {(selected.winners||[]).map((w,i)=>(
              <div key={i} style={{ background:i===0?"rgba(251,191,36,0.1)":theme.card, border:`1.5px solid ${i===0?"rgba(251,191,36,0.3)":theme.cardBorder}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:w.kills||w.players?8:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:i===0?28:22 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"🎖️"}</span>
                    <div>
                      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:i===0?"#fbbf24":theme.text }}>{w.name}</div>
                      <div style={{ fontSize:11, color:theme.textFaint }}>{i===0?"বিজয়ী":"রানার আপ"}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:800, color:"#4ade80" }}>৳{formatBalance(w.prize)}</div>
                </div>
                {/* KILLS & PLAYERS */}
                {(w.kills||w.players) && (
                  <div style={{ borderTop:`1px solid ${theme.cardBorder}`, paddingTop:8 }}>
                    {w.kills!==undefined && <div style={{ fontSize:12, color:theme.textDim }}>💀 মোট কিল: <b style={{ color:"#f87171" }}>{w.kills}</b></div>}
                    {(w.players||[]).map((p,pi)=>(
                      <div key={pi} style={{ fontSize:11, color:theme.textFaint, marginTop:3 }}>👤 {p.name} — {p.kills||0} কিল</div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button onClick={()=>setSelected(null)} style={{ width:"100%", background:theme.inputBg, border:"none", borderRadius:12, padding:"12px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer", marginTop:6 }}>বন্ধ করুন</button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}
