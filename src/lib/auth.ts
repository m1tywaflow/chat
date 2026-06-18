import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";

function usernameToEmail(username: string) {
  return `${username.toLowerCase().trim()}@chatik.local`;
}

export async function registerUser(username: string, password: string) {
  const cleanUsername = username.trim();

  const usernameQuery = query(
    collection(db, "users"),
    where("username", "==", cleanUsername)
  );
  const existing = await getDocs(usernameQuery);
  if (!existing.empty) {
    throw new Error("This username is already taken.");
  }

  const email = usernameToEmail(cleanUsername);
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    id: cred.user.uid,
    username: cleanUsername,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
    online: true,
  });

  return cred.user;
}

export async function loginUser(username: string, password: string) {
  const email = usernameToEmail(username.trim());
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  await firebaseSignOut(auth);
}
export { auth };

