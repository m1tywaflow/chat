// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut as firebaseSignOut,
// } from "firebase/auth";
// import {
//   doc,
//   setDoc,
//   collection,
//   query,
//   where,
//   getDocs,
//   serverTimestamp,
// } from "firebase/firestore";
// import { auth, db } from "./firebase";

// function usernameToEmail(username: string) {
//   return `${username.toLowerCase().trim()}@chatik.local`;
// }

// export async function registerUser(username: string, password: string) {
//   const cleanUsername = username.trim();

//   const usernameQuery = query(
//     collection(db, "users"),
//     where("username", "==", cleanUsername)
//   );
//   const existing = await getDocs(usernameQuery);
//   if (!existing.empty) {
//     throw new Error("This username is already taken.");
//   }

//   const email = usernameToEmail(cleanUsername);
//   const cred = await createUserWithEmailAndPassword(auth, email, password);

//   await setDoc(
//     doc(db, "users", cred.user.uid),
//     {
//       id: cred.user.uid,
//       username: cleanUsername,
//       avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
//       online: true,
//       lastSeen: serverTimestamp(),
//     },
//     { merge: true }
//   );

//   return cred.user;
// }

// export async function loginUser(username: string, password: string) {
//   const email = usernameToEmail(username.trim());
//   const cred = await signInWithEmailAndPassword(auth, email, password);

//   await setDoc(
//     doc(db, "users", cred.user.uid),
//     {
//       online: true,
//       lastSeen: serverTimestamp(),
//     },
//     { merge: true }
//   );

//   return cred.user;
// }

// export async function logoutUser() {
//   const uid = auth.currentUser?.uid;
//   if (uid) {
//     await setDoc(
//       doc(db, "users", uid),
//       {
//         online: false,
//         lastSeen: serverTimestamp(),
//       },
//       { merge: true }
//     );
//   }
//   await firebaseSignOut(auth);
// }

// export { auth };

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/i;

function usernameToEmail(username: string) {
  return `${username.toLowerCase().trim()}@chatik.local`;
}

export async function registerUser(username: string, password: string) {
  const cleanUsername = username.trim();

  if (!USERNAME_PATTERN.test(cleanUsername)) {
    throw new Error(
      "Username must be 3-20 characters: Latin letters, numbers and underscores only."
    );
  }

  const cred = await createUserWithEmailAndPassword(
    auth,
    usernameToEmail(cleanUsername),
    password
  );

  try {
    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        id: cred.user.uid,
        username: cleanUsername,
        usernameLower: cleanUsername.toLowerCase(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          cleanUsername
        )}`,
        online: true,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    await cred.user.delete().catch(() => {});
    throw err;
  }

  return cred.user;
}

export async function loginUser(username: string, password: string) {
  const email = usernameToEmail(username.trim());
  const cred = await signInWithEmailAndPassword(auth, email, password);

  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      online: true,
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );

  return cred.user;
}

export async function logoutUser() {
  const uid = auth.currentUser?.uid;
  if (uid) {
    await setDoc(
      doc(db, "users", uid),
      {
        online: false,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  }
  await firebaseSignOut(auth);
}

export { auth };
