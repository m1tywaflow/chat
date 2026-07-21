// "use client";

// import { useEffect, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";
// import { uploadAvatar } from "@/lib/uploadAvatar";
// import { updateUser } from "@/lib/firestore/users";
// import { useRouter } from "next/navigation";
// import { ArrowLeft } from "lucide-react";
// import ThemePicker from "@/components/molecules/theme-picker/ThemePicker";
// import Link from "next/link";
// import { Download } from "lucide-react";

// export default function SettingsPage() {
//   const [uid, setUid] = useState<string | null>(null);
//   const [username, setUsername] = useState("");
//   const [bio, setBio] = useState("");
//   const [currentAvatar, setCurrentAvatar] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (u) => {
//       if (!u) return;
//       setUid(u.uid);
//       const snap = await getDoc(doc(db, "users", u.uid));
//       if (snap.exists()) {
//         const data = snap.data();
//         setUsername(data.username || "");
//         setCurrentAvatar(data.avatar || "");
//         setBio(data.bio || "");
//       }
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
//       if (file) avatarUrl = await uploadAvatar(file, uid);
//       const data: any = {};
//       const cleanUsername = username.trim().toLowerCase();
//       if (cleanUsername) data.username = cleanUsername;
//       if (avatarUrl) data.avatar = avatarUrl;
//       if (bio.trim() !== undefined) data.bio = bio.trim();
//       if (Object.keys(data).length === 0) return;
//       await updateUser(uid, data);
//       if (avatarUrl) setCurrentAvatar(avatarUrl);
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

//   const avatarSrc = preview || currentAvatar;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#080c12] text-white p-6">
//       <div className="w-full max-w-[420px]">
//         <div className="mb-8 text-center">
//           <h1 className="text-[22px] font-semibold">Settings</h1>
//           <p className="text-xs text-white/28 mt-1 tracking-widest">
//             manage your account
//           </p>
//         </div>

//         <div className="flex items-center gap-5 p-5 bg-[#0f1520] border border-white/[0.07] rounded-2xl mb-6">
//           <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-br from-[#A78BFA] to-[#60A5FA] flex-shrink-0">
//             {avatarSrc ? (
//               <img
//                 src={avatarSrc}
//                 className="w-full h-full rounded-full object-cover block bg-[#1b2633]"
//               />
//             ) : (
//               <div className="w-full h-full rounded-full bg-[#1b2633]" />
//             )}
//           </div>
//           <div>
//             <div className="text-[15px] font-medium mb-1">
//               {username || "—"}
//             </div>
//             <div className="text-[11px] text-white/25 mb-3">
//               click to change avatar
//             </div>
//             <label className="text-[11px] text-[#A78BFA] bg-[#A78BFA]/8 border border-[#A78BFA]/20 px-3.5 py-1.5 rounded-md cursor-pointer hover:bg-[#A78BFA]/15 transition-colors">
//               choose image
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFile}
//                 className="hidden"
//               />
//             </label>
//           </div>
//         </div>

//         <div className="mb-4">
//           <div className="text-[11px] text-white/30 tracking-widest mb-2">
//             USERNAME
//           </div>
//           <input
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             placeholder="Enter new username"
//             className="w-full px-4 py-3 bg-[#0f1520] border border-white/[0.08] focus:border-[#A78BFA]/40 text-sm text-white outline-none transition-colors"
//           />
//         </div>

//         <div className="mb-6">
//           <div className="text-[11px] text-white/30 tracking-widest mb-2">
//             BIO
//           </div>
//           <textarea
//             value={bio}
//             onChange={(e) => setBio(e.target.value)}
//             placeholder="Tell something about yourself…"
//             maxLength={160}
//             rows={3}
//             className="w-full px-4 py-3 bg-[#0f1520] border border-white/[0.08] focus:border-[#A78BFA]/40 text-sm text-white outline-none transition-colors resize-none"
//           />
//           <div className="text-right text-[10px] text-white/20 mt-1">
//             {bio.length}/160
//           </div>
//         </div>

//         <div className="h-px bg-white/[0.06] mb-5" />

//         <div className="mb-5">
//           <ThemePicker />
//         </div>

//         <div className="h-px bg-white/[0.06] mb-5" />

//         <Link
//           href="/download"
//           className="w-full flex items-center justify-center gap-2 py-3 mb-3 text-[13px] text-white/40 hover:text-[#A78BFA] border border-white/[0.08] hover:border-[#A78BFA]/30 rounded-md transition-colors"
//         >
//           <Download size={15} />
//           Download desktop app
//         </Link>

