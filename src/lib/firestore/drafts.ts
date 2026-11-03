import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const MAX_DRAFT_LENGTH = 4000;

export interface DraftChange {
  chatId: string;
  text: string;
  removed: boolean;
}

function draftRef(uid: string, chatId: string) {
  return doc(db, "users", uid, "drafts", chatId);
}

export async function saveDraft(uid: string, chatId: string, text: string) {
  await setDoc(draftRef(uid, chatId), {
    text: text.slice(0, MAX_DRAFT_LENGTH),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDraft(uid: string, chatId: string) {
  await deleteDoc(draftRef(uid, chatId));
}

export function subscribeToDrafts(
  uid: string,
  onChanges: (changes: DraftChange[], snapshotIds: string[] | null) => void
) {
  if (!uid) return () => {};

  let initial = true;

  return onSnapshot(
    collection(db, "users", uid, "drafts"),
    (snap) => {
      const changes: DraftChange[] = [];
      snap.docChanges().forEach((change) => {
        if (change.doc.metadata.hasPendingWrites) return;
        changes.push({
          chatId: change.doc.id,
          text: (change.doc.data().text as string) || "",
          removed: change.type === "removed",
        });
      });
      const snapshotIds = initial ? snap.docs.map((d) => d.id) : null;
      initial = false;
      onChanges(changes, snapshotIds);
    },
    (err) => {
      console.warn("Drafts subscription failed:", err);
    }
  );
}
