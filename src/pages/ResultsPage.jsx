import { useState, useEffect, memo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

const medals = ["🥇","🥈","🥉"];

const ResultCard = memo(({ r, onClick }) => {
  const { t } = useLang();
  const top = (r.winners||[])[0];
  return (
    <div onClick={()=>onClick(r)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding:16, marginBottom:12, cursor:"pointer", backdropFilter:"blur(8px)" }}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.98)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#fff", marginBottom:4 }}>{r.matchTitle}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{new Date(r.createdAt).toLocaleDateString("bn-BD")}</div>
        </div>
        <div style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:10, padding:"4px 10px", fontSize:10, fontFamily:"Orbitron,sans-serif", color:"#fbbf24" }}>COMPLETED</div>
      </div>
      {(r.winners||[]).slice(0,3).map((w,i)=>(
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>{medals[i]||"🎖️"}</span>
            <span style={{ fontSize:12, color:"#fff" }}>{w.name}</span>
            {w.kills>0 && <span style={{ fontSize:10, color:"#f87171" }}>💀{w.kills}</span>}
            {w.points>0 && <span style={{ fontSize:10, color:"#fbbf24" }}>⭐{w.points}</span>}
          </div>
          {w.prize>0 ? <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#34d399" }}>৳{formatBalance(w.prize)}</span> : <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>—</span>}
        </div>
      ))}
      <div style={{ textAlign:"right", marginTop:8, fontSize:11, color:"rgba(167,139,250,0.7)", fontFamily:"Orbitron,sans-serif" }}>বিস্তারিত →</div>
    </div>
  );
});

export default function ResultsPage() {
  const theme = useTheme();
  const { t, font } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db,"results"), orderBy("createdAt","desc")), snap => {
      setResults(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  }, []);

  const filtered = results.filter(r => {
    if (tab==="my" && user) {
      const isWinner = (r.winners||[]).some(w=>w.uid===user.uid);
      const isParticipant = (r.participants||[]).some(p=>p.uid===user.uid);
      if (!isWinner && !isParticipant) return false;
    }
    if (search && !r.matchTitle?.toLowerCase().includes(search.toLowerCase()) && !r.matchId?.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ fontFamily:font, paddingBottom:90 }}>
      <div style={{ padding:"20px 18px 16px" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:800, color:"#fff" }}>🏆 {t("results")}</div>
      </div>

      {/* TABS */}
      <div style={{ margin:"0 18px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:5, display:"flex" }}>
        {[["my",`👤 ${t("myMatches")}`],["all",`🎮 ${t("allResults")}`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:11, fontWeight:700, background:tab===id?"linear-gradient(135deg,#7c3aed,#a78bfa)":"transparent", color:tab===id?"#fff":"rgba(255,255,255,0.4)", transition:"all 0.2s" }}>{label}</button>
        ))}
      </div>

      {/* SEARCH */}
      <div style={{ margin:"0 18px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:14 }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("searchResult")} style={{ flex:1, background:"none", border:"none", color:"#fff", fontSize:13, outline:"none", fontFamily:font }} />
      </div>

      {/* RESULTS */}
      <div style={{ padding:"0 18px" }}>
        {filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>{tab==="my"?"🎮":"🏆"}</div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>{tab==="my"?"কোনো ম্যাচ নেই":"কোনো ফলাফল নেই"}</div>
          </div>
        ) : filtered.map(r=><ResultCard key={r.id} r={r} onClick={setSelected} />)}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(13,8,32,0.98)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:24, padding:24, width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto" }}>
            {/* CONGRATS */}
            <div style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)", borderRadius:20, padding:"20px 16px", textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8, animation:"float 1s ease infinite" }}>🎉</div>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:900, color:"#fff", letterSpacing:1 }}>{t("congratulations") || "CONGRATULATIONS!"}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:4 }}>{selected.matchTitle}</div>
            </div>
            {/* WINNERS */}
            {(selected.winners||[]).map((w,i)=>(
              <div key={i} style={{ background:i===0?"rgba(251,191,36,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${i===0?"rgba(251,191,36,0.2)":"rgba(255,255,255,0.06)"}`, borderRadius:16, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:(w.kills||(w.players?.length))>0?10:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:i===0?28:22 }}>{medals[i]||"🎖️"}</span>
                    <div>
                      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:i===0?"#fbbf24":"#fff" }}>{w.name}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{i===0?t("champion")||"চ্যাম্পিয়ন":t("runnerUp")||"রানার আপ"}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:800, color:"#34d399" }}>৳{formatBalance(w.prize)}</div>
                </div>
                {w.kills>0 && <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:8 }}>💀 {t("totalKills")||"মোট কিল"}: <b style={{ color:"#f87171" }}>{w.kills}</b></div>}
                {(w.players||[]).map((p,pi)=>(
                  <div key={pi} style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>👤 {p.name} — {p.kills||0} কিল</div>
                ))}
              </div>
            ))}
            <button onClick={()=>setSelected(null)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 0", color:"rgba(255,255,255,0.6)", fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer", marginTop:4 }}>{t("close")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
