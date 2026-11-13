// import {
//   collection,
//   doc,
//   setDoc,
//   addDoc,
//   query,
//   where,
//   onSnapshot,
//   orderBy,
//   documentId,
//   getDocs,
//   updateDoc,
//   serverTimestamp,
//   increment,
//   arrayUnion,
//   arrayRemove,
//   getDoc,
//   limit,
//   startAfter,
//   runTransaction,
//   FieldPath,
// } from "firebase/firestore";

// import { db } from "@/lib/firebase";
// import type { ForwardableContent } from "@/types/forward";
// import { buildForwardedFrom } from "@/lib/forwarding";
// import { callPreviewText, encodeCallPreview } from "@/lib/firestore/callLog";
// import { getCustomEmoji } from "@/lib/customEmoji";
// import {
//   ensureSavedChat,
//   getSavedChatId,
//   getSavedParticipant,
// } from "@/lib/savedChat";

// export interface PinnedItem {
//   id: string;
//   text: string;
// }

// export function readPins(data: any): PinnedItem[] {
//   if (Array.isArray(data?.pinnedMessages)) {
//     return data.pinnedMessages
//       .filter((p: any) => p && p.id)
//       .map((p: any) => ({ id: p.id, text: p.text || "" }));
//   }
//   if (data?.pinnedMessage?.id) {
//     return [{ id: data.pinnedMessage.id, text: data.pinnedMessage.text || "" }];
//   }
//   return [];
// }

// function buildPinPatch(next: PinnedItem[]) {
//   return {
//     pinnedMessages: next,
//     pinnedMessage: next.length ? next[next.length - 1] : null,
//   };
// }

// export function getChatId(uid1: string, uid2: string) {
//   return [uid1, uid2].sort().join("_");
// }
// export async function setTyping(
//   chatId: string,
//   uid: string,
//   isTyping: boolean
// ) {
//   if (chatId === getSavedChatId(uid)) return;

//   const ref = doc(db, "chats", chatId);

//   await updateDoc(ref, {
//     [`typing.${uid}`]: isTyping,
//   });
// }
// export async function createOrGetChat(myUid: string, otherUid: string) {
//   if (myUid === otherUid) {
//     await ensureSavedChat(myUid);
//     return getSavedChatId(myUid);
//   }

//   const chatId = [myUid, otherUid].sort().join("_");

//   await setDoc(
//     doc(db, "chats", chatId),
//     {
//       id: chatId,
//       participantIds: [myUid, otherUid],
//       lastMessage: "",
//       lastMessageTime: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//       typing: {},
//     },
//     { merge: true }
//   );

//   return chatId;
// }

// export async function searchUsers(search: string) {
//   const q = search?.toLowerCase().trim();

//   if (!q) return [];

//   const snap = await getDocs(collection(db, "users"));

//   return snap.docs
//     .map((d) => ({
//       id: d.id,
//       ...d.data(),
//     }))
//     .filter((u: any) => (u.username || "").toLowerCase().includes(q));
// }

// export async function sendMessage(
//   chatId: string,
//   myUid: string,
//   text: string,
//   replyTo?: any,
//   imageUrl?: string,
//   imageWidth?: number | null,
//   imageHeight?: number | null
// ) {
//   if (!chatId || !myUid || (!text.trim() && !imageUrl)) return;

//   const [uid1, uid2] = chatId.split("_");
//   const otherUid = uid1 === myUid ? uid2 : uid1;

//   if (chatId === getSavedChatId(myUid)) await ensureSavedChat(myUid);

//   const docRef = await addDoc(collection(db, "chats", chatId, "messages"), {
//     senderId: myUid,
//     text: text.trim(),
//     imageUrl: imageUrl || null,
//     ...(imageUrl && imageWidth && imageHeight
//       ? { imageWidth, imageHeight }
//       : {}),
//     createdAt: serverTimestamp(),
//     replyTo: replyTo
//       ? {
//           id: replyTo.id,
//           text: replyTo.text ?? "",
//           senderId: replyTo.senderId ?? null,
//           imageUrl: replyTo.imageUrl || null,
//         }
//       : null,
//   });

