import { createContext, useContext, useState, useEffect } from "react";

const STRINGS = {
  bn: {
    home:"হোম", matches:"ম্যাচ", leaderboard:"লিডার", wallet:"ওয়ালেট", profile:"প্রোফাইল",
    balance:"মোট ব্যালেন্স", deposit:"জমা", withdraw:"উত্তোলন", history:"লেনদেনের ইতিহাস",
    upcomingMatches:"আসন্ন ম্যাচ", categories:"ক্যাটাগরি", noMatch:"কোনো ম্যাচ নেই",
    joinMatch:"যোগ দিন", joined:"যোগ দিয়েছেন", prize:"পুরস্কার", entry:"এন্ট্রি",
    free:"ফ্রি", players:"প্লেয়ার", perKill:"প্রতি কিল", roomInfo:"Room তথ্য",
    pointTable:"পয়েন্ট টেবিল", matchResult:"ম্যাচ রেজাল্ট", result:"ফলাফল",
    editProfile:"এডিট প্রোফাইল", logout:"লগআউট", rules:"নিয়মাবলী", support:"সাপোর্ট",
    theme:"থিম", language:"ভাষা", teamInfo:"টিম তথ্য", gameInfo:"গেম তথ্য",
    save:"সেভ করুন", cancel:"বাতিল", confirm:"নিশ্চিত করুন", search:"সার্চ করুন",
    win:"জয়", congratulations:"অভিনন্দন!", champion:"চ্যাম্পিয়ন", runnerUp:"রানার আপ",
    totalKills:"মোট কিল", noNotif:"কোনো নোটিফিকেশন নেই", notifications:"নোটিফিকেশন",
  },
  en: {
    home:"Home", matches:"Matches", leaderboard:"Leader", wallet:"Wallet", profile:"Profile",
    balance:"Total Balance", deposit:"Deposit", withdraw:"Withdraw", history:"Transaction History",
    upcomingMatches:"Upcoming Matches", categories:"Categories", noMatch:"No matches",
    joinMatch:"Join", joined:"Joined", prize:"Prize", entry:"Entry",
    free:"Free", players:"Players", perKill:"Per Kill", roomInfo:"Room Info",
    pointTable:"Point Table", matchResult:"Match Result", result:"Results",
    editProfile:"Edit Profile", logout:"Logout", rules:"Rules", support:"Support",
    theme:"Theme", language:"Language", teamInfo:"Team Info", gameInfo:"Game Info",
    save:"Save", cancel:"Cancel", confirm:"Confirm", search:"Search",
    win:"Wins", congratulations:"Congratulations!", champion:"Champion", runnerUp:"Runner Up",
    totalKills:"Total Kills", noNotif:"No notifications", notifications:"Notifications",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("gbattle_lang") || "bn");

  const toggleLang = () => {
    const next = lang === "bn" ? "en" : "bn";
    setLang(next);
    localStorage.setItem("gbattle_lang", next);
  };

  const t = (key) => STRINGS[lang]?.[key] || STRINGS.bn[key] || key;
  // English uses Rajdhani (gaming font), Bangla uses Hind Siliguri
  const font = lang === "en" ? "'Rajdhani', sans-serif" : "'Hind Siliguri', sans-serif";

  useEffect(() => {
    if (!document.getElementById("rajdhani-font")) {
      const link = document.createElement("link");
      link.id = "rajdhani-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, font }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() { return useContext(LanguageContext); }
