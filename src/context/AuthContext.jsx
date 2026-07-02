import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);
  const [guest, setGuest] = useState(false);

  const fetchUserData = async (u) => {
    const snap = await getDoc(doc(db, "users", u.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.banned) { setBanned(true); await signOut(auth); return; }
      setUserData(data);
    } else {
      const data = {
        uid: u.uid, name: u.displayName || "Player",
        email: u.email || "", phone: u.phoneNumber || "",
        avatar: u.photoURL || "", ffUID: "", ingameName: "",
        wallet: 0, matches: 0, wins: 0,
        role: "user", banned: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", u.uid), data);
      setUserData(data);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) { setGuest(false); await fetchUserData(u); }
      else setUserData(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.banned) { setBanned(true); signOut(auth); return; }
        setUserData(data);
      }
    });
    return unsub;
  }, [user]);

  const refreshUserData = async () => { if (user) await fetchUserData(user); };
  const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
  const loginEmail = (email, pass) => signInWithEmailAndPassword(auth, email, pass);

  const registerEmail = async (email, pass, name, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid, name, email, phone: phone || "", avatar: "",
      ffUID: "", ingameName: "", wallet: 0, matches: 0, wins: 0,
      role: "user", banned: false, createdAt: new Date().toISOString()
    });
    return cred;
  };

  const enterGuest = () => setGuest(true);
  const exitGuest = () => setGuest(false);
  const logout = () => { setGuest(false); return signOut(auth); };

  return (
    <AuthContext.Provider value={{
      user, userData, loading, banned, guest,
      loginGoogle, loginEmail, registerEmail,
      enterGuest, exitGuest, logout, refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
