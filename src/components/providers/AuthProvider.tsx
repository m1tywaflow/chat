// "use client";

// import { useEffect } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "@/lib/firebase";
// import { useAuthStore } from "@/store/auth-store";

// export default function AuthProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
//   const setLoading = useAuthStore((state) => state.setLoading);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       setFirebaseUser(user);
//       setLoading(false);
//     });
//     return unsub;
//   }, [setFirebaseUser, setLoading]);

//   return <>{children}</>;
// }

"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";
import { usePresence } from "@/hooks/usePresence";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const uid = useAuthStore((state) => state.firebaseUser?.uid ?? null);

  usePresence(uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsub;
  }, [setFirebaseUser, setLoading]);

  return <>{children}</>;
}