//   const chatUpdate: Record<string, any> = {
//     lastMessage: imageUrl && !text.trim() ? "📷 Photo" : text.trim(),
//     lastMessageTime: serverTimestamp(),
//     updatedAt: serverTimestamp(),
//   };
//   if (otherUid !== myUid) {
//     chatUpdate[`unreadCount.${otherUid}`] = increment(1);
//   }

//   await updateDoc(doc(db, "chats", chatId), chatUpdate);

//   return docRef.id;
// }
// const MESSAGES_PAGE_SIZE = 50;

// export function subscribeToMessages(
//   chatId: string,
//   cb: (m: any[], hasMore: boolean) => void,
//   pageSize: number = MESSAGES_PAGE_SIZE,
//   onError?: (error: Error) => void
// ) {
//   if (!chatId) return () => {};

//   const q = query(
//     collection(db, "chats", chatId, "messages"),
//     orderBy("createdAt", "desc"),
//     orderBy(documentId(), "desc"),
//     limit(pageSize)
//   );

//   return onSnapshot(
//     q,
//     (snap) => {
//       const docs = [...snap.docs].reverse();
//       cb(
//         docs.map((d) => ({
//           id: d.id,
//           ...d.data(),
//         })),
//         snap.docs.length === pageSize
//       );
//     },
//     (error) => onError?.(error)
//   );
// }
// export async function loadOlderMessages(
//   chatId: string,
//   beforeMessage: { id: string; createdAt: any },
//   pageSize: number = MESSAGES_PAGE_SIZE
// ): Promise<{ messages: any[]; hasMore: boolean }> {
//   if (!chatId || !beforeMessage) return { messages: [], hasMore: false };

//   const q = query(
//     collection(db, "chats", chatId, "messages"),
//     orderBy("createdAt", "desc"),
//     orderBy(documentId(), "desc"),
//     startAfter(beforeMessage.createdAt, beforeMessage.id),
//     limit(pageSize)
//   );

//   const snap = await getDocs(q);
//   const docs = [...snap.docs].reverse();
//   return {
//     messages: docs.map((d) => ({ id: d.id, ...d.data() })),
//     hasMore: snap.docs.length === pageSize,
//   };
// }

// export function subscribeToUserChats(
//   myUid: string,
//   cb: (c: any[]) => void,
//   onNewMessage?: (payload: {
//     chatId: string;
//     senderName: string;
//     senderAvatar?: string;
//     text: string;
//   }) => void
// ) {
//   if (!myUid) return () => {};

//   const savedChatId = getSavedChatId(myUid);

//   const q = query(
//     collection(db, "chats"),
//     where("participantIds", "array-contains", myUid),
//     orderBy("updatedAt", "desc")
//   );

//   const userUnsubs = new Map<string, () => void>();
//   const userCache = new Map<string, any>();
//   const prevUnread = new Map<string, number>();
//   const lastKnownTime = new Map<string, any>();
//   let chatCache: any[] = [];
//   let isFirstSnapshot = true;

//   function rebuild() {
//     cb(
//       chatCache
//         .map((chat) => ({
//           ...chat,
//           participant: userCache.get(chat._otherUid) || chat.participant,
//         }))
//         .filter((c) => !c.deleted)
//     );
//   }

//   const chatUnsub = onSnapshot(q, (snap) => {
//     chatCache = snap.docs.map((d) => {
//       const chat = d.data() as any;
//       const isSaved = d.id === savedChatId;
//       const otherUid = isSaved
//         ? ""
//         : chat?.participantIds?.find((id: string) => id !== myUid) || "";

//       if (otherUid && !userUnsubs.has(otherUid)) {
//         const unsub = onSnapshot(doc(db, "users", otherUid), (userSnap) => {
//           if (userSnap.exists()) {
//             userCache.set(otherUid, { id: userSnap.id, ...userSnap.data() });
//             rebuild();
//           }
//         });
//         userUnsubs.set(otherUid, unsub);
//       }

//       const unreadCount = isSaved ? 0 : chat.unreadCount?.[myUid] || 0;

//       if (
//         !isFirstSnapshot &&
//         !isSaved &&
//         onNewMessage &&
//         !chat.deleted?.[myUid]
//       ) {
//         const prev = prevUnread.get(chat.id) ?? 0;
//         if (unreadCount > prev) {
//           const participant = userCache.get(otherUid);
//           onNewMessage({
//             chatId: chat.id,
//             senderName: participant?.username || "New message",
//             senderAvatar: participant?.avatar,
//             text: callPreviewText(chat.lastMessage, myUid),
//           });
//         }
//       }
//       prevUnread.set(chat.id || d.id, unreadCount);

