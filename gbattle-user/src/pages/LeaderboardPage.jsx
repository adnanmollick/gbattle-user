import { useState, useEffect, memo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

const Podium = memo(({ top3, t }) => {
  const medals = ["🥇","🥈","🥉"];
  const order = [1,0,2]; // 2nd, 1st, 3rd
  const heights = [100,130,85];
  const colors = ["#d1d5db","#fbbf24","#cd7c39"];
  return (
    <div style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(167,139,250,0.05))", borderRadius:24, padding:"24px 18px 0", margin:"0 18px 20px", border:"1px solid rgba(167,139,250,0.15)", overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,191,36,0.08) 0%,transparent 70%)" }}></div>
      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fbbf24", textAlign:"center", marginBottom:20, letterSpacing:2 }}>🏆 {t("hallOfFame")}</div>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:8 }}>
        {order.map((idx,pos) => {
          const player = top3[idx];
          if (!player) return <div key={pos} style={{ flex:1 }}></div>;
          return (
            <div key={pos} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
              {/* CROWN for 1st */}
              {idx===0 && <div style={{ fontSize:20, marginBottom:4, animation:"float 2s ease infinite" }}>👑</div>}
              {/* AVATAR */}
              <div style={{ width:idx===0?60:50, height:idx===0?60:50, borderRadius:"50%", background:player.avatar?"transparent":`linear-gradient(135deg,${colors[idx]}44,${colors[idx]}22)`, border:`3px solid ${colors[idx]}`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 16px ${colors[idx]}55`, marginBottom:6 }}>
                {player.avatar ? <img src={player.avatar} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:idx===0?24:18 }}>👤</span>}
              </div>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:10, fontWeight:700, color:"#fff", marginBottom:2, textAlign:"center", maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{player.name}</div>
              <div style={{ fontSize:10, color:"#34d399", fontFamily:"Orbitron,sans-serif", marginBottom:8 }}>৳{formatBalance(player.totalPrize||0)}</div>
              {/* PODIUM BLOCK */}
              <div style={{ width:"100%", height:heights[pos], background:idx===0?"linear-gradient(180deg,#fbbf24,#f59e0b)":idx===1?"linear-gradient(180deg,#9ca3af,#6b7280)":"linear-gradient(180deg,#cd7c39,#a16207)", borderRadius:"10px 10px 0 0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:idx===0?20:16, fontWeight:900, color:"rgba(255,255,255,0.9)" }}>{idx+1}{idx===0?"st":idx===1?"nd":"rd"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default function LeaderboardPage() {
  const theme = useTheme();
  const { t, font } = useLang();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myData, setMyData] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db,"leaderboard"), snap => {
      const all = snap.docs.map(d=>({id:d.id,...d.data()}));
      all.sort((a,b)=>(b.totalPrize||0)-(a.totalPrize||0));
      setPlayers(all);
      if (user) {
        const idx = all.findIndex(p=>p.uid===user.uid);
        setMyRank(idx>=0?idx+1:null);
        setMyData(idx>=0?all[idx]:null);
      }
    });
    return unsub;
  }, [user]);

  const top3 = players.slice(0,3);

  return (
    <div style={{ fontFamily:font, paddingBottom:90 }}>
      <div style={{ padding:"20px 18px 16px" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:800, color:"#fff" }}>🏆 {t("leaderboard")}</div>
      </div>

      {/* PODIUM */}
      {top3.length>0 && <Podium top3={top3} t={t} />}

      {/* MY RANK CARD */}
      {myData && (
        <div style={{ margin:"0 18px 16px", background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(167,139,250,0.1))", border:"1px solid rgba(167,139,250,0.3)", borderRadius:20, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, backdropFilter:"blur(10px)" }}>
          <div style={{ width:50, height:50, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>👤</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"Orbitron,sans-serif", marginBottom:2 }}>{t("yourRank")}</div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:22, fontWeight:900, color:"#fff" }}>#{myRank}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"Orbitron,sans-serif", marginBottom:2 }}>{t("totalWon")}</div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:800, color:"#34d399" }}>৳{formatBalance(myData.totalPrize||0)}</div>
          </div>
        </div>
      )}

      {/* RANKINGS */}
      <div style={{ padding:"0 18px" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:12, letterSpacing:1 }}>═══ {t("rankings")} ═══</div>
        {players.map((p,i)=>(
          <div key={p.id} style={{ background:p.uid===user?.uid?"rgba(167,139,250,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${p.uid===user?.uid?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.06)"}`, borderRadius:16, padding:"14px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(8px)" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:i===0?"rgba(251,191,36,0.15)":i===1?"rgba(209,213,219,0.1)":i===2?"rgba(205,124,57,0.1)":"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Orbitron,sans-serif", fontSize:i<3?16:13, fontWeight:700, color:i===0?"#fbbf24":i===1?"#d1d5db":i===2?"#cd7c39":"rgba(255,255,255,0.4)", flexShrink:0 }}>
              {i<3?["🥇","🥈","🥉"][i]:i+1}
            </div>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(124,58,237,0.2)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {p.avatar ? <img src={p.avatar} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:18 }}>👤</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>🎮 {p.matches||0} · 🏆 {p.wins||0} {t("wins")}</div>
            </div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:800, color:"#34d399" }}>৳{formatBalance(p.totalPrize||0)}</div>
          </div>
        ))}
        {players.length===0 && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>কোনো ডাটা নেই</div>
          </div>
        )}
      </div>
    </div>
  );
}
