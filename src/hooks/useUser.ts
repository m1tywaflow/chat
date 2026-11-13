import { useEffect } from "react";
import {
  CachedUser,
  releaseUser,
  retainUser,
  useUserCacheStore,
} from "@/store/user-cache-store";

export function useUser(uid: string | null | undefined): CachedUser | null {
  useEffect(() => {
    if (!uid) return;
    retainUser(uid);
    return () => releaseUser(uid);
  }, [uid]);

  return useUserCacheStore((s) => (uid ? s.entries[uid] ?? null : null));
}
