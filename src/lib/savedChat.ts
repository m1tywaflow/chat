import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const SAVED_CHAT_TITLE = "Saved messages";

const ensuredChats = new Set<string>();

export function getSavedChatId(uid: string) {
  return `${uid}_${uid}`;
}

export function isSavedChatId(
  chatId: string | null | undefined,
  uid: string | null | undefined
) {
  return !!chatId && !!uid && chatId === getSavedChatId(uid);
}

export function getSavedParticipant(uid: string) {
  return {
    id: uid,
    username: SAVED_CHAT_TITLE,
    avatar: "",
    online: false,
  };
}

export async function ensureSavedChat(uid: string) {
  if (!uid) return;
  const chatId = getSavedChatId(uid);
  if (ensuredChats.has(chatId)) return;
  ensuredChats.add(chatId);
  try {
    await setDoc(
      doc(db, "chats", chatId),
      {
        id: chatId,
        participantIds: [uid],
      },
      { merge: true }
    );
  } catch (err) {
    ensuredChats.delete(chatId);
    throw err;
  }
}