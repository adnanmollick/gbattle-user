import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSettings } from "../hooks/useSettings";
import { db } from "../firebase/config";
import { doc, onSnapshot, updateDoc, arrayUnion, increment, addDoc, collection } from "firebase/firestore";
import { formatBalance } from "../utils/helpers";

export default function MatchDetailPage({ match, onBack }) {
  const { user, userData, guest } = useAuth();
  const { theme } = useTheme();
  const settings = useSettings();
  const [m, setM] = useState(match);
  const [teamName, setTeamName] = useState("");
  const [playerInfo, setPlayerInfo] = useState([
    { name:"", uid:"" },{ name:"", uid:"" },{ name:"", uid:"" },{ name:"", uid:"" }
  ]);
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [msg, setMsg] = useState("");
  const [roomCopied, setRoomCopied] = useState("");

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?match=${m.id}`;
    const shareText = `🎮 ${m.title}\n🏆 পুরস্কার: ৳${m.prize} | ${m.isFree?"ফ্রি এন্ট্রি":`এন্ট্রি: ৳${m.entryFee}`}\n\nএখনই যোগ দিন G-BATTLE এ!`;
    if (navigator.share) {
      try {
        await navigator.share({ title:m.title, text:shareText, url:shareUrl });
      } catch(e) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setMsg("✅ লিংক কপি হয়েছে!");
      setTimeout(()=>setMsg(""),2500);
    }
  };

  useEffect(() => {
    if (!match?.id) return;
    const unsub = onSnapshot(doc(db,"matches",match.id), snap=>{
      if (snap.exists()) setM({ id:snap.id, ...snap.data() });
    });
    return unsub;
  }, [match?.id]);

  const joined = user && (m.participants||[]).some(p=>p.uid===user.uid);
  const now = new Date();
  const roomVisible = joined && m.roomID && (m.roomReleased || (m.roomReleaseAt && new Date(m.roomReleaseAt)<=now));

  const handleJoin = async () => {
    if (!user) return;
    if (!teamName.trim()) { setMsg("টিম নাম দিন"); return; }
    if (m.requirePlayerInfo) {
      const valid = playerInfo.filter(p=>p.name.trim());
      if (valid.length===0) { setMsg("অন্তত একজন প্লেয়ারের তথ্য দিন"); return; }
    }
    if (!m.isFree && (userData?.wallet||0) < m.entryFee) { setMsg(`পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজন: ৳${m.entryFee}`); return; }
    setJoining(true);
    try {
      const participant = {
        uid:user.uid, name:userData?.name||"Player",
        phone:userData?.phone||"", teamName:teamName.trim(),
        joinedAt:new Date().toISOString(),
        ...(m.requirePlayerInfo?{ players:playerInfo.filter(p=>p.name.trim()) }:{})
      };
      await updateDoc(doc(db,"matches",m.id), {
        participants: arrayUnion(participant),
        players: increment(1),
      });
      if (!m.isFree) {
        await updateDoc(doc(db,"users",user.uid), { wallet:Math.max(0,(userData.wallet||0)-m.entryFee), matches:increment(1) });
        await addDoc(collection(db,"transactions"), {
          uid:user.uid, userName:userData?.name, type:"match_fee",
          amount:m.entryFee, matchTitle:m.title, status:"completed",
          createdAt:new Date().toISOString(),
        });
      } else {
        await updateDoc(doc(db,"users",user.uid), { matches:increment(1) });
      }
      // Notification
      await addDoc(collection(db,"notifications"), {
        uid:user.uid, type:"match", matchId:m.id, title:"✅ ম্যাচে যোগ দিয়েছেন",
        body:`আপনি "${m.title}" ম্যাচে যোগ দিয়েছেন`,
        read:false, createdAt:new Date().toISOString(),
      });
      setMsg("✅ সফলভাবে যোগ দিয়েছেন!"); setShowJoin(false);
    } catch(e) { setMsg("সমস্যা হয়েছে: "+e.message); }
    setJoining(false);
  };

  const inp = { width:"100%", background:theme.inputBg, border:`1.5px solid ${theme.inputBorder}`, borderRadius:12, padding:"11px 14px", color:theme.text, fontSize:13, outline:"none", marginBottom:10, fontFamily:"'Hind Siliguri',sans-serif", boxSizing:"border-box" };

  return (
    <div style={{ fontFamily:"'Hind Siliguri',sans-serif" }}>
      {/* HERO */}
      <div style={{ height:180, background:m.thumbnail?`url(${m.thumbnail}) center/cover`:"linear-gradient(135deg,#1e3a8a,#4c1d95)", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }}></div>
        {m.status==="live" && <div style={{ position:"absolute", top:12, left:14, background:"#ef4444", borderRadius:20, padding:"4px 12px", fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:6,height:6,borderRadius:"50%",background:"#fff",display:"inline-block" }}></span>LIVE</div>}
        {/* SHARE BUTTON */}
        <button onClick={handleShare} style={{ position:"absolute", top:12, right:14, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:12, width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
        <div style={{ position:"absolute", bottom:14, left:16, right:16 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:700, color:"#fff" }}>{m.title}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{m.mode} · {Array.isArray(m.maps)?m.maps.join(", "):m.map}</div>
        </div>
      </div>

      <div style={{ padding:"16px 18px" }}>
        {msg && <div style={{ background:msg.startsWith("✅")?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color:msg.startsWith("✅")?"#4ade80":"#f87171", borderRadius:10, padding:"10px 14px", fontSize:12, marginBottom:14, textAlign:"center" }}>{msg}</div>}

        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
          {[["🏆",`৳${m.prize}`,"পুরস্কার"],["💰",m.isFree?"ফ্রি":`৳${m.entryFee}`,"এন্ট্রি"],["👥",`${m.players||0}/${m.maxPlayers}`,"প্লেয়ার"],["💀",`৳${m.perKill||0}`,"প্রতি কিল"]].map(([ic,v,l])=>(
            <div key={l} style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:12, padding:"10px 4px", textAlign:"center" }}>
              <div style={{ fontSize:16 }}>{ic}</div>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:11, fontWeight:700, color:theme.text, marginTop:4 }}>{v}</div>
              <div style={{ fontSize:9, color:theme.textFaint, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* ROOM ID */}
        {roomVisible && (
          <div style={{ background:"rgba(74,222,128,0.1)", border:"1.5px solid rgba(74,222,128,0.3)", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:"#4ade80", marginBottom:10 }}>🔑 Room তথ্য</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:m.roomPass?8:0 }}>
              <div style={{ fontSize:13, color:theme.text }}>ID: <b style={{ fontFamily:"Orbitron,sans-serif", color:"#4ade80" }}>{m.roomID}</b></div>
              <button onClick={()=>{ navigator.clipboard.writeText(m.roomID); setRoomCopied("id"); setTimeout(()=>setRoomCopied(""),2000); }} style={{ background:roomCopied==="id"?"rgba(74,222,128,0.25)":"rgba(255,255,255,0.08)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:8, padding:"5px 12px", color:"#4ade80", fontSize:11, cursor:"pointer", fontFamily:"'Hind Siliguri',sans-serif" }}>{roomCopied==="id"?"✓ কপি":"📋 কপি"}</button>
            </div>
            {m.roomPass && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:13, color:theme.text }}>Pass: <b style={{ fontFamily:"Orbitron,sans-serif", color:"#4ade80" }}>{m.roomPass}</b></div>
                <button onClick={()=>{ navigator.clipboard.writeText(m.roomPass); setRoomCopied("pass"); setTimeout(()=>setRoomCopied(""),2000); }} style={{ background:roomCopied==="pass"?"rgba(74,222,128,0.25)":"rgba(255,255,255,0.08)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:8, padding:"5px 12px", color:"#4ade80", fontSize:11, cursor:"pointer", fontFamily:"'Hind Siliguri',sans-serif" }}>{roomCopied==="pass"?"✓ কপি":"📋 কপি"}</button>
              </div>
            )}
          </div>
        )}
        {joined && !roomVisible && m.roomID && (
          <div style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:12, padding:"12px 14px", marginBottom:16, fontSize:12, color:"#fbbf24", textAlign:"center" }}>
            ⏳ Room ID শীঘ্রই প্রকাশিত হবে
          </div>
        )}

        {/* PRIZES */}
        {m.prizes?.length>0 && (
          <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, color:theme.text, marginBottom:10 }}>🏆 পুরস্কার তালিকা</div>
            {m.prizes.map((p,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${theme.cardBorder}` }}>
                <span style={{ fontSize:13, color:theme.textDim }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"🎖️"} {p.place}</span>
                <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#4ade80" }}>৳{p.amount}</span>
              </div>
            ))}
          </div>
        )}

        {/* JOIN BUTTON */}
        {m.status!=="finished" && (
          joined ? (
            <div style={{ background:"rgba(74,222,128,0.1)", border:"1.5px solid rgba(74,222,128,0.3)", borderRadius:14, padding:"14px 0", textAlign:"center", color:"#4ade80", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:14 }}>✅ যোগ দিয়েছেন</div>
          ) : guest ? (
            <div style={{ background:theme.accentGrad, borderRadius:14, padding:"14px 0", textAlign:"center", color:"#fff", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>লগইন করে যোগ দিন</div>
          ) : (m.players||0)>=m.maxPlayers ? (
            <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:14, padding:"14px 0", textAlign:"center", color:"#f87171", fontFamily:"Orbitron,sans-serif", fontSize:13 }}>❌ ম্যাচ পূর্ণ</div>
          ) : (
            <button onClick={()=>setShowJoin(true)} style={{ width:"100%", background:theme.accentGrad, border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:`0 6px 20px ${theme.accentGlow}` }}>
              {m.isFree?"🎮 ফ্রিতে যোগ দিন":`🎮 ৳${m.entryFee} দিয়ে যোগ দিন`}
            </button>
          )
        )}
      </div>

      {/* JOIN MODAL */}
      {showJoin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:"20px 20px 0 0", padding:22, width:"100%", maxWidth:480, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:theme.text, marginBottom:14 }}>🎮 ম্যাচে যোগ দিন</div>
            <input style={inp} placeholder="টিম নাম / ইন-গেম নাম *" value={teamName} onChange={e=>setTeamName(e.target.value)} />

            {m.requirePlayerInfo && (
              <>
                <div style={{ fontSize:12, color:theme.textFaint, marginBottom:8, fontFamily:"Orbitron,sans-serif" }}>প্লেয়ারদের তথ্য (সর্বোচ্চ ৪ জন)</div>
                {playerInfo.map((p,i)=>(
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <input style={{ ...inp, flex:2, marginBottom:0 }} placeholder={`প্লেয়ার ${i+1} নাম`} value={p.name} onChange={e=>{ const arr=[...playerInfo]; arr[i]={...arr[i],name:e.target.value}; setPlayerInfo(arr); }} />
                    <input style={{ ...inp, flex:1, marginBottom:0 }} placeholder="FF UID" value={p.uid} onChange={e=>{ const arr=[...playerInfo]; arr[i]={...arr[i],uid:e.target.value}; setPlayerInfo(arr); }} />
                  </div>
                ))}
              </>
            )}

            <div style={{ fontSize:12, color:theme.textFaint, marginBottom:14 }}>ফোন: {userData?.phone||"—"}</div>
            {!m.isFree && <div style={{ fontSize:12, color:theme.textFaint, marginBottom:14 }}>এন্ট্রি ফি: ৳{m.entryFee} · ব্যালেন্স: ৳{formatBalance(userData?.wallet||0)}</div>}

            {msg && <div style={{ background:"rgba(248,113,113,0.12)", color:"#f87171", borderRadius:10, padding:"9px 12px", fontSize:12, marginBottom:12, textAlign:"center" }}>{msg}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setShowJoin(false);setMsg("");}} style={{ flex:1, background:theme.inputBg, border:"none", borderRadius:12, padding:"13px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer" }}>বাতিল</button>
              <button onClick={handleJoin} disabled={joining} style={{ flex:2, background:theme.accentGrad, border:"none", borderRadius:12, padding:"13px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", opacity:joining?0.7:1 }}>{joining?"যোগ হচ্ছে...":"✅ নিশ্চিত করুন"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
