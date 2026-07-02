import { useState, useEffect, lazy, Suspense, memo, useCallback } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Topbar, BottomNav } from "./components/NavComponents";
import IntroScreen from "./components/IntroScreen";
import ParticleBackground from "./components/ParticleBackground";
import SEOManager from "./components/SEOManager";
import { useMatchReminder } from "./hooks/useMatchReminder";

// Lazy load pages — only load when needed
const HomePage       = lazy(() => import("./pages/HomePage"));
const MatchesPage    = lazy(() => import("./pages/MatchesPage"));
const MatchDetailPage= lazy(() => import("./pages/MatchDetailPage"));
const LeaderboardPage= lazy(() => import("./pages/LeaderboardPage"));
const WalletPage     = lazy(() => import("./pages/WalletPage"));
const ProfilePage    = lazy(() => import("./pages/ProfilePage"));
const ResultsPage    = lazy(() => import("./pages/ResultsPage"));
const LoginPage      = lazy(() => import("./pages/LoginPage"));

// Skeleton loader
function PageSkeleton() {
  return (
    <div style={{ padding:"20px 18px" }}>
      {[1,2,3].map(i=>(
        <div key={i} style={{ background:"rgba(255,255,255,0.04)", borderRadius:20, height:120, marginBottom:14,
          backgroundImage:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%)",
          backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();
  useMatchReminder(user);

  // Request notification permission once logged in
  useEffect(() => {
    if (user && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);
  const [page, setPage]   = useState("home");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  // Deep link
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const matchId = params.get("match");
    if (!matchId) return;
    import("./firebase/config").then(({ db }) =>
      import("firebase/firestore").then(({ doc, getDoc }) =>
        getDoc(doc(db,"matches",matchId)).then(snap => {
          if (snap.exists() && snap.data().status !== "finished") {
            setSelectedMatch({ id:snap.id,...snap.data() });
            setPage("detail");
            setShowIntro(false);
          }
        })
      )
    );
  }, []);

  // Back button
  useEffect(() => {
    const handle = () => {
      if (page==="detail") goBack();
      else if (page!=="home") setPage("home");
    };
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, [page]);

  const navigate = useCallback((p) => {
    window.history.pushState({ page:p }, "", window.location.pathname);
    setPage(p);
  }, []);

  const goToMatch = useCallback((match) => {
    if (match.status==="finished") return;
    window.history.pushState({ page:"detail" }, "", `?match=${match.id}`);
    setSelectedMatch(match);
    setPage("detail");
  }, []);

  const goBack = useCallback(() => {
    setSelectedMatch(null);
    setPage("matches");
    if (window.location.search) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const handleCategoryClick = useCallback((cat) => {
    setFilterCategory(cat);
    navigate("matches");
  }, [navigate]);

  const openMatchById = useCallback((mid) => {
    import("./firebase/config").then(({ db }) =>
      import("firebase/firestore").then(({ doc, getDoc }) =>
        getDoc(doc(db,"matches",mid)).then(snap => {
          if (snap.exists() && snap.data().status!=="finished") {
            setSelectedMatch({ id:snap.id,...snap.data() });
            setPage("detail");
          }
        })
      )
    );
  }, []);

  if (showIntro) return <IntroScreen onDone={() => setShowIntro(false)} />;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#06040f" }}>
      <div style={{ width:36, height:36, border:"3px solid rgba(167,139,250,0.2)", borderTop:"3px solid #a78bfa", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}></div>
    </div>
  );

  return (
    <div style={{ background:"#06040f", minHeight:"100vh", color:"#f5f3ff", maxWidth:480, margin:"0 auto", position:"relative", contain:"layout" }}>
      <SEOManager />
      <ParticleBackground />
      <div style={{ position:"relative", zIndex:1 }}>
        <Suspense fallback={null}>
          {!user ? (
            <LoginPage onLogin={() => navigate("home")} />
          ) : (
            <>
              <Topbar page={page} onBack={goBack} onNavigate={navigate} onOpenMatch={openMatchById} />
              <div className="page-enter" style={{ paddingBottom: page==="detail"?20:80 }}>
                <Suspense fallback={<PageSkeleton />}>
                  {page==="home"        && <HomePage onNavigate={navigate} onCategoryClick={handleCategoryClick} />}
                  {page==="matches"     && <MatchesPage onMatchClick={goToMatch} filterCategory={filterCategory} />}
                  {page==="leaderboard" && <LeaderboardPage />}
                  {page==="wallet"      && <WalletPage />}
                  {page==="profile"     && <ProfilePage onNavigate={navigate} />}
                  {page==="results"     && <ResultsPage />}
                  {page==="detail"      && <MatchDetailPage match={selectedMatch} onBack={goBack} />}
                </Suspense>
              </div>
              {page!=="detail" && <BottomNav page={page} onNavigate={navigate} />}
            </>
          )}
        </Suspense>
      </div>
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
