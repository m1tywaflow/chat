// "use client";

// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import { onAuthStateChanged } from "firebase/auth";
// import { Chat } from "@/types/chat";
// import { useChannelStore } from "@/store/channel-store";
// import { useGroupStore } from "@/store/group-store";
// import { auth } from "@/lib/firebase";
// import { subscribeToDrafts, type DraftChange } from "@/lib/firestore/drafts";

// interface ChatStore {
//   chats: Chat[];
//   activeChatId: string | null;
//   openedAt: Record<string, number>;
//   drafts: Record<string, string>;

//   setChats: (chats: Chat[]) => void;
//   setActiveChat: (id: string | null) => void;
//   markOpened: (chatId: string) => void;
//   setDraft: (chatId: string, text: string) => void;
//   clearDraft: (chatId: string) => void;
// }

// export const useChatStore = create<ChatStore>()(
//   persist(
//     (set, get) => ({
//       chats: [],
//       activeChatId: null,
//       openedAt: {},
//       drafts: {},

//       setChats: (chats) => set({ chats }),

//       setActiveChat: (id) => {
//         if (id) useChannelStore.getState().setActiveChannel(null);
//         set({ activeChatId: id });
//       },

//       markOpened: (chatId) =>
//         set((state) => ({
//           openedAt: {
//             ...state.openedAt,
//             [chatId]: Date.now(),
//           },
//         })),

//       setDraft: (chatId, text) => {
//         const current = get().drafts[chatId];
//         if (!text.trim()) {
//           if (current === undefined) return;
//           set((state) => {
//             const next = { ...state.drafts };
//             delete next[chatId];
//             return { drafts: next };
//           });
//           return;
//         }
//         if (current === text) return;
//         set((state) => ({ drafts: { ...state.drafts, [chatId]: text } }));
//       },

//       clearDraft: (chatId) => {
//         if (get().drafts[chatId] === undefined) return;
//         set((state) => {
//           const next = { ...state.drafts };
//           delete next[chatId];
//           return { drafts: next };
//         });
//       },
//     }),
//     {
//       name: "chat-store",
//       partialize: (state) => ({
//         openedAt: state.openedAt,
//         drafts: state.drafts,
//       }),
//     }
//   )
// );

// function applyDraftChanges(
//   changes: DraftChange[],
//   snapshotIds: string[] | null
// ) {
//   const state = useChatStore.getState();
//   const activeChatId = state.activeChatId;
//   const activeGroupId = useGroupStore.getState().activeGroupId;
//   const isActive = (id: string) => id === activeChatId || id === activeGroupId;

//   if (snapshotIds) {
//     const remote = new Set(snapshotIds);
//     for (const id of Object.keys(state.drafts)) {
//       if (!isActive(id) && !remote.has(id)) state.clearDraft(id);
//     }
//   }

//   for (const change of changes) {
//     if (isActive(change.chatId)) continue;
//     if (change.removed) state.clearDraft(change.chatId);
//     else state.setDraft(change.chatId, change.text);
//   }
// }

// function startDraftSync() {
//   const g = globalThis as any;
//   g.__nexoDraftsAuthUnsub?.();
//   g.__nexoDraftsUnsub?.();
//   g.__nexoDraftsUnsub = null;

//   g.__nexoDraftsAuthUnsub = onAuthStateChanged(auth, (user) => {
//     g.__nexoDraftsUnsub?.();
//     g.__nexoDraftsUnsub = user
//       ? subscribeToDrafts(user.uid, applyDraftChanges)
//       : null;
//   });
// }

// if (typeof window !== "undefined") {
//   window.addEventListener("storage", (e) => {
//     if (e.key === "chat-store") useChatStore.persist.rehydrate();
//   });
//   startDraftSync();
// }

// interface PlayerState {
//   currentlyPlayingId: string | null;
//   setCurrentlyPlaying: (id: string | null) => void;
// }

// export const usePlayerStore = create<PlayerState>((set) => ({
//   currentlyPlayingId: null,
//   setCurrentlyPlaying: (id) => set({ currentlyPlayingId: id }),
// }));

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { onAuthStateChanged } from "firebase/auth";
import { Chat } from "@/types/chat";
import { useChannelStore } from "@/store/channel-store";
import { useGroupStore } from "@/store/group-store";
import { auth } from "@/lib/firebase";
import { subscribeToDrafts, type DraftChange } from "@/lib/firestore/drafts";

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  openedAt: Record<string, number>;
  drafts: Record<string, string>;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (id: string | null) => void;
  markOpened: (chatId: string) => void;
  setDraft: (chatId: string, text: string) => void;
  clearDraft: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      openedAt: {},
      drafts: {},

      setChats: (chats) => set({ chats }),

      setActiveChat: (id) => {
        if (id) useChannelStore.getState().setActiveChannel(null);
        set({ activeChatId: id });
      },

      markOpened: (chatId) =>
        set((state) => ({
          openedAt: {
            ...state.openedAt,
            [chatId]: Date.now(),
          },
        })),

      setDraft: (chatId, text) => {
        const current = get().drafts[chatId];
        if (!text.trim()) {
          if (current === undefined) return;
          set((state) => {
            const next = { ...state.drafts };
            delete next[chatId];
            return { drafts: next };
          });
          return;
        }
        if (current === text) return;
        set((state) => ({ drafts: { ...state.drafts, [chatId]: text } }));
      },

      clearDraft: (chatId) => {
        if (get().drafts[chatId] === undefined) return;
        set((state) => {
          const next = { ...state.drafts };
          delete next[chatId];
          return { drafts: next };
        });
      },
    }),
    {
      name: "chat-store",
      partialize: (state) => ({
        openedAt: state.openedAt,
        drafts: state.drafts,
      }),
    }
  )
);

function applyDraftChanges(
  changes: DraftChange[],
  snapshotIds: string[] | null
) {
  const state = useChatStore.getState();
  const activeChatId = state.activeChatId;
  const activeGroupId = useGroupStore.getState().activeGroupId;
  const activeChannelId = useChannelStore.getState().activeChannelId;
  const isActive = (id: string) =>
    id === activeChatId || id === activeGroupId || id === activeChannelId;

  if (snapshotIds) {
    const remote = new Set(snapshotIds);
    for (const id of Object.keys(state.drafts)) {
      if (!isActive(id) && !remote.has(id)) state.clearDraft(id);
    }
  }

  for (const change of changes) {
    if (isActive(change.chatId)) continue;
    if (change.removed) state.clearDraft(change.chatId);
    else state.setDraft(change.chatId, change.text);
  }
}

function startDraftSync() {
  const g = globalThis as any;
  g.__nexoDraftsAuthUnsub?.();
  g.__nexoDraftsUnsub?.();
  g.__nexoDraftsUnsub = null;

  g.__nexoDraftsAuthUnsub = onAuthStateChanged(auth, (user) => {
    g.__nexoDraftsUnsub?.();
    g.__nexoDraftsUnsub = user
      ? subscribeToDrafts(user.uid, applyDraftChanges)
      : null;
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "chat-store") useChatStore.persist.rehydrate();
  });
  startDraftSync();
}

interface PlayerState {
  currentlyPlayingId: string | null;
  setCurrentlyPlaying: (id: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentlyPlayingId: null,
  setCurrentlyPlaying: (id) => set({ currentlyPlayingId: id }),
}));
