"use client";

import { useAuthStore } from "@/store/auth-store";

export function useCurrentUser() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const loading = useAuthStore((state) => state.loading);

  return { firebaseUser, loading, isAuthenticated: !!firebaseUser };
}