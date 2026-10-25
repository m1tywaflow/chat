import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CallLogStatus = "completed" | "cancelled" | "declined";
export type CallLogType = "audio" | "video";

const CALL_PREVIEW_PREFIX = "__call__";

export interface CallLogParams {
  callerId: string;
  callType: CallLogType;
  status: CallLogStatus;
  duration: number;
}

export interface CallPreviewInfo {
  status: CallLogStatus;
  callType: CallLogType;
  senderId: string;
}

export function encodeCallPreview(info: CallPreviewInfo): string {
  return `${CALL_PREVIEW_PREFIX}|${info.status}|${info.callType}|${info.senderId}`;
}

export function parseCallPreview(text?: string | null): CallPreviewInfo | null {
  if (!text || !text.startsWith(`${CALL_PREVIEW_PREFIX}|`)) return null;
  const [, status, callType, senderId] = text.split("|");
  if (!status || !callType || !senderId) return null;
  return {
    status: status as CallLogStatus,
    callType: callType === "video" ? "video" : "audio",
    senderId,
  };
}

export function getCallTitle(
  status: CallLogStatus,
  callType: CallLogType,
  isMine: boolean
): string {
  const noun = callType === "video" ? "video call" : "call";
  if (status === "completed")
    return `${isMine ? "Outgoing" : "Incoming"} ${noun}`;
  if (status === "declined") return `Declined ${noun}`;
  return isMine ? `Cancelled ${noun}` : `Missed ${noun}`;
}

export function callPreviewText(
  text: string | null | undefined,
  myUid?: string | null
): string {
  const info = parseCallPreview(text);
  if (!info) return text || "";
  return getCallTitle(info.status, info.callType, info.senderId === myUid);
}

export async function sendCallLogMessage(
  chatId: string,
  params: CallLogParams
) {
  const [uid1, uid2] = chatId.split("_");
  const calleeId = uid1 === params.callerId ? uid2 : uid1;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId: params.callerId,
    type: "call",
    callType: params.callType,
    callStatus: params.status,
    duration: params.duration,
    text: "",
    createdAt: serverTimestamp(),
    readBy: [params.callerId],
    reactions: {},
  });

  const chatUpdate: Record<string, any> = {
    lastMessage: encodeCallPreview({
      status: params.status,
      callType: params.callType,
      senderId: params.callerId,
    }),
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (params.status === "cancelled" && calleeId) {
    chatUpdate[`unreadCount.${calleeId}`] = increment(1);
  }

  await updateDoc(doc(db, "chats", chatId), chatUpdate);
}
