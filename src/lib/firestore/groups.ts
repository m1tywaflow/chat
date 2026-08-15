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
  getDocs,
  increment,
  limit,
  runTransaction,
  writeBatch,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Group, GroupMessage } from "@/types/group";
import type { ForwardableContent } from "@/types/forward";
import { buildForwardedFrom } from "@/lib/forwarding";

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
    unreadCounts: {},
  });

  return docRef.id;
}

export async function addMembersToGroup(
  groupId: string,
  newMemberIds: string[]
): Promise<void> {
  const groupRef = doc(db, "groups", groupId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(groupRef);
    if (!snap.exists()) return;

    const current = snap.data() as Group;
    const merged = Array.from(new Set([...current.members, ...newMemberIds]));

    transaction.update(groupRef, {
      members: merged,
      memberCount: merged.length,
    });
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

function buildUnreadIncrement(
  members: string[],
  senderId: string
): Record<string, any> {
  const update: Record<string, any> = {};
  members
    .filter((uid) => uid !== senderId)
    .forEach((uid) => {
      update[`unreadCounts.${uid}`] = increment(1);
    });
  return update;
}

function buildStaleUnreadCleanup(
  unreadCounts: Record<string, number> | undefined,
  members: string[]
): Record<string, ReturnType<typeof deleteField>> {
  const update: Record<string, ReturnType<typeof deleteField>> = {};
  const memberIds = new Set(members);

  Object.keys(unreadCounts ?? {}).forEach((uid) => {
    if (!memberIds.has(uid)) {
      update[`unreadCounts.${uid}`] = deleteField();
    }
  });

  return update;
}

export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  text: string,
  _members: string[],
  senderAvatarUrl?: string,
  replyTo?: { id: string; text: string; imageUrl?: string } | null,
  imageUrl?: string
): Promise<string> {
  const groupRef = doc(db, "groups", groupId);
  const msgRef = doc(collection(db, "groups", groupId, "messages"));

  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found");

    const group = groupSnap.data() as Group & { deleting?: boolean };
    if (group.deleting || !group.members.includes(senderId)) {
      throw new Error("Sender is not an active group member");
    }

    transaction.set(msgRef, {
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

    transaction.update(groupRef, {
      lastMessage: {
        messageId: msgRef.id,
        text,
        imageUrl: imageUrl ?? null,
        type: imageUrl ? "image" : "text",
        senderId,
        senderName,
        createdAt: serverTimestamp(),
      },
      ...buildStaleUnreadCleanup(group.unreadCounts, group.members),
      ...buildUnreadIncrement(group.members, senderId),
    });
  });

  return msgRef.id;
}

export async function sendGroupVoiceMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  replyTo: any,
  audioUrl: string,
  duration: number,
  waveform: number[],
  _members: string[]
): Promise<void> {
  const groupRef = doc(db, "groups", groupId);
  const msgRef = doc(collection(db, "groups", groupId, "messages"));

  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found");

    const group = groupSnap.data() as Group & { deleting?: boolean };
    if (group.deleting || !group.members.includes(senderId)) {
      throw new Error("Sender is not an active group member");
    }

    transaction.set(msgRef, {
      senderId,
      senderName,
      text: "",
      voiceUrl: audioUrl,
      duration,
      waveform,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            text: replyTo.text || "",
            imageUrl: replyTo.imageUrl || null,
          }
        : null,
      createdAt: serverTimestamp(),
      readBy: [],
      reactions: {},
    });

    transaction.update(groupRef, {
      lastMessage: {
        messageId: msgRef.id,
        text: "",
        voiceUrl: audioUrl,
        type: "voice",
        senderId,
        senderName,
        createdAt: serverTimestamp(),
      },
      ...buildStaleUnreadCleanup(group.unreadCounts, group.members),
      ...buildUnreadIncrement(group.members, senderId),
    });
  });
}

