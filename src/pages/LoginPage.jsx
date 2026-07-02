import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { auth, db } from "../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const glass = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, backdropFilter:"blur(20px)" };
const inp = { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"13px 16px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color 0.2s, box-shadow 0.2s" };

export default function LoginPage({ onLogin }) {
  const theme = useTheme();
  const { t } = useLang();
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(""); // available | taken | checking
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const usernameTimer = useRef(null);

  const showMsg = (m, isErr=true) => { setMsg({text:m,err:isErr}); setTimeout(()=>setMsg(""),3000); };

  const checkUsername = async (val) => {
    if (!val || val.length < 3) { setUsernameStatus(""); return; }
    setUsernameStatus("checking");
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      const q = query(collection(db,"users"), where("username","==",val.toLowerCase()));
      const snap = await getDocs(q);
      setUsernameStatus(snap.empty ? "available" : "taken");
    }, 600);
  };

  const handleRegister = async () => {
    if (!email||!password||!username) { showMsg("সব তথ্য দিন"); return; }
    if (usernameStatus==="taken") { showMsg(t("usernameTaken")); return; }
    if (usernameStatus!=="available") { showMsg("ইউজারনেম চেক করুন"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db,"users",cred.user.uid), {
        name: username, username: username.toLowerCase(),
        email, balance:0, totalWins:0, totalMatches:0, totalEarned:0,
        avatar:"", createdAt:new Date().toISOString(), role:"user",
      });
      onLogin && onLogin();
    } catch(e) { showMsg(e.message); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email||!password) { showMsg("সব তথ্য দিন"); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin && onLogin();
    } catch(e) { showMsg("ইমেইল বা পাসওয়ার্ড ভুল"); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const userRef = doc(db,"users",result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const baseUsername = result.user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g,"");
        await setDoc(userRef, {
          name:result.user.displayName||"User", username:baseUsername,
          email:result.user.email, balance:0, totalWins:0, totalMatches:0, totalEarned:0,
          avatar:result.user.photoURL||"", createdAt:new Date().toISOString(), role:"user",
        });
      }
      onLogin && onLogin();
    } catch(e) { showMsg("Google লগইন ব্যর্থ"); }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { showMsg("ইমেইল দিন"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showMsg("রিসেট লিংক পাঠানো হয়েছে ✅", false);
    } catch(e) { showMsg("ইমেইল পাওয়া যায়নি"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20, background:"#06040f", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.15) 0%, transparent 70%)" }}></div>

      <div style={{ width:"100%", maxWidth:380, position:"relative", zIndex:1 }}>
        {/* LOGO */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:70, height:70, borderRadius:20, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 12px", boxShadow:"0 0 30px rgba(124,58,237,0.5)" }}>⚡</div>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:22, fontWeight:900, color:"#fff", letterSpacing:2 }}>G-BATTLE</div>
          <div style={{ fontSize:12, color:"rgba(167,139,250,0.7)", marginTop:4 }}>FREE FIRE TOURNAMENT</div>
        </div>

        {/* CARD */}
        <div style={{ ...glass, padding:24 }}>
          {msg && <div style={{ background:msg.err?"rgba(248,113,113,0.1)":"rgba(52,211,153,0.1)", border:`1px solid ${msg.err?"rgba(248,113,113,0.3)":"rgba(52,211,153,0.3)"}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:msg.err?"#f87171":"#34d399", marginBottom:16, textAlign:"center" }}>{msg.text}</div>}

          {mode==="forgot" ? (
            <>
              <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>🔑 {t("resetPassword")}</div>
              <input style={inp} value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("email")} type="email" />
              <button onClick={handleForgot} disabled={loading} style={{ width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:12, padding:"13px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:12 }}>{loading?"পাঠানো হচ্ছে...":t("sendResetLink")}</button>
              <button onClick={()=>setMode("login")} style={{ width:"100%", background:"none", border:"none", color:"rgba(167,139,250,0.7)", fontSize:12, cursor:"pointer", marginTop:12 }}>← {t("back")}</button>
            </>
          ) : (
            <>
              {/* TABS */}
              <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:12, padding:4, marginBottom:20 }}>
                {["login","register"].map(m=>(
                  <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:11, fontWeight:700, background:mode===m?"linear-gradient(135deg,#7c3aed,#a78bfa)":"transparent", color:mode===m?"#fff":"rgba(255,255,255,0.4)", transition:"all 0.2s" }}>{m==="login"?t("login"):t("register")}</button>
                ))}
              </div>

              {/* FIELDS */}
              {mode==="register" && (
                <div style={{ marginBottom:12 }}>
                  <input style={{ ...inp, borderColor:usernameStatus==="taken"?"rgba(248,113,113,0.5)":usernameStatus==="available"?"rgba(52,211,153,0.5)":"rgba(255,255,255,0.1)" }} value={username} onChange={e=>{ setUsername(e.target.value); checkUsername(e.target.value); }} placeholder={t("username")} />
                  {usernameStatus==="checking" && <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>⏳ {t("usernameChecking")}</div>}
                  {usernameStatus==="available" && <div style={{ fontSize:11, color:"#34d399", marginTop:4 }}>✅ {t("usernameAvailable")}</div>}
                  {usernameStatus==="taken" && <div style={{ fontSize:11, color:"#f87171", marginTop:4 }}>❌ {t("usernameTaken")}</div>}
                </div>
              )}
              <input style={{ ...inp, marginBottom:12 }} value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("email")} type="email" />
              <input style={inp} value={password} onChange={e=>setPassword(e.target.value)} placeholder={t("password")} type="password" />

              {mode==="login" && (
                <button onClick={()=>setMode("forgot")} style={{ background:"none", border:"none", color:"rgba(167,139,250,0.7)", fontSize:11, cursor:"pointer", marginTop:6, padding:0 }}>{t("forgotPassword")}</button>
              )}

              <button onClick={mode==="login"?handleLogin:handleRegister} disabled={loading} style={{ width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:12, padding:"13px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:14, boxShadow:"0 4px 20px rgba(124,58,237,0.4)" }}>{loading?"লোড হচ্ছে...":mode==="login"?t("login"):t("register")}</button>

              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}></div>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{t("orContinueWith")}</span>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}></div>
              </div>

              <button onClick={handleGoogle} disabled={loading} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 0", color:"#fff", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t("googleLogin")}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`input:focus{border-color:rgba(167,139,250,0.6)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.15)!important;}`}</style>
    </div>
  );
}
