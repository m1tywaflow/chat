"use client";

import { useEffect } from "react";
import {
  useThemeStore,
  CustomTheme,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

function applyTheme(theme: CustomTheme) {
  const root = document.documentElement;
  root.style.setProperty("--color-bg", theme.bg);
  root.style.setProperty("--color-text", theme.text);
  root.style.setProperty("--color-msg-bg", theme.msgBg);
  root.style.setProperty("--color-chat-bg", theme.chatBg);
}

export function useTheme() {
  const { mode, customTheme, setMode, setCustomTheme } = useThemeStore();

  useEffect(() => {
    if (mode === "dark") applyTheme(DEFAULT_DARK);
    else if (mode === "light") applyTheme(DEFAULT_LIGHT);
    else applyTheme(customTheme);
  }, [mode, customTheme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      return onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.themeMode) setMode(data.themeMode);
        if (data.customTheme) setCustomTheme(data.customTheme);
      });
    });
    return () => unsub();
  }, []);
}

export async function saveThemeToFirestore(
  uid: string,
  mode: string,
  customTheme: CustomTheme
) {
  await updateDoc(doc(db, "users", uid), {
    themeMode: mode,
    customTheme,
  });
}
