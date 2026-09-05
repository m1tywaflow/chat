import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CallType = "audio" | "video";
export type CallStatus =
  | "ringing"
  | "accepted"
  | "declined"
  | "ended"
  | "missed";

export interface CallDoc {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  calleeId: string;
  calleeName: string;
  calleeAvatar?: string | null;
  chatId: string;
  roomName: string;
  type: CallType;
  status: CallStatus;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

export async function createCall(params: {
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  calleeId: string;
  calleeName: string;
  calleeAvatar?: string | null;
  chatId: string;
  type: CallType;
}): Promise<{ callId: string; roomName: string }> {
  const callId = doc(collection(db, "calls")).id;
  const roomName = `call_${params.chatId}_${Date.now()}`;

  await setDoc(doc(db, "calls", callId), {
    id: callId,
    callerId: params.callerId,
    callerName: params.callerName,
    callerAvatar: params.callerAvatar ?? null,
    calleeId: params.calleeId,
    calleeName: params.calleeName,
    calleeAvatar: params.calleeAvatar ?? null,
    chatId: params.chatId,
    roomName,
    type: params.type,
    status: "ringing",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { callId, roomName };
}

export async function acceptCall(callId: string) {
  await updateDoc(doc(db, "calls", callId), {
    status: "accepted",
    updatedAt: serverTimestamp(),
  });
}

export async function declineCall(callId: string) {
  await updateDoc(doc(db, "calls", callId), {
    status: "declined",
    updatedAt: serverTimestamp(),
  });
}

export async function endCall(callId: string) {
  await updateDoc(doc(db, "calls", callId), {
    status: "ended",
    updatedAt: serverTimestamp(),
  });
}

// Listen for incoming calls addressed to current user
export function subscribeToIncomingCalls(
  userId: string,
  callback: (call: CallDoc | null) => void
) {
  const q = query(
    collection(db, "calls"),
    where("calleeId", "==", userId),
    where("status", "==", "ringing")
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    const docSnap = snapshot.docs[0];
    callback(docSnap.data() as CallDoc);
  });
}

export function subscribeToCall(
  callId: string,
  callback: (call: CallDoc | null) => void
) {
  return onSnapshot(doc(db, "calls", callId), (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    callback(docSnap.data() as CallDoc);
  });
}

export async function fetchLiveKitToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  const res = await fetch("/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName, userId, userName }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch LiveKit token");
  }

  const data = await res.json();
  return data.token;
}
