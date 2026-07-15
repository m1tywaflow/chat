import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function setConversationOrder(uid: string, orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const updates: Record<string, number> = {};
  orderedIds.forEach((id, idx) => {
    updates[`order.${id}`] = idx;
  });
  await updateDoc(doc(db, "users", uid), updates);
}
