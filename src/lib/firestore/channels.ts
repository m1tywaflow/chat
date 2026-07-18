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
import {
  Channel,
  ChannelPost,
  ChannelSubscriber,
  ChannelComment,
} from "@/types/channel";

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

export async function getChannelSubscribers(
  channelId: string
): Promise<ChannelSubscriber[]> {
  const subsSnap = await getDocs(
    query(
      collection(db, "channels", channelId, "subscribers"),
      orderBy("subscribedAt", "desc")
    )
  );
  const uids = subsSnap.docs.map((d) => d.id);
  if (uids.length === 0) return [];

  const userDocs = await Promise.all(
    uids.map((uid) => getDoc(doc(db, "users", uid)))
  );
  const usersMap = new Map<string, any>();
  userDocs.forEach((snap) => {
    if (snap.exists()) usersMap.set(snap.id, snap.data());
  });

  return subsSnap.docs.map((d) => {
    const data = d.data();
    const user = usersMap.get(d.id);
    return {
      uid: d.id,
      subscribedAt: data.subscribedAt,
      username: user?.username || "Unknown",
      avatarUrl: user?.avatar || null,
    };
  });
}

export async function getChannelByOwner(uid: string): Promise<Channel | null> {
  const q = query(
    collection(db, "channels"),
    where("ownerId", "==", uid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Channel;
}

export async function removeSubscriber(channelId: string, uid: string) {
  const channelSnap = await getDoc(doc(db, "channels", channelId));
  if (channelSnap.exists() && channelSnap.data().ownerId === uid)
    throw new Error("Cannot remove the channel owner");
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

export function subscribeToChannelPost(
  channelId: string,
  postId: string,
  callback: (post: ChannelPost | null) => void
) {
  return onSnapshot(doc(db, "channels", channelId, "posts", postId), (snap) => {
    callback(
      snap.exists() ? ({ id: snap.id, ...snap.data() } as ChannelPost) : null
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
    commentCount: 0,
    views: 0,
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

/**
 * Registers a view for a post, Telegram-style: counted once per user,
 * ever — never decrements, never double-counts even if the same person
 * scrolls past it a hundred times. Guarded by a per-user "viewers" doc
 * inside a transaction so concurrent calls can't race past the check.
 *
 * A subcollection (rather than an array field on the post) is used
 * deliberately: posts in a big channel can accumulate far more viewers
 * than comfortably fit in a single 1MB document, and subcollection
 * writes don't require reading/rewriting the whole viewer list.
 */
export async function markPostViewed(
  channelId: string,
  postId: string,
  uid: string
) {
  const viewerRef = doc(
    db,
    "channels",
    channelId,
    "posts",
    postId,
    "viewers",
    uid
  );
  const postRef = doc(db, "channels", channelId, "posts", postId);
  await runTransaction(db, async (tx) => {
    const viewerSnap = await tx.get(viewerRef);
    if (viewerSnap.exists()) return;
    tx.set(viewerRef, { uid, viewedAt: serverTimestamp() });
    tx.update(postRef, { views: increment(1) });
  });
}

export async function deleteChannelPost(channelId: string, postId: string) {
  await deleteDoc(doc(db, "channels", channelId, "posts", postId));
}

export async function deleteChannel(channelId: string) {
  await deleteDoc(doc(db, "channels", channelId));
}

export function subscribeToPostComments(
  channelId: string,
  postId: string,
  callback: (comments: ChannelComment[]) => void
) {
  const q = query(
    collection(db, "channels", channelId, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ChannelComment[]
    );
  });
}

export async function createComment(
  channelId: string,
  postId: string,
  authorId: string,
  text: string
) {
  const isSub = await checkIsSubscribed(channelId, authorId);
  if (!isSub) throw new Error("Only subscribers can comment");
  const commentRef = doc(
    collection(db, "channels", channelId, "posts", postId, "comments")
  );
  const postRef = doc(db, "channels", channelId, "posts", postId);
  await runTransaction(db, async (tx) => {
    tx.set(commentRef, { authorId, text, createdAt: serverTimestamp() });
    tx.update(postRef, { commentCount: increment(1) });
  });
}

export async function deleteComment(
  channelId: string,
  postId: string,
  commentId: string
) {
  const commentRef = doc(
    db,
    "channels",
    channelId,
    "posts",
    postId,
    "comments",
    commentId
  );
  const postRef = doc(db, "channels", channelId, "posts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(commentRef);
    if (!snap.exists()) return;
    tx.delete(commentRef);
    tx.update(postRef, { commentCount: increment(-1) });
  });
}

export async function getUsersByIds(
  uids: string[]
): Promise<Record<string, { username: string; avatarUrl: string | null }>> {
  const uniqueIds = Array.from(new Set(uids));
  const docs = await Promise.all(
    uniqueIds.map((uid) => getDoc(doc(db, "users", uid)))
  );
  const map: Record<string, { username: string; avatarUrl: string | null }> =
    {};
  docs.forEach((snap) => {
    if (snap.exists()) {
      const data = snap.data();
      map[snap.id] = {
        username: data.username || "Unknown",
        avatarUrl: data.avatar || null,
      };
    }
  });
  return map;
}
export async function updateChannelPostText(
  channelId: string,
  postId: string,
  newText: string
) {
  await updateDoc(doc(db, "channels", channelId, "posts", postId), {
    text: newText,
    edited: true,
  });
}

export async function pinChannelPost(channelId: string, postId: string) {
  await updateDoc(doc(db, "channels", channelId), {
    pinnedPostId: postId,
  });
}

export async function unpinChannelPost(channelId: string) {
  await updateDoc(doc(db, "channels", channelId), {
    pinnedPostId: null,
  });
}
export async function togglePinChannel(
  uid: string,
  channelId: string,
  pinned: boolean
) {
  await updateDoc(doc(db, "users", uid), {
    [`pinnedChannels.${channelId}`]: pinned,
  });
}
export async function forwardMessageToChannel(
  channelId: string,
  myUid: string,
  original: {
    text: string;
    imageUrl?: string | null;
    senderId: string;
    senderName?: string;
    chatId: string;
  }
) {
  const postRef = doc(collection(db, "channels", channelId, "posts"));
  await setDoc(postRef, {
    authorId: myUid,
    text: original.text || "",
    imageUrl: original.imageUrl || null,
    createdAt: serverTimestamp(),
    reactions: {},
    commentCount: 0,
    views: 0,
    forwardedFrom: {
      chatId: original.chatId,
      senderId: original.senderId,
      senderName: original.senderName || null,
    },
  });
  await updateDoc(doc(db, "channels", channelId), {
    lastPostAt: serverTimestamp(),
    lastPostPreview: original.text ? original.text.slice(0, 80) : "📷 Photo",
  });
}
