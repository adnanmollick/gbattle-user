import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSettings, useNotifications } from "../hooks/useSettings";
import { formatBalance } from "../utils/helpers";
import { db } from "../firebase/config";
import { updateDoc, doc } from "firebase/firestore";
import { useState } from "react";

export function Topbar({ page, onBack, onNavigate, onOpenMatch }) {
  const { user, userData, guest } = useAuth();
  const { theme } = useTheme();
  const settings = useSettings();
  const notifs = useNotifications(user?.uid);
  const [showInbox, setShowInbox] = useState(false);
  const unread = notifs.filter(n => !n.read).length;

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const handleNotifClick = async (n) => {
    await markRead(n.id);
    setShowInbox(false);
    // Navigate based on notification type
    if (n.type === "deposit" || n.type === "prize") { onNavigate && onNavigate("wallet"); }
    else if (n.type === "room" && n.matchId && onOpenMatch) { onOpenMatch(n.matchId); }
    else if (n.type === "match" && n.matchId && onOpenMatch) { onOpenMatch(n.matchId); }
  };

  const markAllRead = async () => {
    for (const n of notifs.filter(n => !n.read)) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
  };

  return (
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: theme.topbar, backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.cardBorder}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {page === "detail" ? (
          <button onClick={onBack} style={{ background: "none", border: "none", color: theme.primary, fontFamily: "Orbitron,sans-serif", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>← ফিরে যান</button>
        ) : (
          <div style={{ fontFamily: "Orbitron,sans-serif", fontWeight: 900, fontSize: 18, background: theme.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>G-BATTLE</div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {settings.topbarLink && settings.topbarLinkLabel && (
            <a href={settings.topbarLink} target="_blank" rel="noreferrer" style={{ background: theme.accentGrad, borderRadius: 20, padding: "6px 14px", color: "#fff", fontFamily: "Hind Siliguri,sans-serif", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>{settings.topbarLinkLabel}</a>
          )}

          {user && !guest && (
            <>
              <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: "5px 12px", fontFamily: "Orbitron,sans-serif", fontSize: 12, color: theme.primary }}>৳{formatBalance(userData?.wallet || 0)}</div>

              {/* NOTIFICATION BELL */}
              <button onClick={() => setShowInbox(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <span style={{ fontSize: 20, animation: unread > 0 ? "bellShake 1s ease-in-out infinite" : "none" }}>🔔</span>
                {unread > 0 && (
                  <span style={{ position: "absolute", top: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444", border: `2px solid ${theme.bg}` }}></span>
                )}
              </button>
            </>
          )}

          {guest && (
            <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, color: theme.textFaint }}>অতিথি</div>
          )}
        </div>
      </div>

      {/* INBOX MODAL */}
      {showInbox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: theme.cardSolid, border: `1.5px solid ${theme.cardBorder}`, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Orbitron,sans-serif", fontSize: 15, fontWeight: 700, color: theme.text }}>🔔 নোটিফিকেশন</div>
              <div style={{ display: "flex", gap: 10 }}>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: theme.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "Hind Siliguri,sans-serif" }}>সব পড়া হয়েছে</button>}
                <button onClick={() => setShowInbox(false)} style={{ fontSize: 11, color: theme.textFaint, background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </div>
            </div>
            {notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: theme.textFaint, fontSize: 13, fontFamily: "Hind Siliguri,sans-serif" }}>কোনো নোটিফিকেশন নেই</div>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => handleNotifClick(n)} style={{ display: "flex", gap: 12, padding: "12px 14px", background: n.read ? "transparent" : `${theme.primary}11`, borderRadius: 12, marginBottom: 8, cursor: "pointer", border: `1px solid ${n.read ? theme.cardBorder : theme.primary + "33"}` }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{n.type === "deposit" ? "💚" : n.type === "room" ? "🔑" : n.type === "prize" ? "🏆" : "📢"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, fontFamily: "Hind Siliguri,sans-serif" }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: theme.textDim, marginTop: 2, fontFamily: "Hind Siliguri,sans-serif" }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString("bn-BD")}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.primary, marginTop: 4, flexShrink: 0 }}></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellShake {
          0%,100%{transform:rotate(0deg)}
          20%{transform:rotate(-15deg)}
          40%{transform:rotate(15deg)}
          60%{transform:rotate(-10deg)}
          80%{transform:rotate(10deg)}
        }
      `}</style>
    </>
  );
}

export function BottomNav({ page, setPage }) {
  const { theme } = useTheme();
  const tabs = [
    { id: "home", icon: "🏠", label: "হোম" },
    { id: "matches", icon: "🎮", label: "ম্যাচ" },
    { id: "leaderboard", icon: "🏆", label: "লিডার" },
    { id: "wallet", icon: "💰", label: "ওয়ালেট" },
    { id: "profile", icon: "👤", label: "প্রোফাইল" },
  ];

  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: theme.navBg, backdropFilter: "blur(20px)", borderTop: `1px solid ${theme.cardBorder}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setPage(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 20, filter: page === t.id ? `drop-shadow(0 0 6px ${theme.navActive})` : "none" }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontFamily: "Hind Siliguri,sans-serif", fontWeight: 600, color: page === t.id ? theme.navActive : theme.navInactive }}>{t.label}</span>
          {page === t.id && <div style={{ width: 20, height: 2, borderRadius: 2, background: theme.accentGrad, marginTop: 1 }}></div>}
        </button>
      ))}
    </div>
  );
}
