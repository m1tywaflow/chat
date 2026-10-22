import {
  collection,
  deleteField,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildPollMessage } from "@/lib/polls";

export interface CreateGroupPollInput {
  question: string;
  options: string[];
  multiple: boolean;
  correctIndex?: number | null;
  senderName: string;
}

export async function createGroupPoll(
  groupId: string,
  senderId: string,
  input: CreateGroupPollInput
): Promise<string> {
  const groupRef = doc(db, "groups", groupId);
  const msgRef = doc(collection(db, "groups", groupId, "messages"));
  const built = buildPollMessage(
    input.question,
    input.options,
    input.multiple,
    input.correctIndex ?? null
  );
  const previewText = `📊 ${built.poll.question}`;

  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found");

    const group = groupSnap.data() as any;
    if (group.deleting || !group.members.includes(senderId)) {
      throw new Error("Sender is not an active group member");
    }

    transaction.set(msgRef, {
      ...built,
      text: previewText,
      imageUrl: null,
      senderId,
      senderName: input.senderName,
      replyTo: null,
      createdAt: serverTimestamp(),
      readBy: [senderId],
      reactions: {},
    });

    const unreadUpdate: Record<string, any> = {};
    (group.members as string[])
      .filter((uid) => uid !== senderId)
      .forEach((uid) => {
        unreadUpdate[`unreadCounts.${uid}`] = increment(1);
      });

    const memberIds = new Set<string>(group.members);
    Object.keys(group.unreadCounts ?? {}).forEach((uid) => {
      if (!memberIds.has(uid))
        unreadUpdate[`unreadCounts.${uid}`] = deleteField();
    });

    transaction.update(groupRef, {
      lastMessage: {
        messageId: msgRef.id,
        text: previewText,
        imageUrl: null,
        type: "poll",
        senderId,
        senderName: input.senderName,
        createdAt: serverTimestamp(),
      },
      ...unreadUpdate,
    });
  });

  return msgRef.id;
}