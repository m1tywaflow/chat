import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { User } from "@/types/user";

export async function findUserByUsername(
  username: string
): Promise<User | null> {
  const clean = username.trim().toLowerCase();

  if (!clean) return null;

  const q = query(collection(db, "users"), where("username", "==", clean));

  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docData = snap.docs[0];

  return {
    id: docData.id,
    ...docData.data(),
  } as User;
}

export async function getUserById(id: string): Promise<User | null> {
  if (!id) return null;

  const snap = await getDoc(doc(db, "users", id));

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  } as User;
}

export async function updateUser(uid: string, data: Partial<User>) {
  if (!uid) return;

  if (!data || Object.keys(data).length === 0) return;

  await updateDoc(doc(db, "users", uid), data);
}
