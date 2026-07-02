import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase/config";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { formatBalance } from "../utils/helpers";

const glass = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, backdropFilter:"blur(20px)" };
const inp = { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

export default function ProfilePage({ onNavigate }) {
  const theme = useTheme();
  const { t, lang, toggleLang, font } = useLang();
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState("");
  const [pwMode, setPwMode] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db,"users",user.uid), snap => {
      if (snap.exists()) { const d=snap.data(); setUserData(d); setName(d.name||""); }
    });
  }, [user]);

  const showMsg = (m, ok=false) => { setMsg({text:m,ok}); setTimeout(()=>setMsg(""),3000); };

  const saveProfile = async () => {
    if (!name.trim()) { showMsg("নাম দিন"); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db,"users",user.uid), { name:name.trim(), avatar });
      showMsg("✅ প্রোফাইল আপডেট হয়েছে", true);
      setEditing(false);
    } catch(e) { showMsg("সমস্যা হয়েছে"); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!oldPw||!newPw) { showMsg("সব তথ্য দিন"); return; }
    if (newPw.length < 6) { showMsg("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"); return; }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, oldPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      showMsg("✅ পাসওয়ার্ড পরিবর্তন হয়েছে", true);
      setPwMode(false); setOldPw(""); setNewPw("");
    } catch(e) { showMsg("পুরনো পাসওয়ার্ড ভুল"); }
    setSaving(false);
  };

  const searchPlayer = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const q = query(collection(db,"users"), where("username","==",searchQ.toLowerCase().trim()));
      const snap = await getDocs(q);
      setSearchResult(snap.empty ? null : { id:snap.docs[0].id,...snap.docs[0].data() });
      if (snap.empty) showMsg("প্লেয়ার পাওয়া যায়নি");
    } catch(e) { showMsg("সমস্যা হয়েছে"); }
    setSearching(false);
  };

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 300;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const s = Math.min(img.width,img.height);
        const ox = (img.width-s)/2; const oy = (img.height-s)/2;
        ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size);
        setAvatar(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const stats = [
    { icon:"🎮", label:t("matchesPlayed"), value:userData?.totalMatches||0 },
    { icon:"🏆", label:t("totalWins"), value:userData?.totalWins||0 },
    { icon:"💰", label:t("totalEarned"), value:`৳${formatBalance(userData?.totalEarned||0)}` },
  ];

  return (
    <div style={{ fontFamily:font, paddingBottom:90 }}>
      {/* HEADER */}
      <div style={{ padding:"20px 18px 0", textAlign:"center" }}>
        {/* AVATAR */}
        <div style={{ position:"relative", width:90, height:90, margin:"0 auto 12px" }}>
          <div style={{ width:90, height:90, borderRadius:"50%", background:userData?.avatar?"transparent":"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"3px solid rgba(167,139,250,0.4)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(124,58,237,0.4)", animation:"glowPulse 3s ease infinite" }}>
            {userData?.avatar ? <img src={userData.avatar} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:36 }}>👤</span>}
          </div>
          {editing && (
            <label style={{ position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
              <span style={{ fontSize:14 }}>📷</span>
              <input type="file" accept="image/*" onChange={handleAvatar} style={{ display:"none" }} />
            </label>
          )}
        </div>

        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:700, color:"#fff" }}>{userData?.name||"Player"}</div>
        <div style={{ fontSize:12, color:"rgba(167,139,250,0.7)", marginTop:2 }}>@{userData?.username||""}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{user?.email}</div>
      </div>

      {msg && (
        <div style={{ margin:"12px 18px 0", background:msg.ok?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)", border:`1px solid ${msg.ok?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)"}`, borderRadius:12, padding:"10px 14px", fontSize:13, color:msg.ok?"#34d399":"#f87171", textAlign:"center" }}>{msg.text}</div>
      )}

      {/* STATS */}
      <div style={{ display:"flex", gap:10, margin:"16px 18px 0" }}>
        {stats.map((s,i) => (
          <div key={i} style={{ flex:1, ...glass, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#a78bfa" }}>{s.value}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* EDIT PROFILE */}
      <div style={{ margin:"14px 18px 0", ...glass, padding:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:editing?14:0 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff" }}>👤 {t("editProfile")}</div>
          <button onClick={()=>setEditing(!editing)} style={{ background:editing?"rgba(248,113,113,0.1)":"rgba(167,139,250,0.1)", border:`1px solid ${editing?"rgba(248,113,113,0.3)":"rgba(167,139,250,0.3)"}`, borderRadius:10, padding:"6px 14px", color:editing?"#f87171":"#a78bfa", fontSize:11, cursor:"pointer", fontFamily:"Orbitron,sans-serif" }}>{editing?"বাতিল":"এডিট"}</button>
        </div>
        {editing && (
          <>
            <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>নাম</label>
            <input style={{ ...inp, marginBottom:14 }} value={name} onChange={e=>setName(e.target.value)} placeholder="আপনার নাম" />
            <button onClick={saveProfile} disabled={saving} style={{ width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:14, padding:"12px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", opacity:saving?0.7:1 }}>{saving?"সেভ হচ্ছে...":t("save")}</button>
          </>
        )}
      </div>

      {/* CHANGE PASSWORD */}
      {!user?.providerData?.[0]?.providerId?.includes("google") && (
        <div style={{ margin:"10px 18px 0", ...glass, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:pwMode?14:0 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff" }}>🔑 {t("changePassword")}</div>
            <button onClick={()=>setPwMode(!pwMode)} style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:10, padding:"6px 14px", color:"#a78bfa", fontSize:11, cursor:"pointer", fontFamily:"Orbitron,sans-serif" }}>{pwMode?"বাতিল":"পরিবর্তন"}</button>
          </div>
          {pwMode && (
            <>
              <input style={{ ...inp, marginBottom:10 }} value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="পুরনো পাসওয়ার্ড" type="password" />
              <input style={{ ...inp, marginBottom:14 }} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="নতুন পাসওয়ার্ড" type="password" />
              <button onClick={changePassword} disabled={saving} style={{ width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:14, padding:"12px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>{saving?"পরিবর্তন হচ্ছে...":"পাসওয়ার্ড পরিবর্তন করুন"}</button>
            </>
          )}
        </div>
      )}

      {/* PLAYER SEARCH */}
      <div style={{ margin:"10px 18px 0", ...glass, padding:18 }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>🔍 {t("searchPlayer")}</div>
        <div style={{ display:"flex", gap:8 }}>
          <input style={{ ...inp, flex:1 }} value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="@username" onKeyDown={e=>e.key==="Enter"&&searchPlayer()} />
          <button onClick={searchPlayer} disabled={searching} style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:14, padding:"0 16px", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:11, fontWeight:700 }}>{searching?"...":"খুঁজুন"}</button>
        </div>
        {searchResult && (
          <div style={{ marginTop:12, background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:searchResult.avatar?"transparent":"linear-gradient(135deg,#7c3aed,#a78bfa)", overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {searchResult.avatar ? <img src={searchResult.avatar} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:20 }}>👤</span>}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{searchResult.name}</div>
              <div style={{ fontSize:12, color:"rgba(167,139,250,0.7)" }}>@{searchResult.username}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>🎮 {searchResult.totalMatches||0} ম্যাচ · 🏆 {searchResult.totalWins||0} জয়</div>
            </div>
          </div>
        )}
      </div>

      {/* LANGUAGE */}
      <div style={{ margin:"10px 18px 0", ...glass, padding:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", marginBottom:2 }}>🌐 {t("language")}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{lang==="bn"?"বাংলা (Bangla)":"English"}</div>
          </div>
          <button onClick={toggleLang} style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:14, padding:"10px 20px", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, boxShadow:"0 4px 14px rgba(124,58,237,0.4)" }}>{lang==="bn"?"EN":"বাং"}</button>
        </div>
      </div>

      {/* LOGOUT */}
      <div style={{ margin:"10px 18px 0" }}>
        <button onClick={logout} style={{ width:"100%", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:20, padding:"14px 0", color:"#f87171", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          🚪 {t("logout")}
        </button>
      </div>
    </div>
  );
}
