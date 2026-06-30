import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSettings } from "../hooks/useSettings";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { formatBalance, fullNumber } from "../utils/helpers";

function BkashPayScreen({ amount, onClose, onVerify, bkashNumber }) {
  const [txID, setTxID] = useState("");
  const [copied, setCopied] = useState("");

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(()=>setCopied(""),2000);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"#1a0a0f", border:"1.5px solid rgba(226,0,116,0.3)", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
        {/* HEADER */}
        <div style={{ background:"linear-gradient(135deg,#e2007a,#a50057)", padding:"22px 20px 18px", borderRadius:"24px 24px 0 0", textAlign:"center", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:30, height:30, color:"#fff", fontSize:16, cursor:"pointer" }}>✕</button>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:22, fontWeight:900, color:"#fff", letterSpacing:2 }}>bKash</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2, fontFamily:"'Hind Siliguri',sans-serif" }}>G-BATTLE পেমেন্ট</div>
        </div>

        {/* AMOUNT DISPLAY */}
        <div style={{ margin:"16px 20px", background:"rgba(226,0,116,0.08)", border:"1px solid rgba(226,0,116,0.2)", borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#e2007a,#a50057)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚡</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"'Hind Siliguri',sans-serif" }}>G-BATTLE</div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:800, color:"#e2007a" }}>৳{amount} BDT</div>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div style={{ margin:"0 20px 16px", background:"linear-gradient(135deg,rgba(226,0,116,0.15),rgba(165,0,87,0.1))", border:"1px solid rgba(226,0,116,0.25)", borderRadius:14, padding:16 }}>
          {[
            { text:"আপনার bKash Mobile App খুলুন", bold:null },
            { text:"Choose: ", bold:"Send Money" },
            { text:"নম্বরে পাঠান:", bold:bkashNumber, copy:"num" },
            { text:"পরিমাণ:", bold:`${amount} টাকা`, copy:"amt" },
            { text:"এখন আপনার bKash PIN দিয়ে confirm করুন", bold:null },
            { text:"Transaction ID নিচের বক্সে দিন এবং ", bold:"Verify করুন", bold2:true },
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<5?"1px solid rgba(226,0,116,0.15)":"none" }}>
              <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:"'Hind Siliguri',sans-serif" }}>
                <span style={{ color:"#e2007a", marginRight:6 }}>●</span>
                {item.text}{item.bold && <b style={{ color:"#fff", marginLeft:4 }}>{item.bold}</b>}
              </div>
              {item.copy && (
                <button onClick={()=>copy(item.copy==="num"?bkashNumber:String(amount), item.copy)} style={{ background:copied===item.copy?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"5px 12px", color:copied===item.copy?"#4ade80":"#fff", fontSize:11, cursor:"pointer", fontFamily:"'Hind Siliguri',sans-serif", whiteSpace:"nowrap", flexShrink:0, marginLeft:8 }}>
                  {copied===item.copy?"✓ কপি":"📋 Copy"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* TRX INPUT */}
        <div style={{ margin:"0 20px 20px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#e2007a", fontFamily:"Orbitron,sans-serif", marginBottom:8 }}>Transaction ID</div>
          <input value={txID} onChange={e=>setTxID(e.target.value)} placeholder="Enter Transaction ID" style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(226,0,116,0.4)", borderRadius:12, padding:"13px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"'Hind Siliguri',sans-serif" }} />
          <button onClick={()=>txID.trim()&&onVerify(txID.trim().toUpperCase())} style={{ width:"100%", background:"linear-gradient(135deg,#e2007a,#a50057)", border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontWeight:800, fontSize:14, cursor:"pointer", marginTop:12, letterSpacing:1 }}>VERIFY</button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const settings = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showBkash, setShowBkash] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db,"transactions"), where("uid","==",user.uid)),
      snap => {
        const all = snap.docs.map(d=>({id:d.id,...d.data()}));
        all.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        setTransactions(all);
      }
    );
    return unsub;
  }, [user]);

  const balance = Math.max(0, userData?.wallet||0);

  const handleDepositVerify = async (txID) => {
    if (!amount || Number(amount)<10) { setMsg("সর্বনিম্ন ৳১০"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db,"transactions"), {
        uid:user.uid, userName:userData?.name||"Player", phone:userData?.phone||"",
        type:"deposit", amount:Number(amount), txID,
        method:"bKash", status:"pending", autoVerify:settings.autoVerify||false,
        createdAt:new Date().toISOString(),
      });
      setShowBkash(false); setModal(null); setAmount("");
      setMsg("✅ ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে!");
      setTimeout(()=>setMsg(""),3000);
    } catch(e) { setMsg("সমস্যা হয়েছে"); }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!amount||!accountNumber) { setMsg("সব তথ্য পূরণ করুন"); return; }
    if (Number(amount)<50) { setMsg("সর্বনিম্ন উত্তোলন ৳৫০"); return; }
    if (Number(amount)>balance) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db,"transactions"), {
        uid:user.uid, userName:userData?.name||"Player",
        type:"withdraw", amount:Number(amount), accountNumber:accountNumber.trim(),
        method:"bKash", status:"pending", createdAt:new Date().toISOString(),
      });
      setMsg("✅ উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে!");
      setModal(null); setAmount(""); setAccountNumber("");
      setTimeout(()=>setMsg(""),3000);
    } catch(e) { setMsg("সমস্যা হয়েছে"); }
    setLoading(false);
  };

  const txMeta = (t) => {
    const map = {
      deposit:{ icon:"💚", label:"জমা", color:"#4ade80", sign:"+" },
      withdraw:{ icon:"🔴", label:"উত্তোলন", color:"#f87171", sign:"-" },
      match_fee:{ icon:"🎮", label:"ম্যাচ ফি", color:"#f87171", sign:"-" },
      prize:{ icon:"🏆", label:"পুরস্কার", color:"#fbbf24", sign:"+" },
    };
    return map[t.type]||{ icon:"💰", label:t.type, color:theme.text, sign:"" };
  };

  const statusColor = (s) => ({ pending:"#fbbf24", approved:"#4ade80", completed:"#4ade80", rejected:"#f87171" }[s]||"#9ca3af");
  const statusLabel = (s) => ({ pending:"⏳ অপেক্ষমান", approved:"✅ অনুমোদিত", completed:"✅ সম্পন্ন", rejected:"❌ বাতিল" }[s]||s);

  const inp = { width:"100%", background:theme.inputBg, border:`1.5px solid ${theme.inputBorder}`, borderRadius:12, padding:"12px 14px", color:theme.text, fontSize:14, outline:"none", marginBottom:12, fontFamily:"'Hind Siliguri',sans-serif", boxSizing:"border-box" };

  return (
    <div style={{ padding:"16px 18px", fontFamily:"'Hind Siliguri',sans-serif" }}>
      {/* BALANCE */}
      <div style={{ background:"linear-gradient(135deg,#4c1d95,#7c3aed)", borderRadius:20, padding:24, marginBottom:18, position:"relative", overflow:"hidden", boxShadow:`0 10px 30px ${theme.accentGlow}` }}>
        <div style={{ position:"absolute", top:-30, right:-20, fontSize:90, opacity:.1 }}>💰</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontFamily:"Orbitron,sans-serif", letterSpacing:1, marginBottom:6 }}>মোট ব্যালেন্স</div>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:34, fontWeight:900, color:"#fff" }}>৳{fullNumber(balance)}</div>
      </div>

      {msg && <div style={{ background:msg.startsWith("✅")?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color:msg.startsWith("✅")?"#4ade80":"#f87171", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:14, textAlign:"center" }}>{msg}</div>}

      {/* ACTIONS */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
        <button onClick={()=>{setModal("deposit");setMsg("");}} style={{ background:"rgba(74,222,128,0.1)", border:"1.5px solid rgba(74,222,128,0.25)", borderRadius:16, padding:"16px 0", color:"#4ade80", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:22 }}>➕</span> জমা
        </button>
        <button onClick={()=>{setModal("withdraw");setMsg("");}} style={{ background:"rgba(248,113,113,0.1)", border:"1.5px solid rgba(248,113,113,0.25)", borderRadius:16, padding:"16px 0", color:"#f87171", fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:22 }}>➖</span> উত্তোলন
        </button>
      </div>

      {/* HISTORY */}
      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, marginBottom:12, color:theme.text }}>📃 লেনদেনের ইতিহাস</div>
      {transactions.length===0 ? (
        <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:12, padding:24, textAlign:"center", color:theme.textFaint, fontSize:13 }}>কোনো লেনদেন নেই</div>
      ) : (
        <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:16, overflow:"hidden" }}>
          {transactions.map(t=>{
            const meta=txMeta(t);
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom:`1px solid ${theme.cardBorder}` }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${meta.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:theme.text }}>{meta.label}</div>
                  <div style={{ fontSize:11, color:statusColor(t.status), marginTop:1 }}>{statusLabel(t.status)}</div>
                  <div style={{ fontSize:10, color:theme.textFaint, marginTop:1 }}>{new Date(t.createdAt).toLocaleDateString("bn-BD")}{t.txID?` · ${t.txID}`:""}</div>
                </div>
                <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:meta.color, flexShrink:0 }}>{meta.sign}৳{formatBalance(t.amount)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEPOSIT AMOUNT MODAL */}
      {modal==="deposit" && !showBkash && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:480 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, marginBottom:16, color:theme.text }}>➕ কত টাকা জমা দেবেন?</div>
            <input style={inp} type="number" placeholder="পরিমাণ (সর্বনিম্ন ৳১০)" value={amount} onChange={e=>setAmount(e.target.value)} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setModal(null);setAmount("");}} style={{ flex:1, background:theme.inputBg, border:"none", borderRadius:12, padding:"13px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer" }}>বাতিল</button>
              <button onClick={()=>{ if(Number(amount)<10){setMsg("সর্বনিম্ন ৳১০");return;} setShowBkash(true); }} style={{ flex:2, background:"linear-gradient(135deg,#e2007a,#a50057)", border:"none", borderRadius:12, padding:"13px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>পরবর্তী →</button>
            </div>
          </div>
        </div>
      )}

      {/* BKASH PAY SCREEN */}
      {showBkash && (
        <BkashPayScreen amount={amount} bkashNumber={settings.bkashNumber||"01998111334"} onClose={()=>{setShowBkash(false);setModal(null);setAmount("");}} onVerify={handleDepositVerify} />
      )}

      {/* WITHDRAW MODAL */}
      {modal==="withdraw" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:theme.cardSolid, border:`1.5px solid ${theme.cardBorder}`, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:480 }}>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:15, fontWeight:700, marginBottom:16, color:theme.text }}>➖ টাকা উত্তোলন</div>
            <input style={inp} type="number" placeholder="পরিমাণ (সর্বনিম্ন ৳৫০)" value={amount} onChange={e=>setAmount(e.target.value)} />
            <input style={inp} placeholder="আপনার bKash নম্বর (01XXXXXXXXX)" value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} />
            <div style={{ fontSize:12, color:theme.textFaint, marginBottom:12 }}>উপলব্ধ: ৳{fullNumber(balance)}</div>
            {msg && <div style={{ background:"rgba(248,113,113,0.12)", color:"#f87171", borderRadius:10, padding:"10px 14px", fontSize:12, marginBottom:12, textAlign:"center" }}>{msg}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setModal(null);setAmount("");setAccountNumber("");}} style={{ flex:1, background:theme.inputBg, border:"none", borderRadius:12, padding:"13px 0", color:theme.text, fontFamily:"Orbitron,sans-serif", fontSize:12, cursor:"pointer" }}>বাতিল</button>
              <button onClick={handleWithdraw} disabled={loading} style={{ flex:2, background:"linear-gradient(135deg,#dc2626,#f87171)", border:"none", borderRadius:12, padding:"13px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1 }}>{loading?"অপেক্ষা করুন...":"✅ উত্তোলন করুন"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
