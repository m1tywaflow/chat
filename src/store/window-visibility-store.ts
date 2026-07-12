import { create } from "zustand";
import { useEffect } from "react";
interface WindowVisibilityState {
  isVisible: boolean;
  setVisible: (v: boolean) => void;
}

export const useWindowVisibilityStore = create<WindowVisibilityState>(
  (set) => ({
    isVisible: true,
    setVisible: (v) => set({ isVisible: v }),
  })
);
