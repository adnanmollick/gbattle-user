import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { useSettings } from "../hooks/useSettings";

export default function HomePage({ onNavigate, onCategoryClick }) {
  const theme = useTheme();
  const { t, font } = useLang();
  const { user } = useAuth();
  const settings = useSettings();
  const [userData, setUserData] = useState(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db,"users",user.uid), snap => {
      if (snap.exists()) setUserData(snap.data());
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db,"categories"), snap => {
      setCategories(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.order-b.order));
    });
    return unsub;
  }, []);

  const banners = settings.banners || [];

  // Auto slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setBannerIndex(i => (i+1) % banners.length), 3000);
    return () => clearInterval(id);
  }, [banners.length]);

  const name = userData?.name || user?.displayName || "Player";

  return (
    <div style={{ fontFamily:font, paddingBottom:90 }}>
      {/* HEADER */}
      <div style={{ padding:"20px 18px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{t("welcomeBack")}, {name.split(" ")[0]}! 👋</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t("findJoin")}</div>
          </div>
          <div style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:20, padding:"8px 16px", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:14 }}>💰</span>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:13, fontWeight:700, color:"#a78bfa" }}>৳{(userData?.balance||0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* BANNER SLIDER */}
      {banners.length > 0 && (
        <div style={{ padding:"0 18px 20px" }}>
          <div style={{ borderRadius:20, overflow:"hidden", position:"relative", height:160, boxShadow:"0 8px 30px rgba(0,0,0,0.4)" }}>
            {banners.map((b,i) => (
              <div key={i} style={{ position:"absolute", inset:0, opacity:i===bannerIndex?1:0, transition:"opacity 0.5s ease", background:b?`url(${b}) center/cover`:theme.grad }} />
            ))}
            {/* Dots */}
            {banners.length > 1 && (
              <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
                {banners.map((_,i) => (
                  <div key={i} onClick={() => setBannerIndex(i)} style={{ width:i===bannerIndex?20:6, height:6, borderRadius:3, background:i===bannerIndex?"#a78bfa":"rgba(255,255,255,0.4)", transition:"all 0.3s", cursor:"pointer" }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <div style={{ padding:"0 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontSize:16 }}>⊞</span>
            <span style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{t("categories")}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {categories.map(cat => (
              <div key={cat.id} onClick={() => onCategoryClick && onCategoryClick(cat)} style={{ borderRadius:16, overflow:"hidden", cursor:"pointer", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", transition:"transform 0.2s, box-shadow 0.2s" }}
                onTouchStart={e => e.currentTarget.style.transform="scale(0.97)"}
                onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width:"100%", height:110, objectFit:"cover", display:"block" }} />
                ) : (
                  <div style={{ width:"100%", height:110, background:theme.grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🎮</div>
                )}
                <div style={{ padding:"10px 12px", textAlign:"center" }}>
                  <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:11, fontWeight:700, color:"#fff", letterSpacing:1 }}>{cat.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NO CATEGORIES */}
      {categories.length === 0 && (
        <div style={{ padding:"40px 18px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎮</div>
          <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>কোনো ক্যাটাগরি নেই</div>
        </div>
      )}
    </div>
  );
}
