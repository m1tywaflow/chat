// "use client";

// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import { Chat } from "@/types/chat";
// import { useChannelStore } from "@/store/channel-store";

// interface ChatStore {
//   chats: Chat[];
//   activeChatId: string | null;
//   openedAt: Record<string, number>;

//   setChats: (chats: Chat[]) => void;
//   setActiveChat: (id: string | null) => void;
//   markOpened: (chatId: string) => void;
// }

// export const useChatStore = create<ChatStore>()(
//   persist(
//     (set, get) => ({
//       chats: [],
//       activeChatId: null,
//       openedAt: {},

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
//     }),
//     {
//       name: "chat-store",
//       partialize: (state) => ({
//         openedAt: state.openedAt,
//       }),
//     }
//   )
// );
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
  const activeId = state.activeChatId;

  if (snapshotIds) {
    const remote = new Set(snapshotIds);
    for (const chatId of Object.keys(state.drafts)) {
      if (chatId !== activeId && !remote.has(chatId)) state.clearDraft(chatId);
    }
  }

  for (const change of changes) {
    if (change.chatId === activeId) continue;
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
