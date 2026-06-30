import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const [tab, setTab] = useState("points");
  const [pointTables, setPointTables] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "point_tables"), snap => {
      const all = snap.docs.map(d=>({id:d.id,...d.data()}));
      all.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
      setPointTables(all);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,"results"), orderBy("createdAt","desc")),
      snap => setResults(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    return unsub;
  }, []);

  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={{ padding:"16px 18px", fontFamily:"'Hind Siliguri',sans-serif" }}>
      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:700, color:theme.text, marginBottom:16, textAlign:"center" }}>🏆 লিডারবোর্ড</div>

      {/* TAB SWITCHER */}
      <div style={{ display:"flex", gap:8, marginBottom:18, background:theme.card, borderRadius:14, padding:5, border:`1px solid ${theme.cardBorder}` }}>
        <button onClick={()=>setTab("points")} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, background:tab==="points"?theme.accentGrad:"transparent", color:tab==="points"?"#fff":theme.textFaint, transition:"all 0.2s" }}>📊 পয়েন্ট টেবিল</button>
        <button onClick={()=>setTab("results")} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, background:tab==="results"?theme.accentGrad:"transparent", color:tab==="results"?"#fff":theme.textFaint, transition:"all 0.2s" }}>🎮 ম্যাচ রেজাল্ট</button>
      </div>

      {/* POINT TABLES */}
      {tab==="points" && (
        pointTables.length===0 ? (
          <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:14, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
            <div style={{ color:theme.textFaint, fontSize:13 }}>এখনো কোনো পয়েন্ট টেবিল নেই</div>
          </div>
        ) : pointTables.map(table=>{
          const sortedTeams = [...(table.teams||[])].sort((a,b)=>(b.points||0)-(a.points||0));
          return (
            <div key={table.id} style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:theme.primary, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                🎯 {table.matchName||"ম্যাচ পয়েন্ট"}
              </div>
              <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:16, overflow:"hidden" }}>
                {/* HEADER */}
                <div style={{ display:"flex", alignItems:"center", padding:"10px 16px", background:theme.accentGrad, fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff" }}>
                  <div style={{ width:30 }}>#</div>
                  <div style={{ flex:1 }}>টিম</div>
                  <div style={{ width:50, textAlign:"center" }}>কিল</div>
                  <div style={{ width:55, textAlign:"right" }}>পয়েন্ট</div>
                </div>
                {/* ROWS */}
                {sortedTeams.map((t,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${theme.cardBorder}`, background:i<3?theme.accentGlow:"transparent" }}>
                    <div style={{ width:30, fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:i===0?"#fbbf24":i===1?"#d1d5db":i===2?"#cd7c39":theme.textFaint }}>{i<3?medals[i]:`${i+1}`}</div>
                    <div style={{ flex:1, fontSize:13, fontWeight:600, color:theme.text }}>{t.name}</div>
                    <div style={{ width:50, textAlign:"center", fontSize:13, color:"#f87171", fontWeight:600 }}>{t.kills||0}</div>
                    <div style={{ width:55, textAlign:"right", fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:800, color:"#4ade80" }}>{t.points||0}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* MATCH RESULTS */}
      {tab==="results" && (
        results.length===0 ? (
          <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:14, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎮</div>
            <div style={{ color:theme.textFaint, fontSize:13 }}>কোনো ফলাফল নেই</div>
          </div>
        ) : results.map(r=>(
          <div key={r.id} onClick={()=>setSelectedResult(r)} style={{ background:theme.card, border:`1.5px solid ${theme.cardBorder}`, borderRadius:16, padding:16, marginBottom:14, cursor:"pointer" }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, marginBottom:4, color:theme.text }}>{r.matchTitle}</div>
            <div style={{ fontSize:11, color:theme.textFaint, marginBottom:10 }}>{new Date(r.createdAt).toLocaleDateString("bn-BD")}</div>
            {(r.winners||[]).slice(0,3).map((w,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${theme.cardBorder}` }}>
                <span style={{ fontSize:13, color:theme.text }}>{medals[i]||"🎖️"} {w.name}{w.kills?<span style={{color:"#f87171",marginLeft:6,fontSize:11}}>💀{w.kills}</span>:""}</span>
                <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#4ade80" }}>৳{formatBalance(w.prize)}</span>
              </div>
            ))}
            <div style={{ fontSize:11, color:theme.primary, marginTop:8, textAlign:"right" }}>বিস্তারিত →</div>
          </div>
        ))
      )}

      {/* RESULT DETAIL MODAL */}
      {selectedResult && (
        <div onClick={()=>setSelectedResult(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:20, padding:24, width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ textAlign:"center", marginBottom:20, background:theme.accentGrad, borderRadius:16, padding:"20px 16px" }}>
              <div style={{ fontSize:40, marginBottom:8, animation:"bounce 1s ease infinite" }}>🎉</div>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:900, color:"#fff", letterSpacing:1 }}>CONGRATULATIONS!</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginTop:4 }}>{selectedResult.matchTitle}</div>
            </div>
            {(selectedResult.winners||[]).map((w,i)=>(
              <div key={i} style={{ background:i===0?"rgba(251,191,36,0.1)":theme.card, border:`1.5px solid ${i===0?"rgba(251,191,36,0.3)":theme.cardBorder}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:(w.kills||w.players?.length)?8:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:i===0?28:22 }}>{medals[i]||"🎖️"}</span>
                    <div>
                      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:i===0?"#fbbf24":theme.text }}>{w.name}</div>
                      <div style={{ fontSize:11, color:theme.textFaint }}>{i===0?"চ্যাম্পিয়ন":"রানার আপ"}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:800, color:"#4ade80" }}>৳{formatBalance(w.prize)}</div>
                </div>
                {(w.kills||w.players?.length) && (
                  <div style={{ borderTop:`1px solid ${theme.cardBorder}`, paddingTop:8 }}>
                    {w.kills!==undefined && w.kills>0 && <div style={{ fontSize:12, color:theme.textDim, marginBottom:4 }}>💀 মোট কিল: <b style={{ color:"#f87171" }}>{w.kills}</b></div>}
                    {(w.players||[]).map((p,pi)=>(
                      <div key={pi} style={{ fontSize:11, color:theme.textFaint, marginTop:2 }}>👤 {p.name} — {p.kills||0} কিল</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button onClick={()=>setSelectedResult(null)} style={{ width:"100%", background:theme.inputBg, border:"none", borderRadius:12, padding:"12px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer", marginTop:6 }}>বন্ধ করুন</button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}
