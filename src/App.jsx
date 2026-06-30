import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useBkashAutoVerify, useSettings } from "./hooks/useSettings";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import { ResultsPage } from "./pages/ResultsPage";
import { Topbar, BottomNav } from "./components/NavComponents";
import IntroScreen from "./components/IntroScreen";
import SEOManager from "./components/SEOManager";
import LoginPrompt from "./components/LoginPrompt";

function AppInner() {
  const { user, loading, guest } = useAuth();
  const { theme } = useTheme();
  const settings = useSettings();
  const [page, setPage] = useState("home");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [loginPrompt, setLoginPrompt] = useState(false);

  // Deep link: open match from ?match=ID shared URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("match");
    if (matchId) {
      import("./firebase/config").then(({ db }) => {
        import("firebase/firestore").then(({ doc, getDoc }) => {
          getDoc(doc(db, "matches", matchId)).then(snap => {
            if (snap.exists()) {
              setSelectedMatch({ id: snap.id, ...snap.data() });
              setPage("detail");
              setShowIntro(false);
            }
          });
        });
      });
    }
  }, []);

  useBkashAutoVerify(!!user && settings.autoVerify);

  if (showIntro) return <IntroScreen onDone={()=>setShowIntro(false)} />;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:theme.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:28, fontWeight:900, background:theme.accentGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:16 }}>G-BATTLE</div>
        <div style={{ width:40, height:40, border:`3px solid ${theme.accentGlow}`, borderTop:`3px solid ${theme.primary}`, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto" }}></div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user && !guest) return <LoginPage />;

  const goToMatch = (match) => {
    if (match.status === "finished") return; // finished match — no entry
    setSelectedMatch(match); setPage("detail");
  };
  const goBack = () => {
    setSelectedMatch(null); setPage("matches");
    if (window.location.search) window.history.replaceState({}, "", window.location.pathname);
  };

  const guardedNav = (target) => {
    if (guest && (target==="wallet"||target==="profile")) { setLoginPrompt(true); return; }
    setPage(target);
  };

  return (
    <div style={{ background:theme.bg, minHeight:"100vh", color:theme.text, fontFamily:"'Hind Siliguri',Inter,sans-serif", maxWidth:480, margin:"0 auto", position:"relative" }}>
      <SEOManager />
      <Topbar page={page} onBack={goBack} onNavigate={guardedNav} onOpenMatch={(mid)=>{
        import("./firebase/config").then(({ db })=>{ import("firebase/firestore").then(({ doc, getDoc })=>{
          getDoc(doc(db,"matches",mid)).then(snap=>{ if(snap.exists()&&snap.data().status!=="finished"){ setSelectedMatch({id:snap.id,...snap.data()}); setPage("detail"); } });
        }); });
      }} />
      <div style={{ paddingBottom:page==="detail"?20:75 }}>
        {page==="home" && <HomePage onNavigate={guardedNav} onMatchClick={goToMatch} />}
        {page==="matches" && <MatchesPage onMatchClick={goToMatch} />}
        {page==="wallet" && !guest && <WalletPage />}
        {page==="results" && <ResultsPage />}
        {page==="leaderboard" && <LeaderboardPage />}
        {page==="profile" && !guest && <ProfilePage />}
        {page==="detail" && <MatchDetailPage match={selectedMatch} onBack={goBack} />}
      </div>
      {page!=="detail" && <BottomNav page={page} setPage={guardedNav} />}
      {loginPrompt && <LoginPrompt onClose={()=>setLoginPrompt(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