//       if (chat.lastMessageTime) {
//         lastKnownTime.set(d.id, chat.lastMessageTime);
//       }

//       return {
//         id: chat.id || d.id,
//         _otherUid: otherUid,
//         isSaved,
//         participant: isSaved
//           ? getSavedParticipant(myUid)
//           : userCache.get(otherUid) || {
//               id: otherUid,
//               username: "Unknown user",
//               avatar: "",
//               online: false,
//             },
//         lastMessage: chat.lastMessage || "",
//         lastMessageTime:
//           chat.lastMessageTime || lastKnownTime.get(d.id) || null,
//         unreadCount,
//         deleted: isSaved ? false : chat.deleted?.[myUid] || false,
//       };
//     });

//     isFirstSnapshot = false;
//     rebuild();
//   });

//   return () => {
//     chatUnsub();
//     userUnsubs.forEach((unsub) => unsub());
//   };
// }
// export async function markMessageRead(
//   chatId: string,
//   messageId: string,
//   uid: string
// ) {
//   const ref = doc(db, "chats", chatId, "messages", messageId);
//   try {
//     await updateDoc(ref, { readBy: arrayUnion(uid) });
//   } catch (err: any) {
//     if (err?.code !== "not-found") console.warn("markMessageRead failed:", err);
//   }
// }
// export async function toggleReaction(
//   chatId: string,
//   messageId: string,
//   emoji: string,
//   uid: string,
//   currentReactions?: Record<string, string[]>
// ): Promise<void> {
//   const msgRef = doc(db, "chats", chatId, "messages", messageId);

//   let reactions = currentReactions;
//   if (reactions === undefined) {
//     const snap = await getDoc(msgRef);
//     if (!snap.exists()) return;
//     reactions = (snap.data()?.reactions ?? {}) as Record<string, string[]>;
//   }

//   const reacted = (reactions[emoji] ?? []).includes(uid);

//   const args: unknown[] = [];
//   args.push(
//     new FieldPath("reactions", emoji),
//     reacted ? arrayRemove(uid) : arrayUnion(uid)
//   );

//   if (!reacted) {
//     for (const [token, uids] of Object.entries(reactions)) {
//       if (token !== emoji && uids.includes(uid)) {
//         args.push(new FieldPath("reactions", token), arrayRemove(uid));
//       }
//     }
//   }

//   await updateDoc(msgRef, ...(args as [FieldPath, unknown, ...unknown[]]));

//   if (!reacted) {
//     try {
//       await updateDoc(doc(db, "chats", chatId), {
//         lastMessage: getCustomEmoji(emoji)
//           ? "Reacted to a message"
//           : `${emoji} Reacted to a message`,
//         lastMessageTime: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       });
//     } catch (err) {
//       console.warn("Reaction preview update failed:", err);
//     }
//   }
// }

// export async function editMessage(
//   chatId: string,
//   messageId: string,
//   newText: string
// ) {
//   await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
//     text: newText,
//     edited: true,
//   });
// }

// export async function deleteMessage(chatId: string, messageId: string) {
//   await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
//     deleted: true,
//     text: "",
//     imageUrl: null,
//     voiceUrl: null,
//   });

//   try {
//     await removePinnedMessage(chatId, messageId);
//   } catch (err) {
//     console.warn("Unpin on delete failed:", err);
//   }

//   const snap = await getDocs(
//     query(
//       collection(db, "chats", chatId, "messages"),
//       orderBy("createdAt", "desc"),
//       limit(20)
//     )
//   );
//   const last = snap.docs.map((d) => d.data()).find((m) => !m.deleted);

//   let lastMessage = "";
//   if (last) {
//     if (last.type === "call" && last.callStatus && last.senderId) {
//       lastMessage = encodeCallPreview({
//         status: last.callStatus,
//         callType: last.callType === "video" ? "video" : "audio",
//         senderId: last.senderId,
//       });
//     } else if (last.voiceUrl) {
//       lastMessage = "Voice message";
//     } else if (last.imageUrl && !last.text) {
//       lastMessage = "Photo";
//     } else {
//       lastMessage = last.text || "";
//     }
//   }

