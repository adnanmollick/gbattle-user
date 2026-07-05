import { useState, useEffect, memo } from "react";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { useSettings, useCategories } from "../hooks/useSettings";

// Default categories (preloaded, admin can add real ones to override)
const FIXED_CATS = [
  { id:"br", name:"BR Match", emoji:"🔫", color:"linear-gradient(135deg,#1e3a8a,#4c1d95)" },
  { id:"cs", name:"Clash Squad", emoji:"⚔️", color:"linear-gradient(135deg,#065f46,#1e3a8a)" },
  { id:"2v2", name:"CS 2V2", emoji:"🤝", color:"linear-gradient(135deg,#7c2d12,#4c1d95)" },
  { id:"lone", name:"Lone Wolf", emoji:"🐺", color:"linear-gradient(135deg,#7c2d12,#1e3a8a)" },
  { id:"lone1", name:"Lone Wolf 1v1", emoji:"⚡", color:"linear-gradient(135deg,#4c1d95,#065f46)" },
  { id:"free", name:"Free Match", emoji:"🎁", color:"linear-gradient(135deg,#065f46,#7c2d12)" },
];

export default function HomePage({ onNavigate, onCategoryClick, onMatchClick }) {
  const { t, font } = useLang();
  const { user } = useAuth();
  const settings = useSettings();
  const categories = useCategories();
  const [userData, setUserData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db,"users",user.uid), snap => snap.exists()&&setUserData(snap.data()));
  }, [user]);

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

  const banners = settings.banners || [];
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setBannerIdx(i => (i+1) % banners.length), 3500);
    return () => clearInterval(id);
  }, [banners.length]);

  const displayCats = categories.length > 0 ? categories : FIXED_CATS;
  const name = userData?.name || user?.displayName || "Player";

  return (
    <div style={{ fontFamily:font, paddingBottom:90 }}>
      {/* HEADER */}
      <div style={{ padding:"20px 18px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{t("welcomeBack")}, {name.split(" ")[0]}! 👋</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t("findJoin")}</div>
          </div>
          <div style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:20, padding:"8px 16px", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:14 }}>💰</span>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#a78bfa" }}>৳{(userData?.wallet||0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* NOTICE */}
      {settings.noticeActive && settings.notice && (
        <div style={{ margin:"0 18px 12px", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:12, padding:"10px 14px", fontSize:12, color:"#a78bfa", fontWeight:600 }}>📢 {settings.notice}</div>
      )}

      {/* BANNER SLIDER */}
      {banners.length > 0 && (
        <div style={{ padding:"0 18px 18px" }}>
          <div style={{ borderRadius:20, overflow:"hidden", position:"relative", height:170, boxShadow:"0 8px 30px rgba(0,0,0,0.4)" }}>
            {banners.map((b,i) => (
              <div key={i} onClick={()=>b.link&&window.open(b.link,"_blank")} style={{ position:"absolute", inset:0, opacity:i===bannerIdx?1:0, transition:"opacity 0.6s ease", cursor:b.link?"pointer":"default", background:b.image?`url(${b.image}) center/cover`:"linear-gradient(135deg,#4c1d95,#7c3aed)" }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.6),transparent 60%)" }}></div>
                {(b.title||b.sub) && (
                  <div style={{ position:"absolute", bottom:16, left:16, right:16 }}>
                    {b.title && <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:16, fontWeight:700, color:"#fff" }}>{b.title}</div>}
                    {b.sub && <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:4 }}>{b.sub}</div>}
                  </div>
                )}
              </div>
            ))}
            {banners.length > 1 && (
              <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
                {banners.map((_,i) => (
                  <div key={i} onClick={() => setBannerIdx(i)} style={{ width:i===bannerIdx?20:6, height:6, borderRadius:3, background:i===bannerIdx?"#a78bfa":"rgba(255,255,255,0.4)", transition:"all 0.3s", cursor:"pointer" }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCROLL TEXT */}
      {settings.scrollActive && settings.scrollText && (
        <div style={{ margin:"0 0 16px", background:"rgba(167,139,250,0.06)", borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"8px 0", overflow:"hidden" }}>
          <div style={{ display:"inline-block", whiteSpace:"nowrap", animation:"hscroll 18s linear infinite", paddingLeft:"100%", fontSize:12, color:"#a78bfa", fontWeight:600 }}>
            📢 {settings.scrollText}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      <div style={{ padding:"0 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <span style={{ fontSize:16 }}>🎮</span>
          <span style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{t("categories")}</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:22 }}>
          {displayCats.map(c => (
            <div key={c.id} onClick={() => onCategoryClick && onCategoryClick(c)} style={{ borderRadius:16, aspectRatio:"1", cursor:"pointer", position:"relative", overflow:"hidden", background:c.image||c.thumbnail?`url(${c.image||c.thumbnail}) center/cover`:(c.color||"linear-gradient(135deg,#7c3aed,#a78bfa)"), border:"1px solid rgba(255,255,255,0.1)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", padding:"10px 6px" }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 55%)" }}></div>
              <div style={{ position:"relative", zIndex:1, fontSize:(c.image||c.thumbnail)?20:26, marginBottom:4 }}>{c.emoji||"🎮"}</div>
              <div style={{ position:"relative", zIndex:1, fontSize:10, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff", textAlign:"center", lineHeight:1.2, letterSpacing:0.5 }}>{c.name}</div>
            </div>
          ))}
        </div>

        {/* UPCOMING MATCHES */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <span style={{ fontSize:16 }}>⚡</span>
          <span style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{t("upcomingMatches")}</span>
        </div>
        {matches.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:30, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🎮</div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>কোনো ম্যাচ নেই</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {matches.map(m => (
              <div key={m.id} className="match-card" onClick={() => onMatchClick && onMatchClick(m)} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${m.status==="live"?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:16, overflow:"hidden", cursor:"pointer" }}>
                <div style={{ height:110, background:m.thumbnail?`url(${m.thumbnail}) center/cover`:"linear-gradient(135deg,#1e1040,#3b1f9e)", position:"relative" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,4,15,0.9),transparent)" }}></div>
                  {m.status==="live" && <div style={{ position:"absolute", top:8, left:10, background:"#dc2626", borderRadius:20, padding:"3px 10px", fontSize:10, fontFamily:"Orbitron,sans-serif", fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:5, height:5, borderRadius:"50%", background:"#fff", display:"inline-block", animation:"pulse 1s infinite" }}></span>LIVE</div>}
                  <div style={{ position:"absolute", bottom:10, left:12, right:12 }}>
                    <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#fff" }}>{m.title}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{m.mode} · {Array.isArray(m.maps)?m.maps.join(", "):m.map}</div>
                  </div>
                </div>
                <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>🏆 ৳{m.prize} · {m.isFree?"ফ্রি":`৳${m.entryFee}`}</div>
                  <div style={{ fontSize:12, color:"#a78bfa", fontFamily:"Orbitron,sans-serif" }}>{m.players||m.participants?.length||0}/{m.maxPlayers||48}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes hscroll{from{transform:translateX(0)}to{transform:translateX(-100%)}}`}</style>
    </div>
  );
}
