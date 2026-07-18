"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "custom";

export interface CustomTheme {
  bg: string;
  text: string;
  msgBg: string;
  chatBg: string;
  sideBarBg: string;
}

export const DEFAULT_DARK: CustomTheme = {
  bg: "#0b0812",
  text: "#ffffff",
  msgBg: "#171224",
  chatBg: "#0a0712",
  sideBarBg: "#0c0916",
};

export const DEFAULT_LIGHT: CustomTheme = {
  bg: "#f0f2f5",
  text: "#111111",
  msgBg: "#ffffff",
  chatBg: "#e5e7eb",
  sideBarBg: "#fff",
};

interface ThemeStore {
  mode: ThemeMode;
  customTheme: CustomTheme;
  setMode: (mode: ThemeMode) => void;
  setCustomTheme: (theme: Partial<CustomTheme>) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: "dark",
      customTheme: DEFAULT_DARK,
      setMode: (mode) => set({ mode }),
      setCustomTheme: (theme) =>
        set((state) => ({
          customTheme: { ...state.customTheme, ...theme },
        })),
    }),
    {
      name: "pislk-theme",
      partialize: (state) => ({
        mode: state.mode,
        customTheme: state.customTheme,
      }),
    }
  )
);
