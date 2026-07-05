// import { create } from "zustand";
// import { useChatStore } from "@/store/chat-store";

// interface ChannelStore {
//   activeChannelId: string | null;
//   setActiveChannel: (id: string | null) => void;
// }

// export const useChannelStore = create<ChannelStore>((set) => ({
//   activeChannelId: null,
//   setActiveChannel: (id) => {
//     if (id) useChatStore.getState().setActiveChat(null);
//     set({ activeChannelId: id });
//   },
// }));
import { create } from "zustand";
import { useChatStore } from "@/store/chat-store";

interface ChannelStore {
  activeChannelId: string | null;
  activeCommentsPostId: string | null;
  setActiveChannel: (id: string | null) => void;
  openPostComments: (postId: string) => void;
  closePostComments: () => void;
}

export const useChannelStore = create<ChannelStore>((set) => ({
  activeChannelId: null,
  activeCommentsPostId: null,
  setActiveChannel: (id) => {
    if (id) useChatStore.getState().setActiveChat(null);
    set({ activeChannelId: id, activeCommentsPostId: null });
  },
  openPostComments: (postId) => set({ activeCommentsPostId: postId }),
  closePostComments: () => set({ activeCommentsPostId: null }),
}));
