import { useEffect, useRef } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";

// In-app match reminder: notifies user 30/15/5 min before joined matches
export function useMatchReminder(user) {
  const notified = useRef(new Set());

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "matches"), snap => {
      const now = Date.now();
      snap.docs.forEach(d => {
        const m = { id: d.id, ...d.data() };
        if (m.status !== "upcoming" || !m.scheduledAt) return;
        // Only for matches the user joined
        const joined = m.participants?.some(p => p.uid === user.uid || p.players?.some(pl => pl.uid === user.uid));
        if (!joined) return;

        const diff = new Date(m.scheduledAt).getTime() - now;
        const mins = Math.round(diff / 60000);

        [30, 15, 5].forEach(mark => {
          const key = `${m.id}-${mark}`;
          // Fire when within 1 min window of the mark
          if (mins <= mark && mins > mark - 1 && !notified.current.has(key)) {
            notified.current.add(key);
            // Browser notification if permitted
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("🎮 ম্যাচ রিমাইন্ডার", { body: `"${m.title}" ${mark} মিনিটে শুরু হবে!` });
            }
            // Also write to notifications collection (bell icon)
            addDoc(collection(db, "notifications"), {
              uid: user.uid, type: "match", matchId: m.id,
              title: "⏰ ম্যাচ রিমাইন্ডার",
              body: `"${m.title}" ${mark} মিনিটে শুরু হবে! প্রস্তুত হন।`,
              read: false, createdAt: new Date().toISOString(),
            });
          }
        });
      });
    });
    return unsub;
  }, [user]);
}
