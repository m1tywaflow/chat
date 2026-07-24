// import { create } from "zustand";
// import type { Group, GroupMessage } from "@/types/group";
// import {
//   createGroup as createGroupFs,
//   addMembersToGroup as addMembersToGroupFs,
//   subscribeToUserGroups,
//   subscribeToGroupMessages,
//   sendGroupMessage as sendGroupMessageFs,
//   markGroupMessageRead as markGroupMessageReadFs,
// } from "@/lib/firestore/groups";

// interface GroupStore {
//   groups: Group[];
//   activeGroupId: string | null;
//   messagesByGroup: Record<string, GroupMessage[]>;

//   _groupsUnsub: (() => void) | null;
//   _messagesUnsub: Record<string, () => void>;

//   initGroups: (uid: string) => void;
//   disposeGroups: () => void;

//   setActiveGroup: (groupId: string | null) => void;
//   subscribeMessages: (groupId: string) => void;
//   unsubscribeMessages: (groupId: string) => void;

//   createGroup: (
//     ownerId: string,
//     ownerName: string,
//     name: string,
//     memberIds: string[],
//     avatarUrl?: string | null
//   ) => Promise<string>;
//   addMembers: (groupId: string, memberIds: string[]) => Promise<void>;
//   sendMessage: (
//     groupId: string,
//     senderId: string,
//     senderName: string,
//     text: string,
//     senderAvatarUrl?: string
//   ) => Promise<void>;
//   markRead: (groupId: string, messageId: string, uid: string) => Promise<void>;
// }

// export const useGroupStore = create<GroupStore>((set, get) => ({
//   groups: [],
//   activeGroupId: null,
//   messagesByGroup: {},

//   _groupsUnsub: null,
//   _messagesUnsub: {},

//   initGroups: (uid) => {
//     if (get()._groupsUnsub) return;

//     const unsub = subscribeToUserGroups(uid, (groups) => {
//       set({ groups });
//     });

//     set({ _groupsUnsub: unsub });
//   },

//   disposeGroups: () => {
//     get()._groupsUnsub?.();
//     Object.values(get()._messagesUnsub).forEach((unsub) => unsub());
//     set({
//       _groupsUnsub: null,
//       _messagesUnsub: {},
//       groups: [],
//       messagesByGroup: {},
//     });
//   },

//   setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

//   subscribeMessages: (groupId) => {
//     if (get()._messagesUnsub[groupId]) return;

//     const unsub = subscribeToGroupMessages(groupId, (messages) => {
//       set((state) => ({
//         messagesByGroup: { ...state.messagesByGroup, [groupId]: messages },
//       }));
//     });

//     set((state) => ({
//       _messagesUnsub: { ...state._messagesUnsub, [groupId]: unsub },
//     }));
//   },

//   unsubscribeMessages: (groupId) => {
//     get()._messagesUnsub[groupId]?.();
//     set((state) => {
//       const next = { ...state._messagesUnsub };
//       delete next[groupId];
//       return { _messagesUnsub: next };
//     });
//   },

//   createGroup: async (ownerId, ownerName, name, memberIds, avatarUrl) => {
//     return createGroupFs(ownerId, ownerName, name, memberIds, avatarUrl);
//   },

//   addMembers: async (groupId, memberIds) => {
//     await addMembersToGroupFs(groupId, memberIds);
//   },

//   sendMessage: async (groupId, senderId, senderName, text, senderAvatarUrl) => {
//     await sendGroupMessageFs(
//       groupId,
//       senderId,
//       senderName,
//       text,
//       senderAvatarUrl
//     );
//   },

//   markRead: async (groupId, messageId, uid) => {
//     await markGroupMessageReadFs(groupId, messageId, uid);
//   },
// }));
import { create } from "zustand";
import type { Group, GroupMessage } from "@/types/group";
import {
  createGroup as createGroupFs,
  addMembersToGroup as addMembersToGroupFs,
  subscribeToUserGroups,
  subscribeToGroupMessages,
  sendGroupMessage as sendGroupMessageFs,
  markGroupMessageRead as markGroupMessageReadFs,
} from "@/lib/firestore/groups";

interface GroupStore {
  groups: Group[];
  activeGroupId: string | null;
  messagesByGroup: Record<string, GroupMessage[]>;

  _groupsUnsub: (() => void) | null;
  _messagesUnsub: Record<string, () => void>;

  initGroups: (uid: string) => void;
  disposeGroups: () => void;

  setActiveGroup: (groupId: string | null) => void;
  subscribeMessages: (groupId: string) => void;
  unsubscribeMessages: (groupId: string) => void;

  createGroup: (
    ownerId: string,
    ownerName: string,
    name: string,
    memberIds: string[],
    avatarUrl?: string | null
  ) => Promise<string>;

  addMembers: (groupId: string, memberIds: string[]) => Promise<void>;

  sendMessage: (
    groupId: string,
    senderId: string,
    senderName: string,
    text: string,
    senderAvatarUrl?: string,
    replyTo?: {
      id: string;
      text: string;
      imageUrl?: string;
    } | null,
    imageUrl?: string
  ) => Promise<void>;

  markRead: (groupId: string, messageId: string, uid: string) => Promise<void>;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  activeGroupId: null,
  messagesByGroup: {},

  _groupsUnsub: null,
  _messagesUnsub: {},

  initGroups: (uid) => {
    if (get()._groupsUnsub) return;

    const unsub = subscribeToUserGroups(uid, (groups) => {
      set({ groups });
    });

    set({ _groupsUnsub: unsub });
  },

  disposeGroups: () => {
    get()._groupsUnsub?.();

    Object.values(get()._messagesUnsub).forEach((unsub) => {
      unsub();
    });

    set({
      _groupsUnsub: null,
      _messagesUnsub: {},
      groups: [],
      messagesByGroup: {},
    });
  },

  setActiveGroup: (groupId) => {
    set({ activeGroupId: groupId });
  },

  subscribeMessages: (groupId) => {
    if (get()._messagesUnsub[groupId]) return;

    const unsub = subscribeToGroupMessages(groupId, (messages) => {
      set((state) => ({
        messagesByGroup: {
          ...state.messagesByGroup,
          [groupId]: messages,
        },
      }));
    });

    set((state) => ({
      _messagesUnsub: {
        ...state._messagesUnsub,
        [groupId]: unsub,
      },
    }));
  },

  unsubscribeMessages: (groupId) => {
    get()._messagesUnsub[groupId]?.();

    set((state) => {
      const next = { ...state._messagesUnsub };

      delete next[groupId];

      return {
        _messagesUnsub: next,
      };
    });
  },

  createGroup: async (ownerId, ownerName, name, memberIds, avatarUrl) => {
    return createGroupFs(ownerId, ownerName, name, memberIds, avatarUrl);
  },

  addMembers: async (groupId, memberIds) => {
    await addMembersToGroupFs(groupId, memberIds);
  },

  sendMessage: async (
    groupId,
    senderId,
    senderName,
    text,
    senderAvatarUrl,
    replyTo,
    imageUrl
  ) => {
    await sendGroupMessageFs(
      groupId,
      senderId,
      senderName,
      text,
      senderAvatarUrl,
      replyTo,
      imageUrl
    );
  },

  markRead: async (groupId, messageId, uid) => {
    await markGroupMessageReadFs(groupId, messageId, uid);
  },
}));
