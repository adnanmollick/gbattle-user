import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

// Animated 3D Icons
function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        fill={active ? "url(#homeGrad)" : "rgba(255,255,255,0.35)"} stroke="none"/>
      {active && <defs><linearGradient id="homeGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>}
      {active && <path d="M3 9.5L12 3L21 9.5" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round"/>}
    </svg>
  );
}

function MatchIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="8" width="20" height="11" rx="4" fill={active?"url(#matchGrad)":"rgba(255,255,255,0.35)"}/>
      <circle cx="8" cy="13.5" r="1.5" fill={active?"#fff":"rgba(255,255,255,0.5)"}/>
      <circle cx="16" cy="13.5" r="1.5" fill={active?"#fff":"rgba(255,255,255,0.5)"}/>
      <path d="M12 11v5M10 13h4" stroke={active?"#fff":"rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 8V6a4 4 0 018 0v2" stroke={active?"#c4b5fd":"rgba(255,255,255,0.3)"} strokeWidth="1.5" strokeLinecap="round"/>
      {active && <defs><linearGradient id="matchGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>}
    </svg>
  );
}

function TrophyIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8M12 17v4M7 4H5C4.45 4 4 4.45 4 5v3c0 2.21 1.79 4 4 4M17 4h2c.55 0 1 .45 1 1v3c0 2.21-1.79 4-4 4" stroke={active?"#fbbf24":"rgba(255,255,255,0.35)"} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 17c-3.31 0-6-2.69-6-6V4h12v7c0 3.31-2.69 6-6 6z" fill={active?"url(#trophyGrad)":"rgba(255,255,255,0.2)"} stroke={active?"#fbbf24":"rgba(255,255,255,0.35)"} strokeWidth="1.5"/>
      {active && <defs><linearGradient id="trophyGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>}
    </svg>
  );
}

function WalletIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" fill={active?"url(#walletGrad)":"rgba(255,255,255,0.2)"} stroke={active?"#34d399":"rgba(255,255,255,0.35)"} strokeWidth="1.5"/>
      <path d="M2 10h20" stroke={active?"#34d399":"rgba(255,255,255,0.3)"} strokeWidth="1.5"/>
      <circle cx="17" cy="15" r="2" fill={active?"#34d399":"rgba(255,255,255,0.4)"}/>
      <path d="M6 4h12" stroke={active?"#6ee7b7":"rgba(255,255,255,0.2)"} strokeWidth="2" strokeLinecap="round"/>
      {active && <defs><linearGradient id="walletGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="rgba(52,211,153,0.2)"/><stop offset="1" stopColor="rgba(16,185,129,0.1)"/></linearGradient></defs>}
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill={active?"url(#profileGrad)":"rgba(255,255,255,0.2)"} stroke={active?"#a78bfa":"rgba(255,255,255,0.35)"} strokeWidth="1.5"/>
      <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={active?"#a78bfa":"rgba(255,255,255,0.35)"} strokeWidth="1.8" strokeLinecap="round"/>
      {active && <defs><linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>}
    </svg>
  );
}

export function BottomNav({ page, onNavigate }) {
  const { t } = useLang();
  const tabs = [
    { id:"home", label:t("home"), Icon:HomeIcon },
    { id:"matches", label:t("matches"), Icon:MatchIcon },
    { id:"leaderboard", label:t("leaderboard"), Icon:TrophyIcon },
    { id:"wallet", label:t("wallet"), Icon:WalletIcon },
    { id:"profile", label:t("profile"), Icon:ProfileIcon },
  ];
  return (
    <div className="bottom-nav-fixed" style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, zIndex:100 }}>
      <div style={{ margin:"0 12px 8px", background:"rgba(6,4,15,0.75)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:24, padding:"8px 4px", display:"flex" }}>
        {tabs.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => onNavigate(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"6px 0", background:"none", border:"none", cursor:"pointer", position:"relative" }}>
              {active && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:32, height:2, background:"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:2 }}></div>}
              <div style={{ transform:active?"scale(1.15)":"scale(1)", transition:"transform 0.2s cubic-bezier(0.34,1.56,0.64,1)", filter:active?"drop-shadow(0 0 8px rgba(167,139,250,0.8))":"none" }}>
                <Icon active={active} />
              </div>
              <span style={{ fontSize:9, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:active?"#a78bfa":"rgba(255,255,255,0.35)", letterSpacing:0.5, transition:"color 0.2s" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Topbar({ page, onBack, onNavigate, onOpenMatch }) {
  const theme = useTheme();
  const { t } = useLang();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db,"users",user.uid), snap => {
      if (snap.exists()) setBalance(snap.data().wallet || 0);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db,"notifications"), where("uid","==",user.uid), orderBy("createdAt","desc")), snap => {
      setNotifs(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  }, [user]);

  const unread = notifs.filter(n=>!n.read).length;

  const handleNotifClick = async (n) => {
    await updateDoc(doc(db,"notifications",n.id),{read:true});
    setShowInbox(false);
    if (n.type==="deposit"||n.type==="prize") onNavigate&&onNavigate("wallet");
    else if ((n.type==="room"||n.type==="match")&&n.matchId&&onOpenMatch) onOpenMatch(n.matchId);
  };

  const isDetail = page === "detail";

  return (
    <>
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(6,4,15,0.8)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:"1px solid rgba(167,139,250,0.1)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        {isDetail ? (
          <button onClick={onBack} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:16 }}>←</button>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:20, fontWeight:900, letterSpacing:1, background:"linear-gradient(90deg,#a78bfa,#fff,#7c3aed)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", textShadow:"0 0 20px rgba(124,58,237,0.4)", animation:"logoShine 3s linear infinite" }}>G-BATTLE</span>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {user && (
            <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:20, padding:"6px 14px", fontSize:12, fontFamily:"Orbitron,sans-serif", color:"#a78bfa", fontWeight:700 }}>
              ৳{balance.toFixed(0)}
            </div>
          )}
          <button onClick={()=>setShowInbox(true)} style={{ position:"relative", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            {unread>0 && <div style={{ position:"absolute", top:6, right:6, width:8, height:8, borderRadius:"50%", background:"#f87171", boxShadow:"0 0 6px rgba(248,113,113,0.8)" }}></div>}
          </button>
        </div>
      </div>

      {showInbox && (
        <div onClick={()=>setShowInbox(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"flex-end", padding:"70px 12px 0" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(13,8,32,0.95)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:20, padding:16, width:300, maxHeight:"70vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#fff" }}>{t("notifications")}</span>
              <button onClick={()=>setShowInbox(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:16, cursor:"pointer" }}>✕</button>
            </div>
            {notifs.length===0 ? (
              <div style={{ textAlign:"center", padding:20, color:"rgba(255,255,255,0.3)", fontSize:12 }}>{t("noNotif")}</div>
            ) : notifs.map(n=>(
              <div key={n.id} onClick={()=>handleNotifClick(n)} style={{ display:"flex", gap:10, padding:"10px 12px", background:n.read?"transparent":"rgba(167,139,250,0.08)", borderRadius:12, marginBottom:6, cursor:"pointer", border:`1px solid ${n.read?"rgba(255,255,255,0.06)":"rgba(167,139,250,0.2)"}` }}>
                <div style={{ fontSize:20, flexShrink:0 }}>{n.type==="deposit"?"💚":n.type==="room"?"🔑":n.type==="prize"?"🏆":"📢"}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#fff", marginBottom:2 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
