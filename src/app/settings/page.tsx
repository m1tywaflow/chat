// "use client";

// import { useEffect, useState } from "react";
// import { auth } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { uploadAvatar } from "@/lib/uploadAvatar";
// import { updateUser } from "@/lib/firestore/users";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// export default function SettingsPage() {
//   const [uid, setUid] = useState<string | null>(null);
//   const [username, setUsername] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);

//   const router = useRouter();

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setUid(u?.uid || null);
//     });

//     return () => unsub();
//   }, []);

//   function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
//     const f = e.target.files?.[0];
//     if (!f) return;

//     setFile(f);
//     setPreview(URL.createObjectURL(f));
//   }

//   async function save() {
//     if (!uid) return;

//     try {
//       setSaving(true);

//       let avatarUrl = "";

//       if (file) {
//         avatarUrl = await uploadAvatar(file, uid);
//       }

//       const data: any = {};
//       const cleanUsername = username.trim().toLowerCase();

//       if (cleanUsername) data.username = cleanUsername;
//       if (avatarUrl) data.avatar = avatarUrl;

//       if (Object.keys(data).length === 0) return;

//       await updateUser(uid, data);

//       setSaved(true);

//       setTimeout(() => setSaved(false), 3000);
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function logout() {
//     await signOut(auth);
//     router.push("/login");
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070A0F] via-[#0B1220] to-[#070A0F] text-[#E5E7EB] p-6">
//       <div className="w-full max-w-md bg-[#0F1620]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
//         <div className="mb-6">
//           <h1 className="text-2xl font-semibold">Profile Settings</h1>
//           <p className="text-sm text-zinc-400 mt-1">
//             Update your username and avatar
//           </p>
//         </div>

//         <div className="flex items-center gap-4 mb-6">
//           <img
//             src={preview || "/default-avatar.png"}
//             className="w-20 h-20 rounded-full object-cover border-2 border-[#A78BFA]"
//           />

//           <label className="cursor-pointer">
//             <span className="inline-flex items-center px-4 py-2 rounded-xl bg-[#1B2633] hover:bg-[#243447] transition-colors">
//               Choose image
//             </span>

//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleFile}
//               className="hidden"
//             />
//           </label>
//         </div>

//         <div className="space-y-4">
//           <input
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             placeholder="Username"
//             className="w-full px-4 py-3 rounded-xl bg-[#1B2633] outline-none border border-transparent focus:border-[#A78BFA] transition-all"
//           />

//           <button
//             onClick={save}
//             disabled={saving}
//             className="w-full py-3 rounded-xl font-medium bg-[#A78BFA] text-black hover:bg-[#8B5CF6] transition-all disabled:opacity-50"
//           >
//             {saving ? "Saving..." : "Save Changes"}
//           </button>

//           {saved && (
//             <div className="text-center text-sm text-[#A78BFA]">
//               Profile updated
//             </div>
//           )}

//           <button
//             onClick={logout}
//             className="w-full py-3 rounded-xl font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
//           >
//             Log out
//           </button>

//           <Link
//             href="/"
//             className="flex items-center justify-center w-full py-3 rounded-xl font-medium bg-[#1B2633] hover:bg-[#243447] transition-colors"
//           >
//             Back
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { uploadAvatar } from "@/lib/uploadAvatar";
import { updateUser } from "@/lib/firestore/users";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUid(u.uid);

      // грузим данные из Firestore
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setCurrentAvatar(data.avatar || "");
      }
    });
    return () => unsub();
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!uid) return;
    try {
      setSaving(true);
      let avatarUrl = "";
      if (file) avatarUrl = await uploadAvatar(file, uid);
      const data: any = {};
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) data.username = cleanUsername;
      if (avatarUrl) data.avatar = avatarUrl;
      if (Object.keys(data).length === 0) return;
      await updateUser(uid, data);
      if (avatarUrl) setCurrentAvatar(avatarUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  const avatarSrc = preview || currentAvatar;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c12] text-white p-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold">Settings</h1>
          <p className="text-xs text-white/28 mt-1 tracking-widest">
            manage your account
          </p>
        </div>

        {/* Аватар */}
        <div className="flex items-center gap-5 p-5 bg-[#0f1520] border border-white/[0.07] rounded-2xl mb-6">
          <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-br from-[#A78BFA] to-[#60A5FA] flex-shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                className="w-full h-full rounded-full object-cover block bg-[#1b2633]"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#1b2633]" />
            )}
          </div>
          <div>
            <div className="text-[15px] font-medium mb-1">
              {username || "—"}
            </div>
            <div className="text-[11px] text-white/25 mb-3">
              click to change avatar
            </div>
            <label className="text-[11px] text-[#A78BFA] bg-[#A78BFA]/8 border border-[#A78BFA]/20 px-3.5 py-1.5 rounded-md cursor-pointer hover:bg-[#A78BFA]/15 transition-colors">
              choose image
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Поля */}
        <div className="mb-6">
          <div className="text-[11px] text-white/30 tracking-widest mb-2">
            USERNAME
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter new username"
            className="w-full px-4 py-3 bg-[#0f1520] border border-white/[0.08] focus:border-[#A78BFA]/40 rounded-xl text-sm text-white outline-none transition-colors"
          />
        </div>

        <div className="h-px bg-white/[0.06] mb-5" />

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-[#A78BFA] hover:bg-[#8B5CF6] text-black text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 mb-3"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {saved && (
          <p className="text-center text-xs text-[#A78BFA] mb-3 tracking-wider">
            Profile updated
          </p>
        )}

        <button
          onClick={logout}
          className="w-full py-3 text-red-400/50 hover:text-red-400/80 text-xs tracking-widest transition-colors"
        >
          log out
        </button>
        <button
          onClick={() => router.back()}
          className="w-full py-3 text-white/20 hover:text-white/50 text-xs tracking-widest transition-colors"
        >
          ← back
        </button>
      </div>
    </div>
  );
}
