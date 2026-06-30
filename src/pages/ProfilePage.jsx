import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../hooks/useSettings";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { compressSquare, formatBalance } from "../utils/helpers";

export default function ProfilePage() {
  const { user, userData, logout } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLang();
  const settings = useSettings();
  const [showEdit, setShowEdit] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUID, setEditUID] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIngame, setEditIngame] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [teamLogoPreview, setTeamLogoPreview] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const openEdit = () => {
    setEditName(userData?.name||"");
    setEditUID(userData?.ffUID||"");
    setEditPhone(userData?.phone||"");
    setEditIngame(userData?.ingameName||"");
    setEditTeamName(userData?.teamName||"");
    setAvatarPreview(null); setTeamLogoPreview(null); setBgPreview(null); setSaveMsg("");
    setShowEdit(true);
  };

  const handleImg = async (e, setFn, square=true, size=300) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (square) setFn(await compressSquare(f, size, 0.8));
      else {
        const r = new FileReader();
        r.onload = ev => setFn(ev.target.result);
        r.readAsDataURL(f);
      }
    } catch { setSaveMsg("ছবি প্রসেস ব্যর্থ"); }
  };

  const handleSave = async () => {
    if (!editName.trim()) { setSaveMsg("নাম খালি রাখা যাবে না"); return; }
    setSaving(true);
    try {
      const updates = { name:editName.trim(), ffUID:editUID.trim(), phone:editPhone.trim(), ingameName:editIngame.trim(), teamName:editTeamName.trim() };
      if (avatarPreview) updates.avatar = avatarPreview;
      if (teamLogoPreview) updates.teamLogo = teamLogoPreview;
      if (bgPreview) updates.profileBg = bgPreview;
      await updateDoc(doc(db,"users",user.uid), updates);
      setSaveMsg("✅ সেভ হয়েছে!");
      setTimeout(()=>{ setShowEdit(false); setSaveMsg(""); }, 1000);
    } catch(e) { setSaveMsg("সেভ করতে সমস্যা"); }
    setSaving(false);
  };

  const inp = { width:"100%", background:theme.inputBg, border:`1.5px solid ${theme.inputBorder}`, borderRadius:12, padding:"12px 14px", color:theme.text, fontSize:14, outline:"none", marginBottom:12, fontFamily:"'Hind Siliguri',sans-serif", boxSizing:"border-box" };
  const card = { background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:16, padding:18, marginBottom:14 };
  const row = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${theme.cardBorder}` };

  const supportLinks = [
    { key:"facebook", icon:"📘", label:"Facebook" },
    { key:"whatsapp", icon:"💬", label:"WhatsApp" },
    { key:"telegram", icon:"✈️", label:"Telegram" },
    { key:"youtube", icon:"▶️", label:"YouTube" },
    { key:"phone", icon:"📞", label:"ফোন" },
  ].filter(s=>settings.support?.[s.key]);

  return (
    <div style={{ fontFamily:"'Hind Siliguri',sans-serif" }}>
      {/* PROFILE HEADER with custom BG */}
      <div style={{ background: userData?.profileBg?`url(${userData.profileBg}) center/cover`:"linear-gradient(135deg,#4c1d95,#7c3aed)", borderRadius:"0 0 24px 24px", padding:"24px 20px", textAlign:"center", position:"relative", overflow:"hidden", minHeight:160 }}>
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }}></div>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ width:80, height:80, borderRadius:20, background:"rgba(255,255,255,0.15)", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontFamily:"Orbitron,sans-serif", fontWeight:900, color:"#fff", overflow:"hidden", border:"2px solid rgba(255,255,255,0.3)" }}>
            {userData?.avatar ? <img src={userData.avatar} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="av"/> : (userData?.name||"P")[0].toUpperCase()}
          </div>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:700, color:"#fff" }}>{userData?.name||"Player"}</div>
          {userData?.teamName && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:6 }}>
              {userData?.teamLogo && <img src={userData.teamLogo} style={{ width:22,height:22,borderRadius:"50%",objectFit:"cover" }} alt="tl"/>}
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:600 }}>🛡️ {userData.teamName}</span>
            </div>
          )}
          <button onClick={openEdit} style={{ marginTop:12, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"6px 18px", color:"#fff", fontFamily:"'Hind Siliguri',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>✏️ এডিট প্রোফাইল</button>
        </div>
      </div>

      <div style={{ padding:"16px 18px" }}>
        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
          {[["💰",`৳${formatBalance(userData?.wallet||0)}`,"ব্যালেন্স","#4ade80"],["🎮",userData?.matches||0,"ম্যাচ","#a78bfa"],["🏆",userData?.wins||0,"জয়","#fbbf24"]].map(([ic,v,l,c])=>(
            <div key={l} style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:14, padding:"14px 6px", textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{ic}</div>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:10, color:theme.textFaint, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* GAME INFO */}
        <div style={card}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, marginBottom:8, color:theme.text }}>🎯 গেম তথ্য</div>
          <div style={row}><span style={{ fontSize:13, color:theme.textDim }}>ইন-গেম নাম</span><span style={{ fontSize:13, color:theme.text, fontWeight:600 }}>{userData?.ingameName||"—"}</span></div>
          <div style={{ ...row, borderBottom:"none" }}><span style={{ fontSize:13, color:theme.textDim }}>FF UID</span><span style={{ fontSize:13, color:theme.text, fontWeight:600 }}>{userData?.ffUID||"—"}</span></div>
        </div>

        {/* TEAM INFO */}
        {userData?.teamName && (
          <div style={card}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, marginBottom:8, color:theme.text }}>🛡️ টিম তথ্য</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {userData?.teamLogo && <img src={userData.teamLogo} style={{ width:46,height:46,borderRadius:12,objectFit:"cover",border:`1.5px solid ${theme.cardBorder}` }} alt="tl"/>}
              <div style={{ fontSize:16, fontWeight:700, color:theme.text }}>{userData.teamName}</div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        <div style={card}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, marginBottom:8, color:theme.text }}>⚙️ {t("theme")} & {t("language")}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:12, borderBottom:`1px solid ${theme.cardBorder}` }}>
            <span style={{ fontSize:13, color:theme.textDim }}>{mode==="purple"?"🟣 Purple":"🔴 Red"} {t("theme")}</span>
            <button onClick={toggleTheme} style={{ width:56, height:30, borderRadius:20, border:"none", cursor:"pointer", background:mode==="red"?"rgba(248,113,113,0.3)":"rgba(167,139,250,0.3)", position:"relative" }}>
              <div style={{ position:"absolute", top:4, left:mode==="red"?29:4, width:22, height:22, borderRadius:"50%", background:theme.accentGrad, transition:"all 0.3s", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>{mode==="red"?"🔴":"🟣"}</div>
            </button>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12 }}>
            <span style={{ fontSize:13, color:theme.textDim }}>{lang==="bn"?"🇧🇩 বাংলা":"🇬🇧 English"}</span>
            <button onClick={toggleLang} style={{ width:56, height:30, borderRadius:20, border:"none", cursor:"pointer", background:theme.accentGlow, position:"relative" }}>
              <div style={{ position:"absolute", top:4, left:lang==="en"?29:4, width:22, height:22, borderRadius:"50%", background:theme.accentGrad, transition:"all 0.3s", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>{lang==="en"?"EN":"বাং"}</div>
            </button>
          </div>
        </div>

        {/* RULES + SUPPORT */}
        <div style={card}>
          {settings.rules && <div onClick={()=>setShowRules(true)} style={{ ...row, cursor:"pointer" }}><span style={{ fontSize:13, color:theme.textDim }}>📋 নিয়মাবলী</span><span style={{ fontSize:16, color:theme.textFaint }}>›</span></div>}
          <div onClick={()=>setShowSupport(true)} style={{ ...row, borderBottom:"none", cursor:"pointer" }}><span style={{ fontSize:13, color:theme.textDim }}>🎧 সাপোর্ট</span><span style={{ fontSize:16, color:theme.textFaint }}>›</span></div>
        </div>

        <button onClick={logout} style={{ width:"100%", background:"rgba(248,113,113,0.1)", border:"1.5px solid rgba(248,113,113,0.25)", borderRadius:14, padding:"14px 0", color:"#f87171", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", marginBottom:8 }}>🚪 লগআউট</button>
        <div style={{ textAlign:"center", fontSize:10, color:theme.textFaint, fontFamily:"Orbitron,sans-serif", marginBottom:20 }}>G-BATTLE v5.0</div>
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, marginBottom:16, color:theme.text }}>✏️ প্রোফাইল এডিট</div>

            {/* Profile BG */}
            <div style={{ fontSize:11, color:theme.textFaint, marginBottom:6, fontFamily:"Orbitron,sans-serif" }}>প্রোফাইল ব্যাকগ্রাউন্ড</div>
            <label style={{ display:"block", marginBottom:12, cursor:"pointer" }}>
              <div style={{ height:80, borderRadius:12, background:bgPreview?`url(${bgPreview}) center/cover`:userData?.profileBg?`url(${userData.profileBg}) center/cover`:theme.accentGrad, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.7)", fontSize:12, border:`1.5px dashed ${theme.cardBorder}`, overflow:"hidden" }}>
                {!bgPreview&&!userData?.profileBg&&"📷 ব্যাকগ্রাউন্ড আপলোড"}
              </div>
              <input type="file" accept="image/*" onChange={e=>handleImg(e,setBgPreview,false)} style={{ display:"none" }} />
            </label>

            {/* Avatar */}
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <label style={{ cursor:"pointer", display:"inline-block" }}>
                <div style={{ width:72, height:72, borderRadius:18, background:theme.accentGrad, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, overflow:"hidden", border:`2px solid ${theme.cardBorder}` }}>
                  {avatarPreview?<img src={avatarPreview} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="av"/>:userData?.avatar?<img src={userData.avatar} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="av"/>:"📷"}
                </div>
                <div style={{ fontSize:11, color:theme.primary, marginTop:4 }}>প্রোফাইল ছবি</div>
                <input type="file" accept="image/*" onChange={e=>handleImg(e,setAvatarPreview,true,300)} style={{ display:"none" }} />
              </label>
            </div>

            <input style={inp} placeholder="নাম" value={editName} onChange={e=>setEditName(e.target.value)} />
            <input style={inp} placeholder="ইন-গেম নাম" value={editIngame} onChange={e=>setEditIngame(e.target.value)} />
            <input style={inp} placeholder="FF UID" value={editUID} onChange={e=>setEditUID(e.target.value)} />
            <input style={inp} placeholder="ফোন নম্বর" value={editPhone} onChange={e=>setEditPhone(e.target.value)} />

            {/* Team */}
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:11, color:theme.textFaint, marginBottom:8 }}>🛡️ টিম তথ্য</div>
            <input style={inp} placeholder="টিম নাম" value={editTeamName} onChange={e=>setEditTeamName(e.target.value)} />
            <label style={{ display:"block", marginBottom:14, cursor:"pointer" }}>
              <div style={{ height:60, borderRadius:12, background:teamLogoPreview?`url(${teamLogoPreview}) center/cover`:userData?.teamLogo?`url(${userData.teamLogo}) center/cover`:theme.inputBg, display:"flex", alignItems:"center", justifyContent:"center", color:theme.textFaint, fontSize:12, border:`1.5px dashed ${theme.cardBorder}` }}>
                {!teamLogoPreview&&!userData?.teamLogo&&"📷 টিম লোগো আপলোড"}
              </div>
              <input type="file" accept="image/*" onChange={e=>handleImg(e,setTeamLogoPreview,true,200)} style={{ display:"none" }} />
            </label>

            {saveMsg && <div style={{ background:saveMsg.startsWith("✅")?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color:saveMsg.startsWith("✅")?"#4ade80":"#f87171", borderRadius:10, padding:"10px 14px", fontSize:12, marginBottom:12, textAlign:"center" }}>{saveMsg}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowEdit(false)} style={{ flex:1, background:theme.inputBg, border:"none", borderRadius:12, padding:"13px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer" }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving} style={{ flex:2, background:theme.accentGrad, border:"none", borderRadius:12, padding:"13px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", opacity:saving?0.7:1 }}>{saving?"সেভ হচ্ছে...":"✅ সেভ করুন"}</button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT MODAL */}
      {showSupport && (
        <div onClick={()=>setShowSupport(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:480 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, marginBottom:16, color:theme.text }}>🎧 সাপোর্ট</div>
            {supportLinks.length===0 ? <div style={{ textAlign:"center", color:theme.textFaint, fontSize:13, padding:"20px 0" }}>কোনো যোগাযোগ মাধ্যম নেই</div>
            : supportLinks.map(s=>(
              <a key={s.key} href={s.key==="phone"?`tel:${settings.support[s.key]}`:settings.support[s.key]} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:theme.card, borderRadius:12, marginBottom:10, textDecoration:"none", border:`1px solid ${theme.cardBorder}` }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:theme.text }}>{s.label}</div><div style={{ fontSize:11, color:theme.textFaint }}>{settings.support[s.key]}</div></div>
                <span style={{ color:theme.textFaint }}>›</span>
              </a>
            ))}
            <button onClick={()=>setShowSupport(false)} style={{ width:"100%", background:theme.inputBg, border:"none", borderRadius:12, padding:"12px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer", marginTop:6 }}>বন্ধ করুন</button>
          </div>
        </div>
      )}

      {/* RULES MODAL */}
      {showRules && (
        <div onClick={()=>setShowRules(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:480, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, marginBottom:16, color:theme.text }}>📋 নিয়মাবলী</div>
            <div style={{ fontSize:13, color:theme.textDim, lineHeight:1.9, whiteSpace:"pre-line", marginBottom:16 }}>{settings.rules}</div>
            <button onClick={()=>setShowRules(false)} style={{ width:"100%", background:theme.inputBg, border:"none", borderRadius:12, padding:"12px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer" }}>বন্ধ করুন</button>
          </div>
        </div>
      )}
    </div>
  );
}
