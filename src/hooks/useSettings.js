import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot, collection, query, where, getDocs, updateDoc, addDoc, getDoc } from "firebase/firestore";

export function useSettings() {
  const [settings, setSettings] = useState({
    bkashNumber: "", autoVerify: false, scrollText: "", scrollActive: false,
    topbarLink: "", topbarLinkLabel: "", rules: "", notice: "", noticeActive: false,
    support: {}, resultAutoDelete: false,
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "app"), snap => {
      if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data(), support: { ...prev.support, ...(snap.data().support || {}) } }));
    });
    return unsub;
  }, []);

  return settings;
}

export function useCategories() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.visible !== false);
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCats(list);
    });
    return unsub;
  }, []);
  return cats;
}

export function useNotifications(uid) {
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      query(collection(db, "notifications"), where("uid", "==", uid)),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifs(all);
      }
    );
    return unsub;
  }, [uid]);
  return notifs;
}

export function useBkashAutoVerify(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const unsub = onSnapshot(
      query(collection(db, "bkash_sms"), where("processed", "==", false)),
      async snap => {
        for (const smsDoc of snap.docs) {
          const sms = smsDoc.data();
          try {
            const txQuery = query(
              collection(db, "transactions"),
              where("txID", "==", sms.transaction_id),
              where("type", "==", "deposit"),
              where("status", "==", "pending")
            );
            const txSnap = await getDocs(txQuery);
            if (!txSnap.empty) {
              const txDoc = txSnap.docs[0];
              const tx = txDoc.data();
              if (Math.abs(Number(sms.amount) - Number(tx.amount)) < 1) {
                await updateDoc(doc(db, "transactions", txDoc.id), {
                  status: "approved", autoVerified: true, approvedAt: new Date().toISOString(),
                });
                const uSnap = await getDoc(doc(db, "users", tx.uid));
                if (uSnap.exists()) {
                  await updateDoc(doc(db, "users", tx.uid), {
                    wallet: Math.max(0, (uSnap.data().wallet || 0) + Number(tx.amount)),
                  });
                  // Send notification
                  await addDoc(collection(db, "notifications"), {
                    uid: tx.uid, type: "deposit",
                    title: "✅ ডিপোজিট সফল",
                    body: `আপনার ৳${tx.amount} ওয়ালেটে যোগ হয়েছে`,
                    read: false, createdAt: new Date().toISOString(),
                  });
                }
                await updateDoc(doc(db, "bkash_sms", smsDoc.id), {
                  processed: true, matchedUid: tx.uid, matchedAt: new Date().toISOString(),
                });
              }
            }
          } catch (e) { console.error(e); }
        }
      }
    );
    return unsub;
  }, [enabled]);
}
