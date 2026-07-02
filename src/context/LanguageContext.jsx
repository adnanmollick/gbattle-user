import { createContext, useContext, useState, useEffect } from "react";

export const STRINGS = {
  bn: {
    // Nav
    home:"হোম", matches:"ম্যাচ", leaderboard:"লিডার", wallet:"ওয়ালেট", profile:"প্রোফাইল",
    // Home
    welcomeBack:"স্বাগতম", findJoin:"টুর্নামেন্ট খুঁজুন এবং যোগ দিন",
    totalBalance:"মোট ব্যালেন্স", categories:"ক্যাটাগরি", upcomingMatches:"আসন্ন ম্যাচ",
    // Matches
    matchTitle:"ম্যাচ সমূহ", searchMatch:"ম্যাচ খুঁজুন...", allMatches:"সব",
    players:"প্লেয়ার", entry:"প্রবেশ মূল্য", prize:"পুরস্কার", perKill:"কিল পুর",
    joinMatch:"যোগ দিন →", matchFull:"ম্যাচ ফুল", started:"শুরু হয়েছে!",
    slotsLeft:"স্লট বাকি", prizePool:"পুরস্কার পুল", prizeDistribution:"পুরস্কার বিতরণ",
    rules:"নিয়মাবলী", participants:"অংশগ্রহণকারী", emptySlot:"খালি স্লট",
    // Join
    joinMatchTitle:"ম্যাচে যোগ দিন", selectTeam:"টিম সিলেক্ট করুন",
    inGameName:"ইন-গেম নাম", teamName:"টিম নাম", addPlayer:"প্লেয়ার যোগ করুন",
    entryFeeMsg:"প্রবেশ মূল্য", yourBalance:"আপনার ব্যালেন্স", joinNow:"এখনই যোগ দিন",
    cancel:"বাতিল", full:"ফুল", available:"উপলব্ধ",
    // Wallet
    walletTitle:"আমার ওয়ালেট", deposit:"জমা", withdraw:"উত্তোলন", share:"শেয়ার",
    recentTx:"সাম্প্রতিক লেনদেন", viewAll:"সব দেখুন →", noTx:"কোনো লেনদেন নেই",
    depositTitle:"ডিপোজিট", withdrawTitle:"উত্তোলন", amount:"পরিমাণ",
    bkashNumber:"bKash নম্বর", txId:"ট্রানজেকশন আইডি", submit:"জমা দিন",
    pending:"অপেক্ষমাণ", approved:"অনুমোদিত", rejected:"প্রত্যাখ্যাত",
    // Results
    results:"ফলাফল", myMatches:"আমার ম্যাচ", allResults:"সব ফলাফল",
    searchResult:"ম্যাচ আইডি বা নাম দিয়ে খুঁজুন...", noResults:"কোনো ফলাফল নেই",
    finalStandings:"চূড়ান্ত ফলাফল", won:"জিতেছেন", kills:"কিল",
    // Leaderboard
    hallOfFame:"হল অফ ফেম", yourRank:"আপনার র‍্যাংক", totalWon:"মোট জিতেছেন",
    rankings:"র‍্যাংকিং", wins:"জয়", totalMatches:"মোট ম্যাচ",
    // Profile
    editProfile:"প্রোফাইল এডিট", logout:"লগআউট", stats:"পরিসংখ্যান",
    matchesPlayed:"খেলা ম্যাচ", totalWins:"মোট জয়", totalEarned:"মোট আয়",
    language:"ভাষা", changePassword:"পাসওয়ার্ড পরিবর্তন", searchPlayer:"প্লেয়ার খুঁজুন",
    // Auth
    login:"লগইন", register:"রেজিস্ট্রেশন", email:"ইমেইল", password:"পাসওয়ার্ড",
    username:"ইউজারনেম", forgotPassword:"পাসওয়ার্ড ভুলে গেছেন?",
    resetPassword:"পাসওয়ার্ড রিসেট", sendResetLink:"রিসেট লিংক পাঠান",
    googleLogin:"Google দিয়ে লগইন", orContinueWith:"অথবা",
    noAccount:"অ্যাকাউন্ট নেই?", haveAccount:"অ্যাকাউন্ট আছে?",
    usernameRequired:"ইউজারনেম দিন", usernameTaken:"ইউজারনেম নেওয়া হয়ে গেছে",
    usernameAvailable:"ইউজারনেম পাওয়া যাচ্ছে", usernameChecking:"চেক হচ্ছে...",
    // General
    save:"সেভ করুন", close:"বন্ধ করুন", confirm:"নিশ্চিত করুন",
    loading:"লোড হচ্ছে...", noData:"কোনো তথ্য নেই", error:"সমস্যা হয়েছে",
    success:"সফল হয়েছে", copy:"কপি", copied:"কপি হয়েছে",
    back:"ফিরে যান", notifications:"নোটিফিকেশন", noNotif:"কোনো নোটিফিকেশন নেই",
    roomId:"Room ID", roomPass:"Room Pass", roomInfo:"Room তথ্য",
    matchFinished:"ম্যাচ শেষ", live:"লাইভ", upcoming:"আসন্ন", finished:"শেষ",
    free:"ফ্রি",
  },
  en: {
    home:"Home", matches:"Matches", leaderboard:"Leader", wallet:"Wallet", profile:"Profile",
    welcomeBack:"Welcome back", findJoin:"Find and join tournaments",
    totalBalance:"Total Balance", categories:"Categories", upcomingMatches:"Upcoming Matches",
    matchTitle:"Matches", searchMatch:"Search matches...", allMatches:"All",
    players:"Players", entry:"Entry Fee", prize:"Prize", perKill:"Per Kill",
    joinMatch:"Join →", matchFull:"Match Full", started:"Started!",
    slotsLeft:"slots left", prizePool:"Prize Pool", prizeDistribution:"Prize Distribution",
    rules:"Rules", participants:"Participants", emptySlot:"Empty Slot",
    joinMatchTitle:"Join Match", selectTeam:"Select Team",
    inGameName:"In-game name", teamName:"Team Name", addPlayer:"Add Player",
    entryFeeMsg:"Entry fee", yourBalance:"Your balance", joinNow:"Join Now",
    cancel:"Cancel", full:"Full", available:"Available",
    walletTitle:"My Wallet", deposit:"Deposit", withdraw:"Withdraw", share:"Share",
    recentTx:"Recent Transactions", viewAll:"View All →", noTx:"No transactions yet",
    depositTitle:"Deposit", withdrawTitle:"Withdraw", amount:"Amount",
    bkashNumber:"bKash Number", txId:"Transaction ID", submit:"Submit",
    pending:"Pending", approved:"Approved", rejected:"Rejected",
    results:"Results", myMatches:"My Matches", allResults:"All Matches",
    searchResult:"Search by Match ID or title...", noResults:"No results found",
    finalStandings:"Final Standings", won:"Won", kills:"Kills",
    hallOfFame:"Hall of Fame", yourRank:"Your Rank", totalWon:"Total Won",
    rankings:"Rankings", wins:"Wins", totalMatches:"Total Matches",
    editProfile:"Edit Profile", logout:"Logout", stats:"Statistics",
    matchesPlayed:"Matches Played", totalWins:"Total Wins", totalEarned:"Total Earned",
    language:"Language", changePassword:"Change Password", searchPlayer:"Search Player",
    login:"Login", register:"Register", email:"Email", password:"Password",
    username:"Username", forgotPassword:"Forgot Password?",
    resetPassword:"Reset Password", sendResetLink:"Send Reset Link",
    googleLogin:"Login with Google", orContinueWith:"Or continue with",
    noAccount:"No account?", haveAccount:"Have an account?",
    usernameRequired:"Enter username", usernameTaken:"Username already taken",
    usernameAvailable:"Username available", usernameChecking:"Checking...",
    save:"Save", close:"Close", confirm:"Confirm",
    loading:"Loading...", noData:"No data", error:"Something went wrong",
    success:"Success", copy:"Copy", copied:"Copied!",
    back:"Back", notifications:"Notifications", noNotif:"No notifications",
    roomId:"Room ID", roomPass:"Room Pass", roomInfo:"Room Info",
    matchFinished:"Match Finished", live:"LIVE", upcoming:"UPCOMING", finished:"FINISHED",
    free:"FREE",
  }
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
  const font = lang === "en" ? "'Rajdhani', sans-serif" : "'Hind Siliguri', sans-serif";
  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, font }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLang() { return useContext(LanguageContext); }
