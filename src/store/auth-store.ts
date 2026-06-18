import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";

interface AuthStore {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  firebaseUser: null,
  loading: true,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setLoading: (loading) => set({ loading }),
}));