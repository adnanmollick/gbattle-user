import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const S = {
  page: { minHeight:"100vh", background:"#0a0118", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" },
  blob1: { position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#6d28d9,transparent)", top:-100, left:-100, opacity:0.4, filter:"blur(80px)", pointerEvents:"none" },
  blob2: { position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,#4c1d95,transparent)", bottom:-80, right:-80, opacity:0.35, filter:"blur(70px)", pointerEvents:"none" },
  logo: { fontFamily:"Orbitron,sans-serif", fontSize:36, fontWeight:900, background:"linear-gradient(135deg,#a78bfa,#fff,#c4b5fd)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:3, marginBottom:4, position:"relative", zIndex:1 },
  sub: { color:"rgba(255,255,255,0.4)", fontSize:12, fontFamily:"Orbitron,sans-serif", letterSpacing:2, marginBottom:32, textTransform:"uppercase", position:"relative", zIndex:1 },
  card: { background:"rgba(255,255,255,0.06)", backdropFilter:"blur(24px)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:20, padding:28, width:"100%", maxWidth:380, position:"relative", zIndex:1 },
  tabs: { display:"flex", background:"rgba(0,0,0,0.3)", borderRadius:12, padding:4, gap:4, marginBottom:18 },
  tab: (a) => ({ flex:1, padding:"9px 0", borderRadius:9, border:"none", fontFamily:"Orbitron,sans-serif", fontSize:10, fontWeight:700, letterSpacing:1, cursor:"pointer", background: a?"linear-gradient(135deg,#7c3aed,#a78bfa)":"transparent", color: a?"#fff":"rgba(255,255,255,0.4)", boxShadow: a?"0 4px 14px rgba(124,58,237,0.4)":"none" }),
  input: { width:"100%", background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none", marginBottom:12, fontFamily:"Inter,sans-serif", boxSizing:"border-box" },
  btnP: { width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", border:"none", borderRadius:12, padding:"13px 0", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:12, letterSpacing:1, cursor:"pointer", marginBottom:12, boxShadow:"0 6px 20px rgba(124,58,237,0.4)" },
  btnG: { width:"100%", background:"rgba(255,255,255,0.09)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"12px 0", fontFamily:"Inter,sans-serif", fontWeight:600, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:12 },
  err: { background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", borderRadius:10, padding:"10px 14px", fontSize:12, marginBottom:12, textAlign:"center" },
};

export default function LoginPage() {
  const { loginGoogle, loginEmail, registerEmail, enterGuest, banned } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try { await loginGoogle(); }
    catch(e) { setErr("Google লগইন ব্যর্থ হয়েছে"); }
    setLoading(false);
  };

  const validPhone = (p) => /^01[3-9]\d{8}$/.test(p.trim());

  const handleEmail = async () => {
    setErr("");
    if (!email || !pass) { setErr("সব তথ্য পূরণ করুন"); return; }
    if (mode === "register") {
      if (!name.trim()) { setErr("নাম দিন"); return; }
      if (!validPhone(phone)) { setErr("সঠিক ফোন নম্বর দিন (017xxxxxxxx)"); return; }
    }
    setLoading(true);
    try {
      if (mode === "login") await loginEmail(email, pass);
      else await registerEmail(email, pass, name, phone.trim());
    } catch(e) {
      const m = e.code === "auth/email-already-in-use" ? "এই ইমেইল আগে থেকে আছে"
        : e.code === "auth/weak-password" ? "পাসওয়ার্ড দুর্বল (৬+ অক্ষর)"
        : e.code === "auth/invalid-credential" ? "ইমেইল বা পাসওয়ার্ড ভুল"
        : "সমস্যা হয়েছে, আবার চেষ্টা করুন";
      setErr(m);
    }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={S.blob1}></div>
      <div style={S.blob2}></div>
      <div style={S.logo}>G-BATTLE</div>
      <div style={S.sub}>Battle • Win • Earn</div>

      <div style={S.card}>
        <div style={S.tabs}>
          <button style={S.tab(mode==="login")} onClick={()=>{setMode("login");setErr("");}}>লগইন</button>
          <button style={S.tab(mode==="register")} onClick={()=>{setMode("register");setErr("");}}>রেজিস্টার</button>
        </div>

        {banned && <div style={S.err}>🚫 আপনার অ্যাকাউন্ট ব্যান করা হয়েছে</div>}
        {err && <div style={S.err}>{err}</div>}

        {mode==="register" && (
          <input style={S.input} placeholder="আপনার নাম" value={name} onChange={e=>setName(e.target.value)} />
        )}
        {mode==="register" && (
          <input style={S.input} placeholder="ফোন নম্বর (017xxxxxxxx) *" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={11} inputMode="numeric" />
        )}
        <input style={S.input} placeholder="ইমেইল" value={email} onChange={e=>setEmail(e.target.value)} type="email" />
        <input style={S.input} placeholder="পাসওয়ার্ড" value={pass} onChange={e=>setPass(e.target.value)} type="password" />

        <button style={{...S.btnP, opacity:loading?0.6:1}} onClick={handleEmail} disabled={loading}>
          {loading ? "অপেক্ষা করুন..." : mode==="login" ? "লগইন করুন" : "অ্যাকাউন্ট তৈরি করুন"}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"4px 0 14px" }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}></div>
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>অথবা</span>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}></div>
        </div>

        <button style={S.btnG} onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google দিয়ে লগইন
        </button>

        <button onClick={enterGuest} style={{ width:"100%", background:"transparent", color:"rgba(255,255,255,0.5)", border:"none", padding:"10px", fontSize:13, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
          👀 অতিথি হিসেবে দেখুন →
        </button>
      </div>
    </div>
  );
}
