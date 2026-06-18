import { create } from "zustand";
import { Chat } from "@/types/chat";

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (id: string) => void;
}
export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChatId: null,

  setChats: (chats) => set({ chats }),
  setActiveChat: (id) => set({ activeChatId: id }),
}));