//   await updateDoc(doc(db, "chats", chatId), {
//     lastMessage,
//     ...(last?.createdAt ? { lastMessageTime: last.createdAt } : {}),
//   });
// }

// export async function addPinnedMessage(
//   chatId: string,
//   messageId: string,
//   text: string
// ) {
//   const ref = doc(db, "chats", chatId);
//   await runTransaction(db, async (tx) => {
//     const snap = await tx.get(ref);
//     const current = readPins(snap.data());
//     if (current.some((p) => p.id === messageId)) return;
//     tx.update(ref, buildPinPatch([...current, { id: messageId, text }]));
//   });
// }

// export async function removePinnedMessage(chatId: string, messageId: string) {
//   const ref = doc(db, "chats", chatId);
//   await runTransaction(db, async (tx) => {
//     const snap = await tx.get(ref);
//     const current = readPins(snap.data());
//     const next = current.filter((p) => p.id !== messageId);
//     if (next.length === current.length) return;
//     tx.update(ref, buildPinPatch(next));
//   });
// }

// export async function pinMessage(
//   chatId: string,
//   messageId: string | null,
//   messageText: string | null
// ) {
//   if (messageId) {
//     await addPinnedMessage(chatId, messageId, messageText || "");
//     return;
//   }
//   await updateDoc(doc(db, "chats", chatId), buildPinPatch([]));
// }

// export async function togglePinChat(
//   userId: string,
//   chatId: string,
//   pinned: boolean
// ) {
//   await updateDoc(doc(db, "users", userId), {
//     [`pinnedChats.${chatId}`]: pinned,
//   });
// }
// export async function forwardMessageToChat(
//   targetChatId: string,
//   myUid: string,
//   original: ForwardableContent
// ) {
//   const [uid1, uid2] = targetChatId.split("_");
//   const otherUid = uid1 === myUid ? uid2 : uid1;

//   if (targetChatId === getSavedChatId(myUid)) await ensureSavedChat(myUid);

//   await addDoc(collection(db, "chats", targetChatId, "messages"), {
//     senderId: myUid,
//     text: original.text || "",
//     imageUrl: original.imageUrl || null,
//     ...(original.imageUrl && original.imageWidth && original.imageHeight
//       ? { imageWidth: original.imageWidth, imageHeight: original.imageHeight }
//       : {}),
//     voiceUrl: original.voiceUrl || null,
//     duration: original.duration ?? null,
//     waveform: original.waveform ?? null,
//     createdAt: serverTimestamp(),
//     replyTo: null,
//     forwardedFrom: buildForwardedFrom(original),
//   });

//   const chatUpdate: Record<string, any> = {
//     lastMessage:
//       original.imageUrl && !original.text
//         ? "📷 Photo"
//         : original.voiceUrl && !original.text
//         ? "Voice message"
//         : original.text || "",
//     lastMessageTime: serverTimestamp(),
//     updatedAt: serverTimestamp(),
//   };
//   if (otherUid !== myUid) {
//     chatUpdate[`unreadCount.${otherUid}`] = increment(1);
//   }

//   await updateDoc(doc(db, "chats", targetChatId), chatUpdate);
// }

// export async function sendVoiceMessage(
//   chatId: string,
//   senderId: string,
//   replyTo: any | null,
//   voiceUrl: string,
//   duration: number,
//   waveform: number[]
// ) {
//   if (chatId === getSavedChatId(senderId)) await ensureSavedChat(senderId);

//   await addDoc(collection(db, "chats", chatId, "messages"), {
//     senderId,
//     text: "",
//     voiceUrl,
//     duration,
//     waveform,
//     replyTo: replyTo
//       ? {
//           id: replyTo.id,
//           text: replyTo.text ?? "",
//           senderId: replyTo.senderId ?? null,
//           imageUrl: replyTo.imageUrl || null,
//         }
//       : null,
//     createdAt: serverTimestamp(),
//     readBy: [],
//     reactions: {},
//   });

//   await updateDoc(doc(db, "chats", chatId), {
//     lastMessage: "Voice message",
//     lastMessageTime: serverTimestamp(),
//     updatedAt: serverTimestamp(),
//   });
// }

import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  documentId,
  getDocs,
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
  limit,
  startAfter,
  runTransaction,
  FieldPath,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { ForwardableContent } from "@/types/forward";
