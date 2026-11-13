import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CachedUser = { id: string } & Record<string, any>;

interface UserCacheState {
  entries: Record<string, CachedUser | null>;
}

const RELEASE_DELAY_MS = 30000;

export const useUserCacheStore = create<UserCacheState>(() => ({
  entries: {},
}));

const refCounts = new Map<string, number>();
const unsubscribers = new Map<string, () => void>();
const releaseTimers = new Map<string, ReturnType<typeof setTimeout>>();

function setEntry(uid: string, user: CachedUser | null) {
  useUserCacheStore.setState((state) => ({
    entries: { ...state.entries, [uid]: user },
  }));
}

function removeEntry(uid: string) {
  useUserCacheStore.setState((state) => {
    if (!(uid in state.entries)) return state;
    const next = { ...state.entries };
    delete next[uid];
    return { entries: next };
  });
}

export function retainUser(uid: string) {
  const pending = releaseTimers.get(uid);
  if (pending) {
    clearTimeout(pending);
    releaseTimers.delete(uid);
  }

  refCounts.set(uid, (refCounts.get(uid) ?? 0) + 1);
  if (unsubscribers.has(uid)) return;

  const unsubscribe = onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      setEntry(uid, snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    () => {
      setEntry(uid, null);
    }
  );
  unsubscribers.set(uid, unsubscribe);
}

export function releaseUser(uid: string) {
  const remaining = (refCounts.get(uid) ?? 0) - 1;
  if (remaining > 0) {
    refCounts.set(uid, remaining);
    return;
  }
  refCounts.delete(uid);

  const existing = releaseTimers.get(uid);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    releaseTimers.delete(uid);
    if ((refCounts.get(uid) ?? 0) > 0) return;
    unsubscribers.get(uid)?.();
    unsubscribers.delete(uid);
    removeEntry(uid);
  }, RELEASE_DELAY_MS);
  releaseTimers.set(uid, timer);
}