export async function forwardMessageToGroup(
  groupId: string,
  myUid: string,
  original: ForwardableContent
): Promise<void> {
  const groupRef = doc(db, "groups", groupId);
  const msgRef = doc(collection(db, "groups", groupId, "messages"));

  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found");

    const group = groupSnap.data() as Group & { deleting?: boolean };
    if (group.deleting || !group.members.includes(myUid)) {
      throw new Error("Sender is not an active group member");
    }

    const isVoice = !!original.voiceUrl;
    transaction.set(msgRef, {
      senderId: myUid,
      senderName: original.senderName || "Unknown",
      text: original.text || "",
      imageUrl: original.imageUrl || null,
      voiceUrl: original.voiceUrl || null,
      duration: original.duration ?? null,
      waveform: original.waveform ?? null,
      replyTo: null,
      createdAt: serverTimestamp(),
      readBy: [myUid],
      reactions: {},
      forwardedFrom: buildForwardedFrom(original),
    });

    transaction.update(groupRef, {
      lastMessage: {
        messageId: msgRef.id,
        text: original.text || "",
        imageUrl: original.imageUrl || null,
        voiceUrl: original.voiceUrl || null,
        type: isVoice ? "voice" : original.imageUrl ? "image" : "text",
        senderId: myUid,
        senderName: original.senderName || "Unknown",
        createdAt: serverTimestamp(),
      },
      ...buildStaleUnreadCleanup(group.unreadCounts, group.members),
      ...buildUnreadIncrement(group.members, myUid),
    });
  });
}

export async function markGroupAsRead(
  groupId: string,
  uid: string
): Promise<void> {
  await updateDoc(doc(db, "groups", groupId), {
    [`unreadCounts.${uid}`]: 0,
  });
}

export async function markGroupMessageRead(
  groupId: string,
  messageId: string,
  uid: string
): Promise<void> {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  await updateDoc(msgRef, {
    readBy: arrayUnion(uid),
    lastReadBy: uid,
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
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as GroupMessage;
    const current = data.reactions?.[token] || [];
    const hasReacted = current.includes(uid);

    transaction.update(msgRef, {
      [`reactions.${token}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
      reactionChange: { token, uid, added: !hasReacted },
    });
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
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(groupRef);
    if (!snap.exists()) return;

    const data = snap.data() as Group;
    if (!data.members.includes(uid)) return;
    if (data.ownerId === uid) {
      throw new Error("The group owner must delete the group instead of leaving");
    }

    const members = data.members.filter((memberId) => memberId !== uid);
    transaction.update(groupRef, {
      members,
      admins: data.admins.filter((adminId) => adminId !== uid),
      memberCount: members.length,
      [`unreadCounts.${uid}`]: deleteField(),
      memberChange: { memberId: uid, action: "remove" },
    });
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  const groupRef = doc(db, "groups", groupId);

  // Mark first so rules can reject new messages while existing subcollection
  // documents are removed in batches. This avoids leaving late-arriving
  // messages orphaned when the parent document is deleted.
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(groupRef);
    if (!snap.exists()) return;
    transaction.update(groupRef, { deleting: true });
  });

  try {
    const messagesRef = collection(db, "groups", groupId, "messages");
    while (true) {
      // Keep each batch within the Firestore Rules document-access budget even
      // when rule reads are not cached across writes.
      const snap = await getDocs(query(messagesRef, limit(20)));
      if (snap.empty) break;

      const batch = writeBatch(db);
      snap.docs.forEach((message) => batch.delete(message.ref));
      await batch.commit();
    }

    await deleteDoc(groupRef);
  } catch (error) {
    // A failed client-side cascade must not leave the group permanently
    // read-only. The owner can retry deletion after this rollback.
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(groupRef);
      if (snap.exists()) transaction.update(groupRef, { deleting: false });
    });
    throw error;
  }
}

export async function getUserProfiles(
  uids: string[]
): Promise<Record<string, any>> {
  const unique = Array.from(new Set(uids));
  const results = await Promise.all(
    unique.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      return [
        uid,
        snap.exists()
          ? { id: uid, ...snap.data() }
          : { id: uid, username: "Unknown" },
      ] as const;
    })
  );
  return Object.fromEntries(results);
}

export async function setGroupAdmin(
  groupId: string,
  uid: string,
  isAdmin: boolean
): Promise<void> {
  await updateDoc(doc(db, "groups", groupId), {
    admins: isAdmin ? arrayUnion(uid) : arrayRemove(uid),
  });
}
export async function updateGroupInfo(
  groupId: string,
  data: { name?: string; avatarUrl?: string }
): Promise<void> {
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;

  if (Object.keys(payload).length === 0) return;

  await updateDoc(doc(db, "groups", groupId), payload);
}

export const kickMember = leaveGroup;

export async function searchUsersByUsername(
  term: string,
  excludeUids: string[]
): Promise<any[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];
  const usersCol = collection(db, "users");
  const q = query(
    usersCol,
    orderBy("username"),
    where("username", ">=", trimmed),
    where("username", "<=", trimmed + "\uf8ff")
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u: any) => !excludeUids.includes(u.id));
}