import { buildForwardedFrom } from "@/lib/forwarding";
import { callPreviewText, encodeCallPreview } from "@/lib/firestore/callLog";
import { getCustomEmoji } from "@/lib/customEmoji";
import {
  ensureSavedChat,
  getSavedChatId,
  getSavedParticipant,
} from "@/lib/savedChat";
import {
  releaseUser,
  retainUser,
  useUserCacheStore,
} from "@/store/user-cache-store";

export interface PinnedItem {
  id: string;
  text: string;
}

export function readPins(data: any): PinnedItem[] {
  if (Array.isArray(data?.pinnedMessages)) {
    return data.pinnedMessages
      .filter((p: any) => p && p.id)
      .map((p: any) => ({ id: p.id, text: p.text || "" }));
  }
  if (data?.pinnedMessage?.id) {
    return [{ id: data.pinnedMessage.id, text: data.pinnedMessage.text || "" }];
  }
  return [];
}

function buildPinPatch(next: PinnedItem[]) {
  return {
    pinnedMessages: next,
    pinnedMessage: next.length ? next[next.length - 1] : null,
  };
}

export function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}
export async function setTyping(
  chatId: string,
  uid: string,
  isTyping: boolean
) {
  if (chatId === getSavedChatId(uid)) return;

  const ref = doc(db, "chats", chatId);

  await updateDoc(ref, {
    [`typing.${uid}`]: isTyping,
  });
}
export async function createOrGetChat(myUid: string, otherUid: string) {
  if (myUid === otherUid) {
    await ensureSavedChat(myUid);
    return getSavedChatId(myUid);
  }

  const chatId = [myUid, otherUid].sort().join("_");

  await setDoc(
    doc(db, "chats", chatId),
    {
      id: chatId,
      participantIds: [myUid, otherUid],
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      typing: {},
    },
    { merge: true }
  );

  return chatId;
}

export async function searchUsers(search: string) {
  const q = search?.toLowerCase().trim();

  if (!q) return [];

  const snap = await getDocs(collection(db, "users"));

  return snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((u: any) => (u.username || "").toLowerCase().includes(q));
}

export async function sendMessage(
  chatId: string,
  myUid: string,
  text: string,
  replyTo?: any,
  imageUrl?: string,
  imageWidth?: number | null,
  imageHeight?: number | null
) {
  if (!chatId || !myUid || (!text.trim() && !imageUrl)) return;

  const [uid1, uid2] = chatId.split("_");
  const otherUid = uid1 === myUid ? uid2 : uid1;

  if (chatId === getSavedChatId(myUid)) await ensureSavedChat(myUid);

  const docRef = await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId: myUid,
    text: text.trim(),
    imageUrl: imageUrl || null,
    ...(imageUrl && imageWidth && imageHeight
      ? { imageWidth, imageHeight }
      : {}),
    createdAt: serverTimestamp(),
    replyTo: replyTo
      ? {
          id: replyTo.id,
          text: replyTo.text ?? "",
          senderId: replyTo.senderId ?? null,
          imageUrl: replyTo.imageUrl || null,
        }
      : null,
  });

  const chatUpdate: Record<string, any> = {
    lastMessage: imageUrl && !text.trim() ? "📷 Photo" : text.trim(),
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (otherUid !== myUid) {
    chatUpdate[`unreadCount.${otherUid}`] = increment(1);
  }

  await updateDoc(doc(db, "chats", chatId), chatUpdate);

  return docRef.id;
}
const MESSAGES_PAGE_SIZE = 50;

export function subscribeToMessages(
  chatId: string,
  cb: (m: any[], hasMore: boolean) => void,
  pageSize: number = MESSAGES_PAGE_SIZE,
  onError?: (error: Error) => void
) {
  if (!chatId) return () => {};

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc"),
    orderBy(documentId(), "desc"),
    limit(pageSize)
  );

  return onSnapshot(
    q,
    (snap) => {
      const docs = [...snap.docs].reverse();
      cb(
        docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
        snap.docs.length === pageSize
      );
    },
    (error) => onError?.(error)
  );
}
export async function loadOlderMessages(
  chatId: string,
  beforeMessage: { id: string; createdAt: any },
  pageSize: number = MESSAGES_PAGE_SIZE
): Promise<{ messages: any[]; hasMore: boolean }> {
  if (!chatId || !beforeMessage) return { messages: [], hasMore: false };

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc"),
    orderBy(documentId(), "desc"),
    startAfter(beforeMessage.createdAt, beforeMessage.id),
    limit(pageSize)
  );

  const snap = await getDocs(q);
  const docs = [...snap.docs].reverse();
  return {
    messages: docs.map((d) => ({ id: d.id, ...d.data() })),
    hasMore: snap.docs.length === pageSize,
  };
}

