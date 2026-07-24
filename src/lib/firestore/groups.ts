import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Group, GroupMessage } from "@/types/group";

const groupsCol = collection(db, "groups");

export async function createGroup(
  ownerId: string,
  ownerName: string,
  name: string,
  memberIds: string[],
  avatarUrl?: string | null
): Promise<string> {
  const members = Array.from(new Set([ownerId, ...memberIds]));

  const docRef = await addDoc(groupsCol, {
    name,
    avatarUrl: avatarUrl ?? null,
    ownerId,
    ownerName,
    admins: [ownerId],
    members,
    memberCount: members.length,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function addMembersToGroup(
  groupId: string,
  newMemberIds: string[]
): Promise<void> {
  const groupRef = doc(db, "groups", groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const current = snap.data() as Group;
  const merged = Array.from(new Set([...current.members, ...newMemberIds]));

  await updateDoc(groupRef, {
    members: merged,
    memberCount: merged.length,
  });
}

export function subscribeToUserGroups(
  uid: string,
  callback: (groups: Group[]) => void
): () => void {
  const q = query(groupsCol, where("members", "array-contains", uid));

  return onSnapshot(q, (snap) => {
    const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
    callback(groups);
  });
}

export function subscribeToGroupMessages(
  groupId: string,
  callback: (messages: GroupMessage[]) => void
): () => void {
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as GroupMessage)
    );
    callback(messages);
  });
}

export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  text: string,
  senderAvatarUrl?: string,
  replyTo?: { id: string; text: string; imageUrl?: string } | null,
  imageUrl?: string
): Promise<string> {
  const messagesCol = collection(db, "groups", groupId, "messages");

  const msgRef = await addDoc(messagesCol, {
    text,
    imageUrl: imageUrl ?? null,
    senderId,
    senderName,
    senderAvatarUrl: senderAvatarUrl ?? null,
    replyTo: replyTo ?? null,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    reactions: {},
  });

  await updateDoc(doc(db, "groups", groupId), {
    lastMessage: {
      text,
      senderId,
      senderName,
      createdAt: serverTimestamp(),
    },
  });

  return msgRef.id;
}

export async function markGroupMessageRead(
  groupId: string,
  messageId: string,
  uid: string
): Promise<void> {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  await updateDoc(msgRef, {
    readBy: arrayUnion(uid),
  });
}

export async function editGroupMessage(
  groupId: string,
  messageId: string,
  text: string
): Promise<void> {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  await updateDoc(msgRef, { text, edited: true });
}

export async function deleteGroupMessage(
  groupId: string,
  messageId: string
): Promise<void> {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  await updateDoc(msgRef, { deleted: true, text: "", imageUrl: null });
}

export async function toggleGroupReaction(
  groupId: string,
  messageId: string,
  token: string,
  uid: string
): Promise<void> {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;
  const data = snap.data() as GroupMessage;
  const reactions = (data as any).reactions || {};
  const current: string[] = reactions[token] || [];
  const hasReacted = current.includes(uid);
  await updateDoc(msgRef, {
    [`reactions.${token}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function pinGroupMessage(
  groupId: string,
  messageId: string | null,
  text: string | null
): Promise<void> {
  await updateDoc(doc(db, "groups", groupId), {
    pinnedMessage: messageId ? { id: messageId, text } : null,
  });
}

export async function togglePinGroup(
  uid: string,
  groupId: string,
  pinned: boolean
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    [`pinnedGroups.${groupId}`]: pinned,
  });
}

export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, "groups", groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;
  const data = snap.data() as Group;

  await updateDoc(groupRef, {
    members: arrayRemove(uid),
    admins: arrayRemove(uid),
    memberCount: Math.max(0, (data.memberCount || 1) - 1),
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, "groups", groupId));
}
