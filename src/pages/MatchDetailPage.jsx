import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot, updateDoc, arrayUnion, addDoc, collection, getDoc, increment } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

const glass = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, backdropFilter:"blur(20px)" };

export default function MatchDetailPage({ match, onBack }) {
  const theme = useTheme();
  const { t, font } = useLang();
  const { user } = useAuth();
  const [m, setM] = useState(match);
  const [userData, setUserData] = useState(null);
  const [showJoin, setShowJoin] = useState(false);
  const [msg, setMsg] = useState("");
  const [roomCopied, setRoomCopied] = useState("");
  const now = new Date();

  useEffect(() => {
    if (!match?.id) return;
    return onSnapshot(doc(db,"matches",match.id), snap => {
      if (snap.exists()) setM({ id:snap.id,...snap.data() });
    });
  }, [match?.id]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db,"users",user.uid), snap => snap.exists()&&setUserData(snap.data()));
  }, [user]);

  const showMsg = (text, ok=false) => { setMsg({text,ok}); setTimeout(()=>setMsg(""),3000); };

  const joined = m.participants?.some(p => p.uid===user?.uid || p.players?.some(pl=>pl.uid===user?.uid));
  const isFull = (m.participants?.length||0) >= (m.maxPlayers||48);
  const slotLeft = (m.maxPlayers||48) - (m.participants?.length||0);
  const fillPct = ((m.participants?.length||0)/(m.maxPlayers||48))*100;
  const roomVisible = joined && m.roomID && (m.roomReleased || (m.roomReleaseAt && new Date(m.roomReleaseAt)<=now));

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?match=${m.id}`;
    const shareText = `🎮 ${m.title}\n🏆 পুরস্কার: ৳${m.prize} | ${m.isFree?"ফ্রি":`এন্ট্রি: ৳${m.entryFee}`}\n\nএখনই যোগ দিন G-BATTLE এ!`;
    if (navigator.share) { try { await navigator.share({ title:m.title, text:shareText, url:shareUrl }); } catch(e){} }
    else { navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); showMsg("✅ লিংক কপি হয়েছে!", true); }
  };

  const statusBadge = () => {
    if (m.status==="live") return { text:"● LIVE", color:"#dc2626", bg:"rgba(220,38,38,0.15)" };
    if (m.status==="finished") return { text:"FINISHED", color:"#9ca3af", bg:"rgba(156,163,175,0.15)" };
    return { text:"UPCOMING", color:"#34d399", bg:"rgba(52,211,153,0.15)" };
  };
  const sb = statusBadge();

  return (
    <div style={{ fontFamily:font, paddingBottom:30 }}>
      {msg && <div style={{ position:"fixed", top:70, left:"50%", transform:"translateX(-50%)", zIndex:300, background:msg.ok?"rgba(52,211,153,0.95)":"rgba(248,113,113,0.95)", color:"#fff", borderRadius:12, padding:"10px 20px", fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>{msg.text}</div>}

      {/* TITLE */}
      <div style={{ padding:"16px 18px 12px" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:800, color:"#fff", lineHeight:1.3 }}>{m.title}</div>
      </div>

      {/* HERO CARD */}
      <div style={{ margin:"0 18px 16px", borderRadius:20, overflow:"hidden", position:"relative", height:150 }}>
        <div style={{ position:"absolute", inset:0, background:m.thumbnail?`url(${m.thumbnail}) center/cover`:"linear-gradient(135deg,#1e1040,#3b1f9e)" }}></div>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,4,15,0.95),rgba(0,0,0,0.3))" }}></div>
        <button onClick={handleShare} style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        <div style={{ position:"absolute", top:12, left:12, display:"flex", gap:6, flexWrap:"wrap" }}>
          <span style={{ background:sb.bg, backdropFilter:"blur(10px)", borderRadius:20, padding:"4px 12px", fontSize:10, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:sb.color }}>{sb.text}</span>
          <span style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", borderRadius:20, padding:"4px 12px", fontSize:10, fontFamily:"Orbitron,sans-serif", color:"rgba(255,255,255,0.8)" }}>ID: {m.matchCode||m.id?.slice(-6).toUpperCase()}</span>
        </div>
        <div style={{ position:"absolute", bottom:12, left:14, right:14 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>🎮 {m.mode} · 📍 {Array.isArray(m.maps)?m.maps.join(", "):m.map}</div>
          {m.scheduledAt && <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4 }}>🕐 {new Date(m.scheduledAt).toLocaleString("bn-BD")}</div>}
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ margin:"0 18px 16px", display:"flex", gap:8 }}>
        {[
          { label:t("entry"), value:m.isFree?"ফ্রি":`৳${m.entryFee}`, color:"#a78bfa" },
          { label:t("prizePool"), value:`৳${m.prize}`, color:"#fbbf24" },
          { label:t("players"), value:`${m.participants?.length||0}/${m.maxPlayers||48}`, color:"#60a5fa" },
        ].map((s,i)=>(
          <div key={i} style={{ flex:1, ...glass, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginTop:3, fontFamily:"Orbitron,sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* PROGRESS + SLOT */}
      <div style={{ margin:"0 18px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>স্লট পূর্ণ</span>
          {slotLeft>0 && <span style={{ fontSize:11, color:slotLeft<=5?"#fb923c":"#34d399", fontFamily:"Orbitron,sans-serif", fontWeight:700 }}>{slotLeft} স্লট বাকি</span>}
        </div>
        <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${fillPct}%`, background:"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:4, transition:"width 0.5s", boxShadow:"0 0 10px rgba(167,139,250,0.6)" }}></div>
        </div>
      </div>

      {/* LIVE STREAM */}
      {m.streamUrl && (m.status==="live"||m.status==="finished") && (() => {
        // Extract YouTube video ID
        const ytMatch = m.streamUrl.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([\w-]{11})/);
        const vid = ytMatch ? ytMatch[1] : null;
        if (!vid) return (
          <div style={{ margin:"0 18px 16px" }}>
            <a href={m.streamUrl} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:16, padding:"14px 0", color:"#f87171", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, textDecoration:"none" }}>🔴 লাইভ দেখুন →</a>
          </div>
        );
        return (
          <div style={{ margin:"0 18px 16px" }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#f87171", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"#dc2626", display:"inline-block", animation:"pulse 1s infinite" }}></span>লাইভ স্ট্রিম</div>
            <div style={{ position:"relative", paddingBottom:"56.25%", height:0, borderRadius:16, overflow:"hidden", background:"#000" }}>
              <iframe src={`https://www.youtube.com/embed/${vid}`} title="Live Stream" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>
        );
      })()}

      {/* ROOM INFO */}
      {roomVisible && (
        <div style={{ margin:"0 18px 16px", background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:16, padding:"14px 16px" }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#34d399", marginBottom:10 }}>🔑 {t("roomInfo")}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:m.roomPass?8:0 }}>
            <div style={{ fontSize:13, color:"#fff" }}>ID: <b style={{ fontFamily:"Orbitron,sans-serif", color:"#34d399" }}>{m.roomID}</b></div>
            <button onClick={()=>{ navigator.clipboard.writeText(m.roomID); setRoomCopied("id"); setTimeout(()=>setRoomCopied(""),2000); }} style={{ background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"5px 12px", color:"#34d399", fontSize:11, cursor:"pointer", fontFamily:font }}>{roomCopied==="id"?"✓":"📋"} কপি</button>
          </div>
          {m.roomPass && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:13, color:"#fff" }}>Pass: <b style={{ fontFamily:"Orbitron,sans-serif", color:"#34d399" }}>{m.roomPass}</b></div>
              <button onClick={()=>{ navigator.clipboard.writeText(m.roomPass); setRoomCopied("pass"); setTimeout(()=>setRoomCopied(""),2000); }} style={{ background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"5px 12px", color:"#34d399", fontSize:11, cursor:"pointer", fontFamily:font }}>{roomCopied==="pass"?"✓":"📋"} কপি</button>
            </div>
          )}
        </div>
      )}

      {/* PRIZE DISTRIBUTION */}
      {m.prizes?.length>0 && (
        <div style={{ margin:"0 18px 16px", ...glass, padding:18 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>🏆 {t("prizeDistribution")}</div>
          {m.prizes.map((p,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<m.prizes.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
              <span style={{ fontSize:13, color:i===0?"#fbbf24":i===1?"#d1d5db":i===2?"#cd7c39":"rgba(255,255,255,0.6)" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"🎖️"} {p.place}</span>
              <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#34d399" }}>৳{p.amount}</span>
            </div>
          ))}
          {m.perKill>0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:4 }}><span style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>💀 প্রতি কিল</span><span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#f87171" }}>৳{m.perKill}</span></div>}
        </div>
      )}

      {/* RULES */}
      {m.rules && (
        <div style={{ margin:"0 18px 16px", ...glass, padding:18 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", marginBottom:10 }}>📋 {t("rules")}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{m.rules}</div>
        </div>
      )}

      {/* PARTICIPANTS */}
      <div style={{ margin:"0 18px 16px", ...glass, padding:18 }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>👥 {t("participants")} ({m.participants?.length||0})</div>
        {(m.participants||[]).length===0 ? (
          <div style={{ textAlign:"center", padding:20, color:"rgba(255,255,255,0.3)", fontSize:12 }}>এখনো কেউ যোগ দেয়নি</div>
        ) : (m.participants||[]).slice().sort((a,b)=>(a.slot||0)-(b.slot||0)).map((p,i)=>(
          <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:p.teamName||p.players?6:0 }}>
              {p.teamName ? <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:11, fontWeight:700, color:"#a78bfa" }}>🛡️ {p.teamName}</div> : <div style={{ fontSize:12, color:"#fff" }}>{p.name || p.inGameName}</div>}
              {p.slot && <span style={{ background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:8, padding:"2px 8px", fontSize:10, fontFamily:"Orbitron,sans-serif", color:"#a78bfa", flexShrink:0 }}>#{p.slot}</span>}
            </div>
            {p.players && p.players.map((pl,pi)=>(
              <div key={pi} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"rgba(255,255,255,0.85)", padding:"3px 0" }}>
                <span style={{ width:20, height:20, borderRadius:6, background:"rgba(124,58,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{pi+1}</span>
                {pl.name}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* JOIN BUTTON */}
      {m.status!=="finished" && (
        <div style={{ margin:"0 18px" }}>
          {joined ? (
            <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:16, padding:"14px 0", textAlign:"center", color:"#34d399", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700 }}>✅ আপনি যোগ দিয়েছেন</div>
          ) : m.status==="live" ? (
            <div style={{ background:"rgba(251,146,60,0.1)", border:"1px solid rgba(251,146,60,0.3)", borderRadius:16, padding:"14px 0", textAlign:"center", color:"#fb923c", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700 }}>🔒 ম্যাচ লাইভ — স্লট লক</div>
          ) : isFull ? (
            <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:16, padding:"14px 0", textAlign:"center", color:"#f87171", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700 }}>🔒 ম্যাচ ফুল</div>
          ) : (
            <button onClick={()=>setShowJoin(true)} style={{ width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:16, padding:"15px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(124,58,237,0.5)" }}>যোগ দিন →</button>
          )}
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoin && <JoinModal match={m} userData={userData} user={user} onClose={()=>setShowJoin(false)} onSuccess={()=>{ setShowJoin(false); showMsg("✅ সফলভাবে যোগ দিয়েছেন!", true); }} />}
    </div>
  );
}

// ═══════════ JOIN MODAL ═══════════
function JoinModal({ match, userData, user, onClose, onSuccess }) {
  const { font } = useLang();
  const mode = match.mode || "";
  const teamSize = match.teamSize || (/squad|4v4/i.test(mode) ? 4 : /duo|2v2/i.test(mode) ? 2 : 1);
  const needTeamName = teamSize > 1;

  const totalSlots = Math.ceil((match.maxPlayers||48) / teamSize);
  const takenSlots = {}; // slotNumber -> occupant
  (match.participants||[]).forEach(p => { if (p.slot) takenSlots[p.slot] = p; });

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState(Array.from({length:teamSize}, ()=>""));
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("slot"); // slot | form

  const inp = { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:font, marginBottom:10 };

  const updatePlayer = (i,v) => { const p=[...players]; p[i]=v; setPlayers(p); };

  const handleJoin = async () => {
    const validPlayers = players.filter(p=>p.trim());
    if (validPlayers.length < teamSize) { setMsg("সব প্লেয়ারের নাম দিন"); return; }
    if (needTeamName && !teamName.trim()) { setMsg("টিম নাম দিন"); return; }
    if (!selectedSlot) { setMsg("স্লট বেছে নিন"); return; }
    const fee = match.isFree ? 0 : Number(match.entryFee)*teamSize;
    if ((userData?.wallet||0) < fee) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }

    setLoading(true);
    try {
      // Re-check slot still free (avoid race)
      const freshSnap = await getDoc(doc(db,"matches",match.id));
      const freshParts = freshSnap.data()?.participants || [];
      if (freshParts.some(p => p.slot === selectedSlot)) {
        setMsg("এই স্লট এইমাত্র নেওয়া হয়েছে, অন্যটি বাছুন"); setLoading(false); setStep("slot"); setSelectedSlot(null); return;
      }

      const entry = teamSize===1
        ? { uid:user.uid, name:validPlayers[0], inGameName:validPlayers[0], slot:selectedSlot, joinedAt:new Date().toISOString() }
        : { uid:user.uid, teamName:needTeamName?teamName.trim():`${validPlayers[0]}'s Team`, players:validPlayers.map((n,i)=>({ name:n, uid:i===0?user.uid:null })), slot:selectedSlot, joinedAt:new Date().toISOString() };

      await updateDoc(doc(db,"matches",match.id), { participants:arrayUnion(entry), players:increment(teamSize) });

      if (fee > 0) {
        await updateDoc(doc(db,"users",user.uid), { wallet:increment(-fee) });
        await addDoc(collection(db,"transactions"), { uid:user.uid, type:"entry", amount:fee, matchTitle:match.title, status:"completed", createdAt:new Date().toISOString() });
      }
      await addDoc(collection(db,"notifications"), { uid:user.uid, type:"match", matchId:match.id, title:"✅ ম্যাচে যোগ দিয়েছেন", body:`"${match.title}" এ স্লট #${selectedSlot} এ যোগ দিয়েছেন`, read:false, createdAt:new Date().toISOString() });
      onSuccess();
    } catch(e) { setMsg("সমস্যা: "+e.message); }
    setLoading(false);
  };

  const fee = match.isFree ? 0 : Number(match.entryFee)*teamSize;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(13,8,32,0.98)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:480, maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, color:"#fff" }}>🎮 ম্যাচে যোগ দিন</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:8, width:30, height:30, color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:18 }}>{match.title} · {mode} · {teamSize===1?"Solo":teamSize===2?"Duo":"Squad"}</div>

        {msg && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#f87171", marginBottom:14 }}>{msg}</div>}

        {/* STEP 1: SLOT SELECTION */}
        {step==="slot" && (
          <>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:12 }}>📍 আপনার স্লট বেছে নিন ({Object.keys(takenSlots).length}/{totalSlots} পূর্ণ)</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:18 }}>
              {Array.from({length:totalSlots}, (_,idx)=>{
                const slotNum = idx+1;
                const taken = takenSlots[slotNum];
                const isSelected = selectedSlot===slotNum;
                return (
                  <button key={slotNum} disabled={!!taken} onClick={()=>setSelectedSlot(slotNum)} style={{
                    aspectRatio:"1", borderRadius:10, border:isSelected?"2px solid #a78bfa":taken?"1px solid rgba(248,113,113,0.2)":"1px solid rgba(255,255,255,0.12)",
                    background:isSelected?"rgba(167,139,250,0.25)":taken?"rgba(248,113,113,0.08)":"rgba(255,255,255,0.04)",
                    color:taken?"rgba(248,113,113,0.5)":isSelected?"#fff":"rgba(255,255,255,0.6)",
                    cursor:taken?"not-allowed":"pointer", fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700,
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:0,
                  }}>
                    {taken ? "🔒" : slotNum}
                    {taken && <span style={{ fontSize:7, lineHeight:1 }}>ভরা</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>selectedSlot?setStep("form"):setMsg("স্লট বেছে নিন")} style={{ width:"100%", background:selectedSlot?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(255,255,255,0.06)", border:"none", borderRadius:14, padding:"14px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {selectedSlot?`স্লট #${selectedSlot} — পরবর্তী →`:"স্লট বেছে নিন"}
            </button>
          </>
        )}

        {/* STEP 2: PLAYER INFO */}
        {step==="form" && (
          <>
            <div style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:10, padding:"8px 12px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#a78bfa", fontFamily:"Orbitron,sans-serif" }}>📍 স্লট #{selectedSlot}</span>
              <button onClick={()=>setStep("slot")} style={{ background:"none", border:"none", color:"rgba(167,139,250,0.7)", fontSize:11, cursor:"pointer" }}>বদলান</button>
            </div>

            {needTeamName && (
              <>
                <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>🛡️ টিম নাম</label>
                <input style={inp} value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="আপনার টিমের নাম" />
              </>
            )}

            <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>👤 প্লেয়ার ইন-গেম নাম</label>
            {players.map((p,i)=>(
              <input key={i} style={inp} value={p} onChange={e=>updatePlayer(i,e.target.value)} placeholder={`প্লেয়ার ${i+1} ইন-গেম নাম`} />
            ))}

            <div style={{ background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.2)", borderRadius:12, padding:"12px 14px", margin:"6px 0 16px" }}>
              <div style={{ fontSize:13, color:"#fb923c" }}>প্রবেশ মূল্য: <b>{fee===0?"ফ্রি":`৳${fee}`}</b>{teamSize>1&&fee>0?` (৳${match.entryFee} × ${teamSize})`:""}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>আপনার ব্যালেন্স: ৳{formatBalance(userData?.wallet||0)}</div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"13px 0", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12 }}>বাতিল</button>
              <button onClick={handleJoin} disabled={loading} style={{ flex:2, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:14, padding:"13px 0", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, opacity:loading?0.7:1, boxShadow:"0 4px 20px rgba(124,58,237,0.4)" }}>{loading?"যোগ হচ্ছে...":"এখনই যোগ দিন"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
