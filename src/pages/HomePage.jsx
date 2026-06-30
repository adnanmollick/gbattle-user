import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useSettings, useCategories } from "../hooks/useSettings";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const FIXED_CATS = [
  { id:"br", name:"BR Match", emoji:"🔫", color:"linear-gradient(135deg,#1e3a8a,#4c1d95)" },
  { id:"cs", name:"Clash Squad", emoji:"⚔️", color:"linear-gradient(135deg,#065f46,#1e3a8a)" },
  { id:"2v2", name:"2V2", emoji:"🤝", color:"linear-gradient(135deg,#7c2d12,#4c1d95)" },
  { id:"lone", name:"Lone Wolf", emoji:"🐺", color:"linear-gradient(135deg,#7c2d12,#1e3a8a)" },
];

export default function HomePage({ onNavigate, onMatchClick }) {
  const { theme } = useTheme();
  const settings = useSettings();
  const categories = useCategories();
  const [matches, setMatches] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [modeFilter, setModeFilter] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,"matches"), where("status","in",["upcoming","live"])),
      snap => {
        const all = snap.docs.map(d=>({id:d.id,...d.data()}));
        all.sort((a,b)=>new Date(a.scheduledAt||0)-new Date(b.scheduledAt||0));
        setMatches(all);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!settings.banners?.length) return;
    const t = setInterval(() => setBannerIdx(i=>(i+1)%settings.banners.length), 3500);
    return ()=>clearInterval(t);
  }, [settings.banners?.length]);

  const filtered = modeFilter ? matches.filter(m=>m.mode===modeFilter||m.maps?.includes(modeFilter)) : matches;
  const displayCats = categories.length > 0 ? categories : FIXED_CATS;

  return (
    <div style={{ fontFamily:"'Hind Siliguri',sans-serif" }}>
      {/* NOTICE */}
      {settings.noticeActive && settings.notice && (
        <div style={{ background:`${theme.primary}22`, borderBottom:`1px solid ${theme.primary}44`, padding:"8px 16px", fontSize:12, color:theme.primary, fontWeight:600 }}>📢 {settings.notice}</div>
      )}

      {/* BANNER SLIDER */}
      {settings.banners?.length > 0 && (
        <div style={{ position:"relative", height:200, overflow:"hidden", margin:"12px 16px", borderRadius:18 }}>
          {settings.banners.map((b,i)=>(
            <div key={i} onClick={()=>b.link&&window.open(b.link,"_blank")} style={{ position:"absolute", inset:0, opacity:i===bannerIdx?1:0, transition:"opacity 0.6s", cursor:b.link?"pointer":"default", background:b.image?`url(${b.image}) center/cover`:"linear-gradient(135deg,#4c1d95,#7c3aed)", borderRadius:18 }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)", borderRadius:18 }}></div>
              {(b.title||b.sub) && (
                <div style={{ position:"absolute", bottom:16, left:16, right:16 }}>
                  {b.title && <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:700, color:"#fff" }}>{b.title}</div>}
                  {b.sub && <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{b.sub}</div>}
                </div>
              )}
            </div>
          ))}
          {settings.banners.length>1 && (
            <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
              {settings.banners.map((_,i)=>(
                <div key={i} onClick={()=>setBannerIdx(i)} style={{ width:i===bannerIdx?20:6, height:6, borderRadius:3, background:i===bannerIdx?"#fff":"rgba(255,255,255,0.4)", transition:"all 0.3s", cursor:"pointer" }}></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCROLL TEXT */}
      {settings.scrollActive && settings.scrollText && (
        <div style={{ background:`${theme.primary}11`, borderTop:`1px solid ${theme.cardBorder}`, borderBottom:`1px solid ${theme.cardBorder}`, padding:"7px 0", overflow:"hidden", marginBottom:4 }}>
          <div style={{ display:"inline-block", whiteSpace:"nowrap", animation:"scroll 18s linear infinite", paddingLeft:"100%", fontSize:12, color:theme.primary, fontWeight:600 }}>
            📢 {settings.scrollText}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:theme.text, marginBottom:12 }}>🎮 ক্যাটাগরি</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
          {displayCats.map(c=>(
            <div key={c.id} onClick={()=>{ setModeFilter(modeFilter===c.name?null:c.name); onNavigate("matches"); }} style={{ background: c.thumbnail?`url(${c.thumbnail}) center/cover`:c.color||theme.accentGrad, borderRadius:14, aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", padding:"8px 4px", cursor:"pointer", position:"relative", overflow:"hidden", border:`1.5px solid ${modeFilter===c.name?theme.primary:theme.cardBorder}` }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)" }}></div>
              <div style={{ position:"relative", zIndex:1, fontSize:c.thumbnail?18:22, marginBottom:2 }}>{c.emoji||"🎮"}</div>
              <div style={{ position:"relative", zIndex:1, fontSize:9, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff", textAlign:"center", lineHeight:1.2 }}>{c.name}</div>
            </div>
          ))}
        </div>

        {/* UPCOMING MATCHES */}
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:theme.text, marginBottom:12 }}>⚡ আসন্ন ম্যাচ</div>
        {filtered.length===0 ? (
          <div style={{ background:theme.card, border:`1px solid ${theme.cardBorder}`, borderRadius:14, padding:30, textAlign:"center", color:theme.textFaint, fontSize:13 }}>কোনো ম্যাচ নেই</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12, paddingBottom:8 }}>
            {filtered.map(m=>(
              <div key={m.id} onClick={()=>onMatchClick(m)} style={{ background:theme.card, border:`1.5px solid ${m.status==="live"?theme.primary:theme.cardBorder}`, borderRadius:16, overflow:"hidden", cursor:"pointer" }}>
                <div style={{ height:110, background:m.thumbnail?`url(${m.thumbnail}) center/cover`:"linear-gradient(135deg,#1e3a8a,#4c1d95)", position:"relative" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.75),transparent)" }}></div>
                  {m.status==="live" && <div style={{ position:"absolute", top:8, left:10, background:"#ef4444", borderRadius:20, padding:"3px 10px", fontSize:10, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"#fff", display:"inline-block" }}></span>LIVE</div>}
                  <div style={{ position:"absolute", bottom:10, left:12, right:12 }}>
                    <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff" }}>{m.title}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{m.mode} · {Array.isArray(m.maps)?m.maps.join(", "):m.map}</div>
                  </div>
                </div>
                <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:12, color:theme.textDim }}>🏆 ৳{m.prize} · {m.isFree?"ফ্রি":`৳${m.entryFee}`} এন্ট্রি</div>
                  <div style={{ fontSize:12, color:theme.textFaint }}>{m.players||0}/{m.maxPlayers}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-100%)}}`}</style>
    </div>
  );
}
