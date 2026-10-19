import {
  collection,
  doc,
  getDocs,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildPollMessage } from "@/lib/polls";

export async function createChannelPoll(
  channelId: string,
  authorId: string,
  question: string,
  options: string[],
  multiple: boolean
): Promise<void> {
  const fields = buildPollMessage(question, options, multiple);
  const postRef = doc(collection(db, "channels", channelId, "posts"));
  const channelRef = doc(db, "channels", channelId);

  const channelUpdate: Record<string, any> = {
    lastPostAt: serverTimestamp(),
    lastPostId: postRef.id,
    lastPostPreview: `📊 ${fields.poll.question}`.slice(0, 80),
  };

  const subsSnap = await getDocs(
    collection(db, "channels", channelId, "subscribers")
  );
  subsSnap.docs.forEach((d) => {
    if (d.id === authorId) return;
    channelUpdate[`unreadCounts.${d.id}`] = increment(1);
  });

  const batch = writeBatch(db);

  batch.set(postRef, {
    authorId,
    text: fields.poll.question,
    imageUrl: null,
    createdAt: serverTimestamp(),
    reactions: {},
    commentCount: 0,
    views: 0,
    ...fields,
  });

  batch.update(channelRef, channelUpdate);

  await batch.commit();
}