const FIRST_EMIT_TIMEOUT_MS = 1500;
const USER_UPDATE_DELAY_MS = 40;

function sameTime(a: any, b: any) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a.isEqual === "function") return a.isEqual(b);
  return false;
}

function activeFlags(raw: any): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (raw && typeof raw === "object") {
    for (const [uid, value] of Object.entries(raw)) {
      if (value) out[uid] = true;
    }
  }
  return out;
}

function sameFlags(a: Record<string, boolean>, b: Record<string, boolean>) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => b[k] === true)
  );
}

function sameChatRow(a: any, b: any) {
  return (
    a.id === b.id &&
    a.isSaved === b.isSaved &&
    a.participant === b.participant &&
    a.lastMessage === b.lastMessage &&
    a.unreadCount === b.unreadCount &&
    a.deleted === b.deleted &&
    sameTime(a.lastMessageTime, b.lastMessageTime) &&
    sameFlags(a.typing, b.typing)
  );
}

export function subscribeToUserChats(
  myUid: string,
  cb: (c: any[]) => void,
  onNewMessage?: (payload: {
    chatId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
  }) => void
) {
  if (!myUid) return () => {};

  const savedChatId = getSavedChatId(myUid);
  const savedParticipant = getSavedParticipant(myUid);

  const q = query(
    collection(db, "chats"),
    where("participantIds", "array-contains", myUid),
    orderBy("updatedAt", "desc")
  );

  const retained = new Set<string>();
  const fallbacks = new Map<string, any>();
  const prevUnread = new Map<string, number>();
  const lastKnownTime = new Map<string, any>();
  let lastRows = new Map<string, any>();
  let lastList: any[] | null = null;
  let chatCache: any[] = [];
  let isFirstSnapshot = true;
  let waitingForUsers = true;
  let disposed = false;
  let firstEmitTimer: ReturnType<typeof setTimeout> | null = null;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;

  function readUser(uid: string) {
    return useUserCacheStore.getState().entries[uid];
  }

  function fallbackFor(uid: string) {
    let fallback = fallbacks.get(uid);
    if (!fallback) {
      fallback = {
        id: uid,
        username: "Unknown user",
        avatar: "",
        online: false,
      };
      fallbacks.set(uid, fallback);
    }
    return fallback;
  }

  function emit() {
    if (disposed) return;
    const entries = useUserCacheStore.getState().entries;

    if (waitingForUsers) {
      const pending = chatCache.some(
        (c) => c._otherUid && entries[c._otherUid] === undefined
      );
      if (pending) return;
      waitingForUsers = false;
      if (firstEmitTimer) {
        clearTimeout(firstEmitTimer);
        firstEmitTimer = null;
      }
    }

    const nextRows = new Map<string, any>();
    const rows = chatCache.map((raw) => {
      const participant = raw.isSaved
        ? savedParticipant
        : entries[raw._otherUid] ?? fallbackFor(raw._otherUid);
      const candidate = { ...raw, participant };
      const previous = lastRows.get(raw.id);
      const row =
        previous && sameChatRow(previous, candidate) ? previous : candidate;
      nextRows.set(raw.id, row);
      return row;
    });
    lastRows = nextRows;

    const list = rows.filter((c) => !c.deleted);
    const previousList = lastList;
    if (
      previousList &&
      list.length === previousList.length &&
      list.every((c, i) => c === previousList[i])
    ) {
      return;
    }
    lastList = list;
    cb(list);
  }

  function scheduleEmit() {
    if (updateTimer || disposed) return;
    updateTimer = setTimeout(() => {
      updateTimer = null;
      emit();
    }, USER_UPDATE_DELAY_MS);
  }

  function syncRetained() {
    const needed = new Set<string>();
    chatCache.forEach((c) => {
      if (c._otherUid) needed.add(c._otherUid);
    });
    needed.forEach((uid) => {
      if (!retained.has(uid)) {
        retained.add(uid);
        retainUser(uid);
      }
    });
    [...retained].forEach((uid) => {
      if (!needed.has(uid)) {
        retained.delete(uid);
        releaseUser(uid);
      }
    });
  }

  const unsubStore = useUserCacheStore.subscribe((state, previous) => {
    if (state.entries === previous.entries) return;
    for (const uid of retained) {
      if (state.entries[uid] !== previous.entries[uid]) {
        scheduleEmit();
        return;
      }
    }
  });

  const chatUnsub = onSnapshot(q, (snap) => {
    chatCache = snap.docs.map((d) => {
      const chat = d.data() as any;
      const chatId = chat.id || d.id;
      const isSaved = d.id === savedChatId;
      const otherUid = isSaved
        ? ""
        : chat?.participantIds?.find((id: string) => id !== myUid) || "";

      const unreadCount = isSaved ? 0 : chat.unreadCount?.[myUid] || 0;

      if (
        !isFirstSnapshot &&
        !isSaved &&
        onNewMessage &&
        !chat.deleted?.[myUid]
      ) {
        const prev = prevUnread.get(chatId) ?? 0;
        if (unreadCount > prev) {
          const participant = readUser(otherUid);
          onNewMessage({
            chatId,
            senderName: participant?.username || "New message",
            senderAvatar: participant?.avatar,
            text: callPreviewText(chat.lastMessage, myUid),
          });
        }
      }
      prevUnread.set(chatId, unreadCount);

      if (chat.lastMessageTime) {
        lastKnownTime.set(d.id, chat.lastMessageTime);
      }

      return {
        id: chatId,
        _otherUid: otherUid,
        isSaved,
        lastMessage: chat.lastMessage || "",
        lastMessageTime:
          chat.lastMessageTime || lastKnownTime.get(d.id) || null,
        unreadCount,
        typing: isSaved ? {} : activeFlags(chat.typing),
        deleted: isSaved ? false : chat.deleted?.[myUid] || false,
      };
    });

    syncRetained();

    if (waitingForUsers && !firstEmitTimer) {
      firstEmitTimer = setTimeout(() => {
        firstEmitTimer = null;
        waitingForUsers = false;
        emit();
      }, FIRST_EMIT_TIMEOUT_MS);
    }

    isFirstSnapshot = false;
    emit();
  });

  return () => {
    disposed = true;
    chatUnsub();
    unsubStore();
    if (firstEmitTimer) clearTimeout(firstEmitTimer);
    if (updateTimer) clearTimeout(updateTimer);
    retained.forEach((uid) => releaseUser(uid));
    retained.clear();
  };
}
export async function markMessageRead(
  chatId: string,
  messageId: string,
  uid: string
) {
  const ref = doc(db, "chats", chatId, "messages", messageId);
  try {
    await updateDoc(ref, { readBy: arrayUnion(uid) });
  } catch (err: any) {
    if (err?.code !== "not-found") console.warn("markMessageRead failed:", err);
  }
}
export async function toggleReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  uid: string,
  currentReactions?: Record<string, string[]>
): Promise<void> {
  const msgRef = doc(db, "chats", chatId, "messages", messageId);

  let reactions = currentReactions;
  if (reactions === undefined) {
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    reactions = (snap.data()?.reactions ?? {}) as Record<string, string[]>;
  }

  const reacted = (reactions[emoji] ?? []).includes(uid);

  const args: unknown[] = [];
  args.push(
    new FieldPath("reactions", emoji),
    reacted ? arrayRemove(uid) : arrayUnion(uid)
  );

  if (!reacted) {
    for (const [token, uids] of Object.entries(reactions)) {
      if (token !== emoji && uids.includes(uid)) {
        args.push(new FieldPath("reactions", token), arrayRemove(uid));
      }
    }
  }

  await updateDoc(msgRef, ...(args as [FieldPath, unknown, ...unknown[]]));

  if (!reacted) {
    try {
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: getCustomEmoji(emoji)
          ? "Reacted to a message"
          : `${emoji} Reacted to a message`,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Reaction preview update failed:", err);
    }
  }
}

