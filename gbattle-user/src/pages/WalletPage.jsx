import { useState, useEffect, memo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot, collection, query, where, orderBy, addDoc } from "firebase/firestore";
import { useSettings } from "../hooks/useSettings";
import { formatBalance } from "../utils/helpers";

const glass = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" };
const inp = { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"13px 16px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

export default function WalletPage() {
  const theme = useTheme();
  const { t, font } = useLang();
  const { user } = useAuth();
  const settings = useSettings();
  const [userData, setUserData] = useState(null);
  const [txs, setTxs] = useState([]);
  const [tab, setTab] = useState("main"); // main | deposit | withdraw
  const [amount, setAmount] = useState("");
  const [bkashNum, setBkashNum] = useState("");
  const [txId, setTxId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u = onSnapshot(doc(db,"users",user.uid), s => s.exists()&&setUserData(s.data()));
    const t = onSnapshot(query(collection(db,"transactions"), where("uid","==",user.uid), orderBy("createdAt","desc")), s => setTxs(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => { u(); t(); };
  }, [user]);

  const showMsg = (m, ok=false) => { setMsg({text:m,ok}); setTimeout(()=>setMsg(""),3000); };

  const handleDeposit = async () => {
    if (!amount||!txId) { showMsg("সব তথ্য দিন"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db,"transactions"), {
        uid:user.uid, type:"deposit", amount:Number(amount), txId,
        method:"bKash", status:"pending", createdAt:new Date().toISOString(),
      });
      showMsg("✅ ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে!", true);
      setAmount(""); setTxId(""); setTab("main");
    } catch(e) { showMsg("সমস্যা হয়েছে"); }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!amount||!bkashNum) { showMsg("সব তথ্য দিন"); return; }
    if (Number(amount) > (userData?.balance||0)) { showMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    if (Number(amount) < 50) { showMsg("সর্বনিম্ন ৳50"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db,"transactions"), {
        uid:user.uid, type:"withdraw", amount:Number(amount),
        accountNumber:bkashNum, method:"bKash", status:"pending",
        createdAt:new Date().toISOString(),
      });
      showMsg("✅ উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে!", true);
      setAmount(""); setBkashNum(""); setTab("main");
    } catch(e) { showMsg("সমস্যা হয়েছে"); }
    setLoading(false);
  };

  const balance = userData?.balance || 0;
  const statusColor = (s) => s==="approved"?"#34d399":s==="rejected"?"#f87171":"#fbbf24";
  const statusBg = (s) => s==="approved"?"rgba(52,211,153,0.1)":s==="rejected"?"rgba(248,113,113,0.1)":"rgba(251,191,36,0.1)";
  const statusLabel = (s) => s==="approved"?t("approved"):s==="rejected"?t("rejected"):t("pending");

  return (
    <div style={{ fontFamily:font, paddingBottom:90, padding:"0 0 90px" }}>
      {/* BALANCE CARD */}
      <div style={{ margin:"16px 18px", background:"linear-gradient(135deg,#4c1d95,#7c3aed,#a78bfa)", borderRadius:24, padding:"28px 24px", position:"relative", overflow:"hidden", boxShadow:"0 8px 30px rgba(124,58,237,0.4)" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}></div>
        <div style={{ position:"absolute", bottom:-30, left:-10, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}></div>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", letterSpacing:2, fontFamily:"Orbitron,sans-serif", marginBottom:8 }}>TOTAL BALANCE</div>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:36, fontWeight:900, color:"#fff", marginBottom:4 }}>{formatBalance(balance)}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.7)", fontFamily:"Orbitron,sans-serif" }}>BDT</div>
        </div>
        {/* ACTION BUTTONS */}
        <div style={{ display:"flex", gap:10, marginTop:20, position:"relative", zIndex:1 }}>
          {[
            { id:"deposit", icon:"＋", label:t("deposit") },
            { id:"withdraw", icon:"－", label:t("withdraw") },
          ].map(b=>(
            <button key={b.id} onClick={()=>setTab(b.id)} style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, padding:"10px 0", color:"#fff", cursor:"pointer", backdropFilter:"blur(10px)" }}>
              <div style={{ fontSize:18, marginBottom:3 }}>{b.icon}</div>
              <div style={{ fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700 }}>{b.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* DEPOSIT FORM */}
      {tab==="deposit" && (
        <div style={{ margin:"0 18px", ...glass, padding:20 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>💚 {t("depositTitle")}</div>
          {msg && <div style={{ background:msg.ok?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)", border:`1px solid ${msg.ok?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)"}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:msg.ok?"#34d399":"#f87171", marginBottom:14 }}>{msg.text}</div>}
          
          {/* bKash number to send */}
          <div style={{ background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>bKash নম্বরে পাঠান</div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:18, fontWeight:800, color:"#34d399" }}>{settings.bkashNumber||"01XXXXXXXXX"}</div>
          </div>

          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>{t("amount")} (৳)</label>
          <input style={{ ...inp, marginBottom:12 }} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" type="number" />
          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>{t("txId")}</label>
          <input style={{ ...inp, marginBottom:16 }} value={txId} onChange={e=>setTxId(e.target.value)} placeholder="8XXXXXXX" />

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setTab("main")} style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 0", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12 }}>{t("cancel")}</button>
            <button onClick={handleDeposit} disabled={loading} style={{ flex:2, background:"linear-gradient(135deg,#059669,#34d399)", border:"none", borderRadius:14, padding:"12px 0", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, opacity:loading?0.7:1 }}>{loading?"পাঠানো হচ্ছে...":t("submit")}</button>
          </div>
        </div>
      )}

      {/* WITHDRAW FORM */}
      {tab==="withdraw" && (
        <div style={{ margin:"0 18px", ...glass, padding:20 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>🔴 {t("withdrawTitle")}</div>
          {msg && <div style={{ background:msg.ok?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)", border:`1px solid ${msg.ok?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)"}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:msg.ok?"#34d399":"#f87171", marginBottom:14 }}>{msg.text}</div>}

          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>{t("bkashNumber")}</label>
          <input style={{ ...inp, marginBottom:12 }} value={bkashNum} onChange={e=>setBkashNum(e.target.value)} placeholder="01XXXXXXXXX" type="tel" />
          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>{t("amount")} (৳) — সর্বনিম্ন ৳50</label>
          <input style={{ ...inp, marginBottom:6 }} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" type="number" />
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:16 }}>ব্যালেন্স: ৳{formatBalance(balance)}</div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setTab("main")} style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 0", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12 }}>{t("cancel")}</button>
            <button onClick={handleWithdraw} disabled={loading} style={{ flex:2, background:"linear-gradient(135deg,#dc2626,#f87171)", border:"none", borderRadius:14, padding:"12px 0", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, opacity:loading?0.7:1 }}>{loading?"পাঠানো হচ্ছে...":t("submit")}</button>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY */}
      {tab==="main" && (
        <div style={{ margin:"16px 18px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff" }}>{t("recentTx")}</div>
          </div>
          {txs.length===0 ? (
            <div style={{ ...glass, padding:30, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>{t("noTx")}</div>
            </div>
          ) : txs.map(tx=>(
            <div key={tx.id} style={{ ...glass, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:tx.type==="deposit"?"rgba(52,211,153,0.15)":tx.type==="withdraw"?"rgba(248,113,113,0.15)":"rgba(251,191,36,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                {tx.type==="deposit"?"💚":tx.type==="withdraw"?"🔴":"🏆"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>
                  {tx.type==="deposit"?t("deposit"):tx.type==="withdraw"?t("withdraw"):"পুরস্কার"}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{new Date(tx.createdAt).toLocaleDateString("bn-BD")}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:tx.type==="deposit"||tx.type==="prize"?"#34d399":"#f87171", marginBottom:4 }}>
                  {tx.type==="deposit"||tx.type==="prize"?"+":"-"}৳{formatBalance(tx.amount)}
                </div>
                <div style={{ background:statusBg(tx.status), borderRadius:20, padding:"2px 10px", fontSize:10, color:statusColor(tx.status), fontFamily:"Orbitron,sans-serif", fontWeight:700, display:"inline-block" }}>{statusLabel(tx.status)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
