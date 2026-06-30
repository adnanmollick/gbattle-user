import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

const modes = ["সব","BR Match","Clash Squad","2V2","Lone Wolf"];
const modeEmoji = { "BR Match":"🔫", "Clash Squad":"⚔️", "2V2":"🤝", "Lone Wolf":"🐺" };

export default function MatchesPage({ onMatchClick }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("সব");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,"matches"), orderBy("createdAt","desc")),
      (snap) => { setMatches(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); }
    );
    return unsub;
  }, []);

  let filtered = filter==="সব" ? matches : matches.filter(m=>m.mode===filter);
  if (search.trim()) filtered = filtered.filter(m => (m.title||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:700, color:theme.text }}>ম্যাচ সমূহ</div>
          <div style={{ fontSize:12, color:theme.textFaint, marginTop:2 }}>{filtered.length}টি ম্যাচ</div>
        </div>
      </div>

      {/* SEARCH */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ম্যাচ খুঁজুন..." style={{ width:"100%", background:theme.inputBg, border:`1px solid ${theme.inputBorder}`, borderRadius:12, padding:"10px 14px", color:theme.text, fontSize:13, outline:"none", marginBottom:14, boxSizing:"border-box" }} />

      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:16, scrollbarWidth:"none" }}>
        {modes.map(m=>(
          <button key={m} onClick={()=>setFilter(m)} style={{ background: filter===m?theme.accentGrad:theme.card, border: filter===m?"none":`1px solid ${theme.cardBorder}`, borderRadius:20, padding:"7px 14px", color: filter===m?"#fff":theme.textDim, fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", boxShadow: filter===m?"0 4px 14px rgba(124,58,237,0.35)":"none" }}>
            {m}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[1,2,3].map(i=>(
            <div key={i} style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:16, overflow:"hidden" }}>
              <div style={{ height:110, background:`linear-gradient(90deg,${theme.cardBorder} 25%,${theme.inputBg} 50%,${theme.cardBorder} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }}></div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ height:12, width:"60%", borderRadius:6, background:theme.inputBg, marginBottom:8, animation:"shimmer 1.5s infinite", backgroundImage:`linear-gradient(90deg,${theme.cardBorder} 25%,${theme.inputBg} 50%,${theme.cardBorder} 75%)`, backgroundSize:"200% 100%" }}></div>
                <div style={{ height:10, width:"40%", borderRadius:6, background:theme.inputBg }}></div>
              </div>
            </div>
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : filtered.length===0 ? (
        <div style={{ background:"rgba(103,232,249,0.08)", border:"1px solid rgba(103,232,249,0.2)", borderRadius:12, padding:20, textAlign:"center", color:"#67e8f9", fontSize:13 }}>কোনো ম্যাচ পাওয়া যায়নি</div>
      ) : filtered.map(m=><MatchCard key={m.id} match={m} theme={theme} uid={user?.uid} onClick={()=>onMatchClick(m)} />)}
    </div>
  );
}

function MatchCard({ match: m, onClick, theme, uid }) {
  const [timeLeft, setTimeLeft] = useState("");
  const joined = uid && Array.isArray(m.participants) && m.participants.some(p => (typeof p === "string" ? p === uid : p.uid === uid));

  useEffect(() => {
    if (!m.scheduledAt) return;
    const iv = setInterval(() => {
      const diff = new Date(m.scheduledAt) - new Date();
      if (diff<=0) { setTimeLeft("শুরু হয়েছে!"); clearInterval(iv); return; }
      const h=Math.floor(diff/3600000), min=Math.floor((diff%3600000)/60000), sec=Math.floor((diff%60000)/1000);
      setTimeLeft(`${h}h ${min}m ${sec}s`);
    }, 1000);
    return ()=>clearInterval(iv);
  }, [m.scheduledAt]);

  const mapsLabel = Array.isArray(m.maps) ? m.maps.join(", ") : (m.map || "Bermuda");

  return (
    <div onClick={m.status==="finished"?undefined:onClick} style={{ background:theme.card, border:`1.5px solid ${joined?"rgba(74,222,128,0.4)":theme.cardBorder}`, borderRadius:18, overflow:"hidden", marginBottom:14, cursor:m.status==="finished"?"default":"pointer", transition:"all 0.2s", opacity:m.status==="finished"?0.6:1 }}>

      <div style={{ height:120, background: m.thumbnail?`url(${m.thumbnail}) center/cover`:`linear-gradient(135deg,#1e3a8a,#4c1d95)`, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", fontSize:50 }}>
        {!m.thumbnail && (modeEmoji[m.mode]||"🎮")}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 30%,rgba(10,1,24,0.85))" }}></div>
        <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:6 }}>
          <span style={{ background: m.status==="live"?"rgba(74,222,128,0.2)":"rgba(103,232,249,0.15)", color: m.status==="live"?"#4ade80":"#67e8f9", border:`1px solid ${m.status==="live"?"rgba(74,222,128,0.4)":"rgba(103,232,249,0.3)"}`, fontSize:9, fontFamily:"Orbitron,sans-serif", fontWeight:700, padding:"3px 10px", borderRadius:20 }}>
            {m.status==="live"?"● LIVE":m.status==="finished"?"FINISHED":"UPCOMING"}
          </span>
          {joined && (
            <span style={{ background:"rgba(74,222,128,0.25)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.5)", fontSize:9, fontFamily:"Orbitron,sans-serif", fontWeight:700, padding:"3px 10px", borderRadius:20 }}>
              Joined ✅
            </span>
          )}
        </div>
        <div style={{ position:"absolute", bottom:8, left:14 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff" }}>{m.title}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>🎮 {m.mode} · 🗺️ {mapsLabel}</div>
        </div>
      </div>

      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ background:theme.name==="dark"?"rgba(124,58,237,0.25)":"rgba(124,58,237,0.12)", color:theme.primary, borderRadius:20, fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, padding:"4px 12px" }}>
            {m.players||0}/{m.maxPlayers||0} Players
          </div>
          <div style={{ display:"inline-block", background:theme.name==="dark"?"rgba(167,139,250,0.15)":"rgba(167,139,250,0.12)", color:theme.primary, borderRadius:6, fontSize:10, fontFamily:"Orbitron,sans-serif", fontWeight:700, padding:"2px 8px" }}>
            ID: {m.id?.slice(-6).toUpperCase()}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
          {[["প্রবেশ মূল্য",m.entryFee?`৳${m.entryFee}`:"ফ্রি","#4ade80"],["পুরস্কার",`৳${formatBalance(m.prize||0)}`,"#fbbf24"],["কিল পুর",`৳${m.perKill||0}`,"#67e8f9"]].map(([l,v,c])=>(
            <div key={l} style={{ background:theme.name==="dark"?"rgba(255,255,255,0.04)":"rgba(124,58,237,0.05)", borderRadius:8, padding:"7px 0", textAlign:"center" }}>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:theme.textFaint, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {timeLeft && (
          <div style={{ background:theme.name==="dark"?"rgba(167,139,250,0.08)":"rgba(124,58,237,0.06)", border:`1px solid ${theme.cardBorder}`, borderRadius:10, padding:"7px 0", textAlign:"center", color:theme.primary, fontSize:12, fontFamily:"Orbitron,sans-serif", fontWeight:700, marginBottom:12 }}>
            ⏱ {timeLeft}
          </div>
        )}

        {m.status==="finished" ? (
          <div style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${theme.cardBorder}`, borderRadius:10, padding:"10px 0", color:theme.textFaint, fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, textAlign:"center" }}>
            🏁 ম্যাচ শেষ
          </div>
        ) : (
        <button onClick={e=>{e.stopPropagation();onClick();}} style={{ width:"100%", background: joined?"rgba(74,222,128,0.15)":theme.accentGrad, border: joined?"1px solid rgba(74,222,128,0.4)":"none", borderRadius:10, padding:"10px 0", color: joined?"#4ade80":"#fff", fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, cursor:"pointer", boxShadow: joined?"none":"0 4px 14px rgba(124,58,237,0.35)" }}>
          {joined ? "✅ যোগ দিয়েছেন — বিস্তারিত" : "যোগ দিন →"}
        </button>
        )}
      </div>
    </div>
  );
}
