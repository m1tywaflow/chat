"use client";

import { useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePresence(uid: string | null) {
  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    async function setOnline() {
      await updateDoc(userRef, { online: true, lastSeen: serverTimestamp() });
    }

    async function setOffline() {
      await updateDoc(userRef, { online: false, lastSeen: serverTimestamp() });
    }

    setOnline();

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") setOnline();
    }, 60_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") setOffline();
      else setOnline();
    }

    function handleBeforeUnload() {
      setOffline();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOffline();
    };
  }, [uid]);
}