export async function editMessage(
  chatId: string,
  messageId: string,
  newText: string
) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    text: newText,
    edited: true,
  });
}

export async function deleteMessage(chatId: string, messageId: string) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    deleted: true,
    text: "",
    imageUrl: null,
    voiceUrl: null,
  });

  try {
    await removePinnedMessage(chatId, messageId);
  } catch (err) {
    console.warn("Unpin on delete failed:", err);
  }

  const snap = await getDocs(
    query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(20)
    )
  );
  const last = snap.docs.map((d) => d.data()).find((m) => !m.deleted);

  let lastMessage = "";
  if (last) {
    if (last.type === "call" && last.callStatus && last.senderId) {
      lastMessage = encodeCallPreview({
        status: last.callStatus,
        callType: last.callType === "video" ? "video" : "audio",
        senderId: last.senderId,
      });
    } else if (last.voiceUrl) {
      lastMessage = "Voice message";
    } else if (last.imageUrl && !last.text) {
      lastMessage = "Photo";
    } else {
      lastMessage = last.text || "";
    }
  }

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage,
    ...(last?.createdAt ? { lastMessageTime: last.createdAt } : {}),
  });
}

export async function addPinnedMessage(
  chatId: string,
  messageId: string,
  text: string
) {
  const ref = doc(db, "chats", chatId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = readPins(snap.data());
    if (current.some((p) => p.id === messageId)) return;
    tx.update(ref, buildPinPatch([...current, { id: messageId, text }]));
  });
}

