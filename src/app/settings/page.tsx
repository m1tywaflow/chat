"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { uploadAvatar } from "@/lib/uploadAvatar";
import { updateUser } from "@/lib/firestore/users";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
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
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setCurrentAvatar(data.avatar || "");
        setBio(data.bio || "");
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
      if (bio.trim() !== undefined) data.bio = bio.trim();
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
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-semibold">Settings</h1>
          <p className="text-xs text-white/28 mt-1 tracking-widest">
            manage your account
          </p>
        </div>

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

        <div className="mb-4">
          <div className="text-[11px] text-white/30 tracking-widest mb-2">
            USERNAME
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter new username"
            className="w-full px-4 py-3 bg-[#0f1520] border border-white/[0.08] focus:border-[#A78BFA]/40 text-sm text-white outline-none transition-colors"
          />
        </div>

        <div className="mb-6">
          <div className="text-[11px] text-white/30 tracking-widest mb-2">
            BIO
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell something about yourself…"
            maxLength={160}
            rows={3}
            className="w-full px-4 py-3 bg-[#0f1520] border border-white/[0.08] focus:border-[#A78BFA]/40 text-sm text-white outline-none transition-colors resize-none"
          />
          <div className="text-right text-[10px] text-white/20 mt-1">
            {bio.length}/160
          </div>
        </div>

        <div className="h-px bg-white/[0.06] mb-5" />

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 cursor-pointer bg-[#A78BFA] hover:bg-[#8B5CF6] text-black text-sm font-semibold transition-colors disabled:opacity-50 mb-3"
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
          className="w-full py-3 cursor-pointer text-red-400/50 hover:text-red-400/80 text-xs tracking-widest transition-colors"
        >
          log out
        </button>
        <button
          onClick={() => router.back()}
          className="w-full flex justify-center gap-2 items-center py-3 cursor-pointer text-white/20 hover:text-white/50 text-sm tracking-widest transition-colors"
        >
          <ArrowLeft size={20} /> back
        </button>
      </div>
    </div>
  );
}
