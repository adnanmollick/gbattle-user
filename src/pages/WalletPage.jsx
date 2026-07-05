import { useState, useEffect } from "react";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { useSettings } from "../hooks/useSettings";
import { formatBalance } from "../utils/helpers";

// Payment method configs — each with its own brand color
const METHODS = {
  bKash:  { name:"bKash",  grad:"linear-gradient(135deg,#e2007a,#a50057)", color:"#e2007a", bg:"rgba(226,0,116,0.08)", border:"rgba(226,0,116,0.25)" },
  Nagad:  { name:"Nagad",  grad:"linear-gradient(135deg,#ec1c24,#f7941d)", color:"#f7941d", bg:"rgba(247,148,29,0.08)", border:"rgba(247,148,29,0.25)" },
  Rocket: { name:"Rocket", grad:"linear-gradient(135deg,#8c3494,#5b217d)", color:"#a855c7", bg:"rgba(140,52,148,0.08)", border:"rgba(140,52,148,0.25)" },
};

// Universal payment screen (works for all 3 methods)
function PayScreen({ method, amount, number, onClose, onVerify, loading }) {
  const [txID, setTxID] = useState("");
  const [copied, setCopied] = useState("");
  const m = METHODS[method];
  const copy = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(""),2000); };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"#12081a", border:`1.5px solid ${m.border}`, borderRadius:"24px 24px 0 0", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
        {/* HEADER */}
        <div style={{ background:m.grad, padding:"22px 20px 18px", borderRadius:"24px 24px 0 0", textAlign:"center", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:30, height:30, color:"#fff", fontSize:16, cursor:"pointer" }}>✕</button>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:22, fontWeight:900, color:"#fff", letterSpacing:2 }}>{m.name}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>G-BATTLE পেমেন্ট</div>
        </div>

        {/* AMOUNT */}
        <div style={{ margin:"16px 20px", background:m.bg, border:`1px solid ${m.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:m.grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💳</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>G-BATTLE</div>
            <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:800, color:m.color }}>৳{amount} BDT</div>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div style={{ margin:"0 20px 16px", background:m.bg, border:`1px solid ${m.border}`, borderRadius:14, padding:16 }}>
          {[
            { text:`আপনার ${m.name} Mobile App খুলুন`, bold:null },
            { text:"Choose: ", bold:"Send Money" },
            { text:"নম্বরে পাঠান:", bold:number, copy:"num" },
            { text:"পরিমাণ:", bold:`${amount} টাকা`, copy:"amt" },
            { text:"আপনার PIN দিয়ে confirm করুন", bold:null },
            { text:"Transaction ID নিচে দিন এবং ", bold:"Verify করুন" },
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<5?`1px solid ${m.border}`:"none" }}>
              <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.85)" }}>
                <span style={{ color:m.color, marginRight:6 }}>●</span>
                {item.text}{item.bold && <b style={{ color:"#fff", marginLeft:4 }}>{item.bold}</b>}
              </div>
              {item.copy && (
                <button onClick={()=>copy(item.copy==="num"?number:String(amount), item.copy)} style={{ background:copied===item.copy?"rgba(52,211,153,0.2)":"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"5px 12px", color:copied===item.copy?"#34d399":"#fff", fontSize:11, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, marginLeft:8 }}>
                  {copied===item.copy?"✓ কপি":"📋 Copy"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* TXID INPUT */}
        <div style={{ margin:"0 20px 24px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:m.color, fontFamily:"Orbitron,sans-serif", marginBottom:8 }}>Transaction ID</div>
          <input value={txID} onChange={e=>setTxID(e.target.value)} placeholder="Enter Transaction ID" style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1.5px solid ${m.border}`, borderRadius:12, padding:"13px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          <button onClick={()=>txID.trim()&&onVerify(txID.trim().toUpperCase())} disabled={loading} style={{ width:"100%", background:m.grad, border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontFamily:"Orbitron,sans-serif", fontWeight:800, fontSize:14, cursor:"pointer", marginTop:12, letterSpacing:1, opacity:loading?0.7:1 }}>{loading?"পাঠানো হচ্ছে...":"VERIFY"}</button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { user, userData } = useAuth();
  const { t, font } = useLang();
  const settings = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [modal, setModal] = useState(null); // deposit | withdraw
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [payMethod, setPayMethod] = useState(null); // shows PayScreen
  const [selectedMethod, setSelectedMethod] = useState("bKash");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db,"transactions"), where("uid","==",user.uid)), snap => {
      const all = snap.docs.map(d=>({id:d.id,...d.data()}));
      all.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      setTransactions(all);
    });
  }, [user]);

  const balance = Math.max(0, userData?.wallet||0);

  // Available payment methods (bKash always, Nagad/Rocket if enabled)
  const availableMethods = ["bKash"];
  if (settings.nagadEnabled) availableMethods.push("Nagad");
  if (settings.rocketEnabled) availableMethods.push("Rocket");

  const methodNumber = (mth) => mth==="bKash"?settings.bkashNumber : mth==="Nagad"?settings.nagadNumber : settings.rocketNumber;

  const handleDepositVerify = async (txID) => {
    if (!amount || Number(amount)<10) { setMsg("সর্বনিম্ন ৳১০"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db,"transactions"), {
        uid:user.uid, userName:userData?.name||"Player",
        type:"deposit", amount:Number(amount), txID,
        method:selectedMethod, status:"pending",
        autoVerify:settings.autoVerify||false, createdAt:new Date().toISOString(),
      });
      setPayMethod(null); setModal(null); setAmount("");
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
        method:selectedMethod, status:"pending", createdAt:new Date().toISOString(),
      });
      setMsg("✅ উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে!");
      setModal(null); setAmount(""); setAccountNumber("");
      setTimeout(()=>setMsg(""),3000);
    } catch(e) { setMsg("সমস্যা হয়েছে"); }
    setLoading(false);
  };

  const proceedDeposit = () => {
    if (!amount || Number(amount)<10) { setMsg("সর্বনিম্ন ৳১০"); return; }
    setPayMethod(selectedMethod);
  };

  const txMeta = (tx) => ({
    deposit:{ icon:"💚", label:"জমা", color:"#34d399", sign:"+" },
    withdraw:{ icon:"🔴", label:"উত্তোলন", color:"#f87171", sign:"-" },
    entry:{ icon:"🎮", label:"ম্যাচ ফি", color:"#f87171", sign:"-" },
    match_fee:{ icon:"🎮", label:"ম্যাচ ফি", color:"#f87171", sign:"-" },
    refund:{ icon:"↩️", label:"রিফান্ড", color:"#34d399", sign:"+" },
    prize:{ icon:"🏆", label:"পুরস্কার", color:"#fbbf24", sign:"+" },
  }[tx.type]||{ icon:"💰", label:tx.type, color:"#fff", sign:"" });

  const statusColor = (s) => ({ pending:"#fbbf24", approved:"#34d399", completed:"#34d399", rejected:"#f87171" }[s]||"#9ca3af");
  const statusLabel = (s) => ({ pending:"⏳ অপেক্ষমান", approved:"✅ অনুমোদিত", completed:"✅ সম্পন্ন", rejected:"❌ বাতিল" }[s]||s);

  const glass = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20 };
  const inp = { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"13px 16px", color:"#fff", fontSize:14, outline:"none", marginBottom:12, boxSizing:"border-box", fontFamily:font };

  return (
    <div style={{ fontFamily:font, paddingBottom:90, padding:"0 0 90px" }}>
      {/* BALANCE CARD */}
      <div style={{ margin:"16px 18px", background:"linear-gradient(135deg,#4c1d95,#7c3aed,#a78bfa)", borderRadius:24, padding:"28px 24px", position:"relative", overflow:"hidden", boxShadow:"0 8px 30px rgba(124,58,237,0.4)" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}></div>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", letterSpacing:2, fontFamily:"Orbitron,sans-serif", marginBottom:8 }}>TOTAL BALANCE</div>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:36, fontWeight:900, color:"#fff", marginBottom:4 }}>৳{formatBalance(balance)}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.7)", fontFamily:"Orbitron,sans-serif" }}>BDT</div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, position:"relative", zIndex:1 }}>
          <button onClick={()=>{setModal("deposit");setMsg("");setSelectedMethod("bKash");}} style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, padding:"10px 0", color:"#fff", cursor:"pointer", backdropFilter:"blur(10px)" }}>
            <div style={{ fontSize:18, marginBottom:3 }}>➕</div>
            <div style={{ fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700 }}>জমা</div>
          </button>
          <button onClick={()=>{setModal("withdraw");setMsg("");setSelectedMethod("bKash");}} style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, padding:"10px 0", color:"#fff", cursor:"pointer", backdropFilter:"blur(10px)" }}>
            <div style={{ fontSize:18, marginBottom:3 }}>➖</div>
            <div style={{ fontSize:11, fontFamily:"Orbitron,sans-serif", fontWeight:700 }}>উত্তোলন</div>
          </button>
        </div>
      </div>

      {msg && <div style={{ margin:"0 18px 14px", background:msg.startsWith("✅")?"rgba(52,211,153,0.12)":"rgba(248,113,113,0.12)", color:msg.startsWith("✅")?"#34d399":"#f87171", borderRadius:12, padding:"10px 14px", fontSize:13, textAlign:"center" }}>{msg}</div>}

      {/* DEPOSIT MODAL */}
      {modal==="deposit" && (
        <div style={{ margin:"0 18px 16px", ...glass, padding:20 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>💚 ডিপোজিট</div>

          {/* METHOD SELECTOR */}
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>পেমেন্ট মেথড</div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {availableMethods.map(mth => {
              const mc = METHODS[mth];
              const active = selectedMethod===mth;
              return (
                <button key={mth} onClick={()=>setSelectedMethod(mth)} style={{ flex:1, background:active?mc.grad:"rgba(255,255,255,0.05)", border:active?"none":"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 0", color:active?"#fff":"rgba(255,255,255,0.5)", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>{mc.name}</button>
              );
            })}
          </div>

          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>পরিমাণ (৳) — সর্বনিম্ন ১০</label>
          <input style={inp} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" type="number" />

          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button onClick={()=>{setModal(null);setAmount("");}} style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 0", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12 }}>বাতিল</button>
            <button onClick={proceedDeposit} style={{ flex:2, background:METHODS[selectedMethod].grad, border:"none", borderRadius:14, padding:"12px 0", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700 }}>পরবর্তী →</button>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {modal==="withdraw" && (
        <div style={{ margin:"0 18px 16px", ...glass, padding:20 }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:"#fff", marginBottom:16 }}>🔴 উত্তোলন</div>

          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>মেথড</div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {availableMethods.map(mth => {
              const mc = METHODS[mth];
              const active = selectedMethod===mth;
              return (
                <button key={mth} onClick={()=>setSelectedMethod(mth)} style={{ flex:1, background:active?mc.grad:"rgba(255,255,255,0.05)", border:active?"none":"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 0", color:active?"#fff":"rgba(255,255,255,0.5)", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>{mc.name}</button>
              );
            })}
          </div>

          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>{selectedMethod} নম্বর</label>
          <input style={inp} value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="01XXXXXXXXX" type="tel" />
          <label style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"block", marginBottom:6 }}>পরিমাণ (৳) — সর্বনিম্ন ৫০</label>
          <input style={inp} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" type="number" />
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>ব্যালেন্স: ৳{formatBalance(balance)}</div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>{setModal(null);setAmount("");setAccountNumber("");}} style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 0", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12 }}>বাতিল</button>
            <button onClick={handleWithdraw} disabled={loading} style={{ flex:2, background:"linear-gradient(135deg,#dc2626,#f87171)", border:"none", borderRadius:14, padding:"12px 0", color:"#fff", cursor:"pointer", fontFamily:"Orbitron,sans-serif", fontSize:12, fontWeight:700, opacity:loading?0.7:1 }}>{loading?"পাঠানো হচ্ছে...":"জমা দিন"}</button>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY */}
      {!modal && (
        <div style={{ margin:"16px 18px 0" }}>
          <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>📃 লেনদেনের ইতিহাস</div>
          {transactions.length===0 ? (
            <div style={{ ...glass, padding:30, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>কোনো লেনদেন নেই</div>
            </div>
          ) : transactions.map(tx=>{
            const meta = txMeta(tx);
            return (
              <div key={tx.id} style={{ ...glass, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${meta.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>{meta.label}{tx.method?` · ${tx.method}`:""}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{new Date(tx.createdAt).toLocaleDateString("bn-BD")}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:14, fontWeight:700, color:meta.color, marginBottom:4 }}>{meta.sign}৳{formatBalance(tx.amount)}</div>
                  <div style={{ fontSize:10, color:statusColor(tx.status), fontWeight:600 }}>{statusLabel(tx.status)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAYMENT SCREEN */}
      {payMethod && (
        <PayScreen
          method={payMethod}
          amount={amount}
          number={methodNumber(payMethod)||"01XXXXXXXXX"}
          onClose={()=>setPayMethod(null)}
          onVerify={handleDepositVerify}
          loading={loading}
        />
      )}
    </div>
  );
}