export async function removePinnedMessage(chatId: string, messageId: string) {
  const ref = doc(db, "chats", chatId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = readPins(snap.data());
    const next = current.filter((p) => p.id !== messageId);
    if (next.length === current.length) return;
    tx.update(ref, buildPinPatch(next));
  });
}

export async function pinMessage(
  chatId: string,
  messageId: string | null,
  messageText: string | null
) {
  if (messageId) {
    await addPinnedMessage(chatId, messageId, messageText || "");
    return;
  }
  await updateDoc(doc(db, "chats", chatId), buildPinPatch([]));
}

export async function togglePinChat(
  userId: string,
  chatId: string,
  pinned: boolean
) {
  await updateDoc(doc(db, "users", userId), {
    [`pinnedChats.${chatId}`]: pinned,
  });
}
export async function forwardMessageToChat(
  targetChatId: string,
  myUid: string,
  original: ForwardableContent
) {
  const [uid1, uid2] = targetChatId.split("_");
  const otherUid = uid1 === myUid ? uid2 : uid1;

  if (targetChatId === getSavedChatId(myUid)) await ensureSavedChat(myUid);

  await addDoc(collection(db, "chats", targetChatId, "messages"), {
    senderId: myUid,
    text: original.text || "",
    imageUrl: original.imageUrl || null,
    ...(original.imageUrl && original.imageWidth && original.imageHeight
      ? { imageWidth: original.imageWidth, imageHeight: original.imageHeight }
      : {}),
    voiceUrl: original.voiceUrl || null,
    duration: original.duration ?? null,
    waveform: original.waveform ?? null,
    createdAt: serverTimestamp(),
    replyTo: null,
    forwardedFrom: buildForwardedFrom(original),
  });

  const chatUpdate: Record<string, any> = {
    lastMessage:
      original.imageUrl && !original.text
        ? "📷 Photo"
        : original.voiceUrl && !original.text
        ? "Voice message"
        : original.text || "",
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (otherUid !== myUid) {
    chatUpdate[`unreadCount.${otherUid}`] = increment(1);
  }

  await updateDoc(doc(db, "chats", targetChatId), chatUpdate);
}

export async function sendVoiceMessage(
  chatId: string,
  senderId: string,
  replyTo: any | null,
  voiceUrl: string,
  duration: number,
  waveform: number[]
) {
  if (chatId === getSavedChatId(senderId)) await ensureSavedChat(senderId);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    text: "",
    voiceUrl,
    duration,
    waveform,
    replyTo: replyTo
      ? {
          id: replyTo.id,
          text: replyTo.text ?? "",
          senderId: replyTo.senderId ?? null,
          imageUrl: replyTo.imageUrl || null,
        }
      : null,
    createdAt: serverTimestamp(),
    readBy: [],
    reactions: {},
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: "Voice message",
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
