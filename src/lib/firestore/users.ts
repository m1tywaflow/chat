import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { User } from "@/types/user";

const SEARCH_LIMIT = 20;

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

  await setDoc(doc(db, "users", uid), data, { merge: true });
}

async function prefixQuery(field: string, term: string) {
  const q = query(
    collection(db, "users"),
    where(field, ">=", term),
    where(field, "<=", `${term}\uf8ff`),
    limit(SEARCH_LIMIT)
  );

  const snap = await getDocs(q);

  return snap.docs;
}

export async function searchUsers(search: string): Promise<User[]> {
  const raw = search?.trim();

  if (!raw) return [];

  const lower = raw.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);

  const tasks = [
    prefixQuery("usernameLower", lower),
    ...Array.from(new Set([raw, lower, capitalized])).map((term) =>
      prefixQuery("username", term)
    ),
  ];

  const results = await Promise.allSettled(tasks);
  const found = new Map<string, User>();

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("User search query failed:", result.reason);
      continue;
    }

    for (const d of result.value) {
      if (!found.has(d.id)) {
        found.set(d.id, { id: d.id, ...d.data() } as User);
      }
    }
  }

  return [...found.values()].slice(0, SEARCH_LIMIT);
}

export async function ensureUsernameLower(
  uid: string,
  username?: string | null,
  current?: string | null
) {
  if (!uid || !username) return;

  const next = username.toLowerCase();

  if (current === next) return;

  await setDoc(doc(db, "users", uid), { usernameLower: next }, { merge: true });
}
