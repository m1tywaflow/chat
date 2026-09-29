import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const cache = new Map<string, string>();

export function useUsername(uid?: string) {
  const [name, setName] = useState(uid ? cache.get(uid) ?? "" : "");
  useEffect(() => {
    if (!uid) return;
    const hit = cache.get(uid);
    if (hit) {
      setName(hit);
      return;
    }
    let off = false;
    getDoc(doc(db, "users", uid))
      .then((s) => {
        const n = (s.data()?.username as string) || "Someone";
        cache.set(uid, n);
        if (!off) setName(n);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [uid]);
  return name;
}
