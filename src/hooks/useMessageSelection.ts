import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

type Listener = () => void;

export interface SelectionStore {
  has: (id: string) => boolean;
  size: () => number;
  getMode: () => boolean;
  start: (id: string) => void;
  toggle: (id: string) => void;
  selectMany: (ids: string[]) => void;
  retain: (allowed: ReadonlySet<string>) => void;
  clear: () => void;
  subscribeItem: (id: string, listener: Listener) => () => void;
  subscribeMode: (listener: Listener) => () => void;
  subscribeCount: (listener: Listener) => () => void;
}

function createSelectionStore(): SelectionStore {
  let selected = new Set<string>();
  const itemListeners = new Map<string, Set<Listener>>();
  const modeListeners = new Set<Listener>();
  const countListeners = new Set<Listener>();

  const notifyItem = (id: string) => {
    const set = itemListeners.get(id);
    if (set) set.forEach((l) => l());
  };

  const commit = (next: Set<string>) => {
    const prev = selected;
    selected = next;
    prev.forEach((id) => {
      if (!next.has(id)) notifyItem(id);
    });
    next.forEach((id) => {
      if (!prev.has(id)) notifyItem(id);
    });
    if (prev.size > 0 !== next.size > 0) modeListeners.forEach((l) => l());
    if (prev.size !== next.size) countListeners.forEach((l) => l());
  };

  return {
    has: (id) => selected.has(id),
    size: () => selected.size,
    getMode: () => selected.size > 0,
    start: (id) => commit(new Set([id])),
    toggle: (id) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      commit(next);
    },
    selectMany: (ids) => commit(new Set(ids)),
    retain: (allowed) => {
      if (selected.size === 0) return;
      const next = new Set<string>();
      selected.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      if (next.size !== selected.size) commit(next);
    },
    clear: () => {
      if (selected.size === 0) return;
      commit(new Set());
    },
    subscribeItem: (id, listener) => {
      let set = itemListeners.get(id);
      if (!set) {
        set = new Set();
        itemListeners.set(id, set);
      }
      set.add(listener);
      return () => {
        const current = itemListeners.get(id);
        if (!current) return;
        current.delete(listener);
        if (current.size === 0) itemListeners.delete(id);
      };
    },
    subscribeMode: (listener) => {
      modeListeners.add(listener);
      return () => {
        modeListeners.delete(listener);
      };
    },
    subscribeCount: (listener) => {
      countListeners.add(listener);
      return () => {
        countListeners.delete(listener);
      };
    },
  };
}

export function useSelectionMode(store: SelectionStore) {
  return useSyncExternalStore(
    store.subscribeMode,
    store.getMode,
    store.getMode
  );
}

export function useSelectionCount(store: SelectionStore) {
  return useSyncExternalStore(store.subscribeCount, store.size, store.size);
}

export function useIsSelected(store: SelectionStore, id: string) {
  const subscribe = useCallback(
    (listener: Listener) => store.subscribeItem(id, listener),
    [store, id]
  );
  const getSnapshot = useCallback(() => store.has(id), [store, id]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useMessageSelection() {
  const ref = useRef<SelectionStore | null>(null);
  if (ref.current === null) ref.current = createSelectionStore();
  const store = ref.current;
  const selectionMode = useSelectionMode(store);

  useEffect(() => {
    if (!selectionMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") store.clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectionMode, store]);

  return { store, selectionMode };
}
