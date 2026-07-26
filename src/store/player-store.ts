import { create } from "zustand";

interface PlayerState {
  currentlyPlayingId: string | null;
  setCurrentlyPlaying: (id: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentlyPlayingId: null,
  setCurrentlyPlaying: (id) => set({ currentlyPlayingId: id }),
}));
