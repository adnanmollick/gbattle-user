import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

function Countdown({ target }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) { setLeft("শুরু হয়েছে!"); return; }
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setLeft(h>0?`${h}h ${m}m`:m>0?`${m}m ${s}s`:`${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  return <span>{left}</span>;
}

function PrizeModal({ match, onClose }) {
  const theme = useTheme();
  const prizes = match.prizes || [];
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(13,8,32,0.98)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:24, padding:24, width:"100%", maxWidth:360 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>🏆</span>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:"#fff" }}>Prize Distribution</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, width:28, height:28, color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
        <div style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:14, padding:"12px 16px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:"rgba(255,255,255,0.6)", fontSize:13 }}>Total Prize Pool</span>
          <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:800, color:"#a78bfa" }}>৳{match.prize}</span>
        </div>
        {prizes.map((p,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize:13, color:i===0?"#fbbf24":i===1?"#d1d5db":i===2?"#cd7c39":"rgba(255,255,255,0.5)" }}>
              {i===0?"🥇":i===1?"🥈":i===2?"🥉":"🎖️"} {i+1}{i===0?"st":i===1?"nd":i===2?"rd":"th"} Prize
            </span>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#34d399" }}>৳{p}</span>
          </div>
        ))}
        {match.perKill > 0 && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0" }}>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>💀 Per Kill</span>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#f87171" }}>৳{match.perKill}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage({ onMatchClick, filterCategory }) {
  const theme = useTheme();
  const { t, font } = useLang();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("সব");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [prizeModal, setPrizeModal] = useState(null);

  const modes = ["সব","BR Match","Clash Squad","2V2","Lone Wolf"];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,"matches"), orderBy("createdAt","desc")),
      snap => { setMatches(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = matches.filter(m => {
    if (m.status === "finished") return false;
    if (filterCategory && m.mode !== filterCategory.name) return false;
    if (filter !== "সব" && m.mode !== filter) return false;
    if (search && !m.title?.toLowerCase().includes(search.toLowerCase()) && !m.id?.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ fontFamily:font, paddingBottom:90 }}>
      {/* HEADER */}
      <div style={{ padding:"20px 18px 16px" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:800, color:"#fff", marginBottom:2 }}>{t("matchTitle")}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{filtered.length} টি ম্যাচ উপলব্ধ</div>
      </div>

      {/* SEARCH */}
      <div style={{ padding:"0 18px 14px" }}>
        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("searchMatch")} style={{ flex:1, background:"none", border:"none", color:"#fff", fontSize:13, outline:"none", fontFamily:font }} />
        </div>
      </div>

      {/* MODE FILTER */}
      <div style={{ padding:"0 18px 16px", display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none" }}>
        {modes.map(m => (
          <button key={m} onClick={()=>setFilter(m)} style={{ background:filter===m?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(255,255,255,0.05)", border:filter===m?"none":"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"7px 16px", color:filter===m?"#fff":"rgba(255,255,255,0.5)", fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", boxShadow:filter===m?"0 4px 14px rgba(124,58,237,0.4)":"none", flexShrink:0 }}>{m}</button>
        ))}
      </div>

      {/* MATCHES */}
      <div style={{ padding:"0 18px" }}>
        {loading ? (
          [1,2,3].map(i=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.04)", borderRadius:20, overflow:"hidden", marginBottom:14 }}>
              <div style={{ height:130, background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }}></div>
              <div style={{ padding:14 }}>
                <div style={{ height:12, width:"60%", borderRadius:6, background:"rgba(255,255,255,0.06)", marginBottom:8 }}></div>
                <div style={{ height:10, width:"40%", borderRadius:6, background:"rgba(255,255,255,0.04)" }}></div>
              </div>
            </div>
          ))
        ) : filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎮</div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>কোনো ম্যাচ পাওয়া যায়নি</div>
          </div>
        ) : filtered.map(m => {
          const joined = m.participants?.some(p=>p.uid===user?.uid);
          const isFull = (m.participants?.length||0) >= (m.maxPlayers||48);
          const isLive = m.status==="live";
          const slotLeft = (m.maxPlayers||48) - (m.participants?.length||0);
          const fillPct = ((m.participants?.length||0)/(m.maxPlayers||48))*100;

          return (
            <div key={m.id} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, overflow:"hidden", marginBottom:14, backdropFilter:"blur(10px)" }}>
              {/* THUMBNAIL */}
              <div style={{ position:"relative", height:130, background:m.thumbnail?`url(${m.thumbnail}) center/cover`:"linear-gradient(135deg,#1e1040,#3b1f9e)" }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,4,15,0.9) 0%,rgba(0,0,0,0.2) 60%,transparent 100%)" }}></div>
                <div style={{ position:"absolute", top:12, left:12, display:"flex", gap:6 }}>
                  {isLive && <span style={{ background:"#dc2626", borderRadius:20, padding:"3px 10px", fontSize:10, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:5,height:5,borderRadius:"50%",background:"#fff",display:"inline-block",animation:"pulse 1s infinite" }}></span>LIVE</span>}
                  <span style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", borderRadius:20, padding:"3px 10px", fontSize:10, fontFamily:"Orbitron,sans-serif", color:"rgba(255,255,255,0.8)" }}>ID: {m.matchCode||m.id?.slice(-6).toUpperCase()}</span>
                </div>
                <div style={{ position:"absolute", bottom:10, left:12, right:12 }}>
                  <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", textShadow:"0 2px 8px rgba(0,0,0,0.8)" }}>{m.title}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{m.mode} · {m.map}</div>
                </div>
              </div>

              {/* STATS */}
              <div style={{ padding:"12px 14px 0" }}>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <div style={{ flex:1, textAlign:"center", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 0" }}>
                    <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#a78bfa" }}>৳{m.entryFee||0}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t("entry")}</div>
                  </div>
                  <div style={{ flex:1, textAlign:"center", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 0" }}>
                    <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fbbf24" }}>৳{m.prize||0}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t("prize")}</div>
                  </div>
                  {m.perKill>0 && (
                    <div style={{ flex:1, textAlign:"center", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 0" }}>
                      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#f87171" }}>৳{m.perKill}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t("perKill")}</div>
                    </div>
                  )}
                </div>

                {/* PLAYERS + STATUS */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ background:"rgba(124,58,237,0.2)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:20, padding:"4px 12px", fontSize:11, fontFamily:"Orbitron,sans-serif", color:"#c4b5fd" }}>{m.participants?.length||0}/{m.maxPlayers||48} {t("players")}</span>
                  {slotLeft > 0 && slotLeft <= 5 && (
                    <span style={{ fontSize:11, color:"#fb923c", fontFamily:"Orbitron,sans-serif", fontWeight:700 }}>{slotLeft} {t("slotsLeft")}</span>
                  )}
                </div>

                {/* PROGRESS BAR */}
                <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, marginBottom:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${fillPct}%`, background:"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:2, transition:"width 0.5s" }}></div>
                </div>

                {/* COUNTDOWN */}
                {m.scheduledAt && !isLive && (
                  <div style={{ background:"rgba(167,139,250,0.06)", borderRadius:10, padding:"8px 0", textAlign:"center", marginBottom:10, fontSize:12, color:"#a78bfa", fontFamily:"Orbitron,sans-serif" }}>
                    ⏱ <Countdown target={m.scheduledAt} />
                  </div>
                )}
                {isLive && (
                  <div style={{ background:"rgba(52,211,153,0.06)", borderRadius:10, padding:"8px 0", textAlign:"center", marginBottom:10, fontSize:12, color:"#34d399", fontFamily:"Orbitron,sans-serif" }}>
                    ⏱ শুরু হয়েছে!
                  </div>
                )}

                {/* BUTTONS */}
                <div style={{ display:"flex", gap:8, paddingBottom:14 }}>
                  <button onClick={()=>setPrizeModal(m)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 0", color:"rgba(255,255,255,0.7)", fontSize:11, fontFamily:"Orbitron,sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>🏆 {t("prizePool")}</button>
                  {isFull ? (
                    <button disabled style={{ flex:1.5, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:12, padding:"10px 0", color:"#f87171", fontSize:11, fontFamily:"Orbitron,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>🔒 Match Full</button>
                  ) : joined ? (
                    <button onClick={()=>onMatchClick(m)} style={{ flex:1.5, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:12, padding:"10px 0", color:"#34d399", fontSize:11, fontFamily:"Orbitron,sans-serif", cursor:"pointer" }}>✅ যোগ দিয়েছেন</button>
                  ) : (
                    <button onClick={()=>onMatchClick(m)} style={{ flex:1.5, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:12, padding:"10px 0", color:"#fff", fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(124,58,237,0.4)" }}>{t("joinMatch")}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {prizeModal && <PrizeModal match={prizeModal} onClose={()=>setPrizeModal(null)} />}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}
