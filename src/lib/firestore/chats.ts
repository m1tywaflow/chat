import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}
export async function setTyping(
  chatId: string,
  uid: string,
  isTyping: boolean
) {
  const ref = doc(db, "chats", chatId);

  await updateDoc(ref, {
    [`typing.${uid}`]: isTyping,
  });
}

export async function createOrGetChat(myUid: string, otherUid: string) {
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
  imageUrl?: string
) {
  if (!chatId || !myUid || (!text.trim() && !imageUrl)) return;

  const [uid1, uid2] = chatId.split("_");
  const otherUid = uid1 === myUid ? uid2 : uid1;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId: myUid,
    text: text.trim(),
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
    replyTo: replyTo
      ? {
          id: replyTo.id,
          text: replyTo.text,
          senderId: replyTo.senderId,
          imageUrl: replyTo.imageUrl || null,
        }
      : null,
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: imageUrl && !text.trim() ? "📷 Photo" : text.trim(),
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadCount.${otherUid}`]: increment(1),
  });
}

export function subscribeToMessages(chatId: string, cb: (m: any[]) => void) {
  if (!chatId) return () => {};

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });
}

export function subscribeToUserChats(myUid: string, cb: (c: any[]) => void) {
  if (!myUid) return () => {};

  const q = query(
    collection(db, "chats"),
    where("participantIds", "array-contains", myUid),
    orderBy("updatedAt", "desc")
  );

  const userUnsubs = new Map<string, () => void>();
  const userCache = new Map<string, any>();
  let chatCache: any[] = [];

  function rebuild() {
    cb(
      chatCache
        .map((chat) => ({
          ...chat,
          participant: userCache.get(chat._otherUid) || chat.participant,
        }))
        .filter((c) => !c.deleted)
    );
  }

  const chatUnsub = onSnapshot(q, (snap) => {
    chatCache = snap.docs.map((d) => {
      const chat = d.data() as any;
      const otherUid =
        chat?.participantIds?.find((id: string) => id !== myUid) || "";

      if (otherUid && !userUnsubs.has(otherUid)) {
        const unsub = onSnapshot(doc(db, "users", otherUid), (userSnap) => {
          if (userSnap.exists()) {
            userCache.set(otherUid, { id: userSnap.id, ...userSnap.data() });
            rebuild();
          }
        });
        userUnsubs.set(otherUid, unsub);
      }

      return {
        id: chat.id,
        _otherUid: otherUid,
        participant: userCache.get(otherUid) || {
          id: otherUid,
          username: "Unknown user",
          avatar: "",
          online: false,
        },
        lastMessage: chat.lastMessage || "",
        lastMessageTime: chat.lastMessageTime || null,
        unreadCount: chat.unreadCount?.[myUid] || 0,
        deleted: chat.deleted?.[myUid] || false,
      };
    });

    rebuild();
  });

  return () => {
    chatUnsub();
    userUnsubs.forEach((unsub) => unsub());
  };
}
export async function markMessageRead(
  chatId: string,
  messageId: string,
  uid: string
) {
  const ref = doc(db, "chats", chatId, "messages", messageId);
  await updateDoc(ref, { readBy: arrayUnion(uid) });
}
export async function toggleReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  uid: string
): Promise<void> {
  const msgRef = doc(db, "chats", chatId, "messages", messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const current: string[] = data?.reactions?.[emoji] ?? [];
  const hasReacted = current.includes(uid);
  await updateDoc(msgRef, {
    [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
  });
  if (!hasReacted) {
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: `${emoji} Reacted to a message`,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
  });
}

export async function pinMessage(
  chatId: string,
  messageId: string | null,
  messageText: string | null
) {
  await updateDoc(doc(db, "chats", chatId), {
    pinnedMessage: messageId ? { id: messageId, text: messageText } : null,
  });
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
