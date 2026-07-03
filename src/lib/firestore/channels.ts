import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
  documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Channel, ChannelPost } from "@/types/channel";

export async function createChannel(
  ownerId: string,
  ownerUsername: string,
  name: string,
  description: string,
  avatarUrl: string | null
) {
  const channelRef = doc(collection(db, "channels"));
  await setDoc(channelRef, {
    name,
    nameLower: name.toLowerCase(),
    description,
    avatarUrl,
    ownerId,
    ownerUsername,
    subscriberCount: 1,
    createdAt: serverTimestamp(),
    lastPostAt: serverTimestamp(),
    lastPostPreview: "",
  });
  await setDoc(doc(db, "channels", channelRef.id, "subscribers", ownerId), {
    uid: ownerId,
    subscribedAt: serverTimestamp(),
  });
  return channelRef.id;
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  const snap = await getDoc(doc(db, "channels", channelId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Channel) : null;
}

export function subscribeToChannelDoc(
  channelId: string,
  callback: (channel: Channel | null) => void
) {
  return onSnapshot(doc(db, "channels", channelId), (snap) => {
    callback(
      snap.exists() ? ({ id: snap.id, ...snap.data() } as Channel) : null
    );
  });
}

export async function searchChannels(term: string): Promise<Channel[]> {
  const lower = term.trim().toLowerCase();
  if (!lower) return [];
  const q = query(
    collection(db, "channels"),
    orderBy("nameLower"),
    startAt(lower),
    endAt(lower + "\uf8ff"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Channel[];
}

export async function checkIsSubscribed(channelId: string, uid: string) {
  const snap = await getDoc(doc(db, "channels", channelId, "subscribers", uid));
  return snap.exists();
}

export async function subscribeToChannel(channelId: string, uid: string) {
  const subRef = doc(db, "channels", channelId, "subscribers", uid);
  const channelRef = doc(db, "channels", channelId);
  await runTransaction(db, async (tx) => {
    const subSnap = await tx.get(subRef);
    if (subSnap.exists()) return;
    tx.set(subRef, { uid, subscribedAt: serverTimestamp() });
    tx.update(channelRef, { subscriberCount: increment(1) });
  });
}

export async function unsubscribeFromChannel(channelId: string, uid: string) {
  const channelSnap = await getDoc(doc(db, "channels", channelId));
  if (channelSnap.exists() && channelSnap.data().ownerId === uid)
    throw new Error("Owner cannot unsubscribe from own channel");
  const subRef = doc(db, "channels", channelId, "subscribers", uid);
  const channelRef = doc(db, "channels", channelId);
  await runTransaction(db, async (tx) => {
    const subSnap = await tx.get(subRef);
    if (!subSnap.exists()) return;
    tx.delete(subRef);
    tx.update(channelRef, { subscriberCount: increment(-1) });
  });
}

export function subscribeToMyChannels(
  uid: string,
  callback: (channels: Channel[]) => void
) {
  const subsQuery = query(
    collectionGroup(db, "subscribers"),
    where("uid", "==", uid)
  );
  const channelUnsubs = new Map<string, () => void>();
  const channelsMap = new Map<string, Channel>();
  const emit = () => callback(Array.from(channelsMap.values()));

  const unsubList = onSnapshot(subsQuery, (snap) => {
    const currentIds = new Set(snap.docs.map((d) => d.ref.parent.parent!.id));
    for (const [id, unsub] of channelUnsubs) {
      if (!currentIds.has(id)) {
        unsub();
        channelUnsubs.delete(id);
        channelsMap.delete(id);
      }
    }
    currentIds.forEach((id) => {
      if (channelUnsubs.has(id)) return;
      const unsub = onSnapshot(doc(db, "channels", id), (chSnap) => {
        if (chSnap.exists()) {
          channelsMap.set(id, { id: chSnap.id, ...chSnap.data() } as Channel);
          emit();
        }
      });
      channelUnsubs.set(id, unsub);
    });
    emit();
  });

  return () => {
    unsubList();
    channelUnsubs.forEach((unsub) => unsub());
  };
}

export function subscribeToChannelPosts(
  channelId: string,
  callback: (posts: ChannelPost[]) => void
) {
  const q = query(
    collection(db, "channels", channelId, "posts"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ChannelPost[]
    );
  });
}

export async function createChannelPost(
  channelId: string,
  authorId: string,
  text: string,
  imageUrl?: string
) {
  const postRef = doc(collection(db, "channels", channelId, "posts"));
  await setDoc(postRef, {
    authorId,
    text: text || "",
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
    reactions: {},
  });
  await updateDoc(doc(db, "channels", channelId), {
    lastPostAt: serverTimestamp(),
    lastPostPreview: text ? text.slice(0, 80) : "📷 Photo",
  });
}

export async function togglePostReaction(
  channelId: string,
  postId: string,
  token: string,
  uid: string
) {
  const postRef = doc(db, "channels", channelId, "posts", postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;
  const reactions = snap.data().reactions || {};
  const current: string[] = reactions[token] || [];
  const has = current.includes(uid);
  await updateDoc(postRef, {
    [`reactions.${token}`]: has ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function deleteChannelPost(channelId: string, postId: string) {
  await deleteDoc(doc(db, "channels", channelId, "posts", postId));
}

export async function deleteChannel(channelId: string) {
  await deleteDoc(doc(db, "channels", channelId));
}
