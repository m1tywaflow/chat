"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chat } from "@/types/chat";

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  openedAt: Record<string, number>;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (id: string | null) => void;
  markOpened: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      openedAt: {},

      setChats: (chats) => set({ chats }),

      setActiveChat: (id) => set({ activeChatId: id }),

      markOpened: (chatId) =>
        set((state) => ({
          openedAt: {
            ...state.openedAt,
            [chatId]: Date.now(),
          },
        })),
    }),
    {
      name: "chat-store",
      partialize: (state) => ({
        openedAt: state.openedAt,
      }),
    }
  )
);