//         <button
//           onClick={save}
//           disabled={saving}
//           className="w-full py-3 cursor-pointer bg-[#522fb7] hover:bg-[#8B5CF6] text-black text-sm font-semibold transition-colors disabled:opacity-50 mb-3"
//         >
//           {saving ? "Saving..." : "Save changes"}
//         </button>

//         {saved && (
//           <p className="text-center text-xs text-[#A78BFA] mb-3 tracking-wider">
//             Profile updated
//           </p>
//         )}

//         <button
//           onClick={logout}
//           className="w-full py-3 cursor-pointer text-red-400/50 hover:text-red-400/80 text-xs tracking-widest transition-colors"
//         >
//           log out
//         </button>
//         <button
//           onClick={() => router.back()}
//           className="w-full flex justify-center gap-2 items-center py-3 cursor-pointer text-white/20 hover:text-white/50 text-sm tracking-widest transition-colors"
//         >
//           <ArrowLeft size={20} /> back
//         </button>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { updateUser } from "@/lib/firestore/users";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, LogOut, Sparkles } from "lucide-react";
import ThemePicker from "@/components/molecules/theme-picker/ThemePicker";
import Link from "next/link";

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUid(u.uid);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
      }
    });
    return () => unsub();
  }, []);

  async function save() {
    if (!uid) return;
    try {
      setSaving(true);
      const data: any = {};
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) data.username = cleanUsername;
      if (bio.trim() !== undefined) data.bio = bio.trim();
      if (Object.keys(data).length === 0) return;
      await updateUser(uid, data);
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

  const initial = username ? username[0].toUpperCase() : "?";

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#07060d] text-white p-6">
      {/* ambient glow field */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[#5b3df0]/25 blur-[120px]" />
        <div className="absolute -bottom-48 -right-24 w-[480px] h-[480px] rounded-full bg-[#2b1f78]/30 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative w-full max-w-[440px]">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[13px] text-white/35 hover:text-white/70 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> back
        </button>

        <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(91,61,240,0.35)] overflow-hidden">
          {/* header */}
          <div className="relative px-8 pt-9 pb-7 border-b border-white/[0.06]">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78] blur-[2px]" />
                {avatar ? (
                  <img
                    src={avatar}
                    alt={username}
                    className="relative w-full h-full rounded-2xl object-cover bg-[#1b1633]"
                  />
                ) : (
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#4028b0] flex items-center justify-center text-2xl font-semibold tracking-tight">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#a893ff]/70 mb-1">
                  <Sparkles size={12} />
                  account
                </div>
                <div className="text-lg font-semibold truncate">
                  {username || "unnamed"}
                </div>
              </div>
            </div>
          </div>

          {/* fields */}
          <div className="px-8 pt-7 pb-2 space-y-6">
            <Field label="username">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your handle"
                className="w-full bg-transparent text-[15px] text-white placeholder-white/20 outline-none"
              />
            </Field>

            <Field label="bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="tell something about yourself…"
                maxLength={160}
                rows={3}
                className="w-full bg-transparent text-[14px] text-white placeholder-white/20 outline-none resize-none leading-relaxed"
              />
              <div className="text-right text-[10px] text-white/20 mt-1">
                {bio.length}/160
              </div>
            </Field>
          </div>

          {/* theme */}
          <div className="px-8 py-6 border-t border-white/[0.06]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3">
              appearance
            </div>
            <ThemePicker />
          </div>

          {/* actions */}
          <div className="px-8 pb-8 pt-2 space-y-3">
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3.5 rounded-xl cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] text-white text-sm font-semibold transition-all disabled:opacity-40 shadow-[0_8px_24px_-8px_rgba(124,92,255,0.6)]"
            >
              {saving ? "saving…" : "save changes"}
            </button>

            {saved && (
              <p className="text-center text-xs text-[#a893ff] tracking-wide">
                profile updated
              </p>
            )}

            <Link
              href="/download"
              className="w-full flex items-center justify-center gap-2 py-3 text-[13px] text-white/45 hover:text-[#a893ff] border border-white/[0.07] hover:border-[#7c5cff]/30 rounded-xl transition-colors"
            >
              <Download size={15} />
              download desktop app
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 cursor-pointer text-red-400/40 hover:text-red-400/75 text-[12px] tracking-widest transition-colors"
            >
              <LogOut size={13} />
              log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] px-4 py-3 focus-within:border-[#7c5cff]/40 transition-colors">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
