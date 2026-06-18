"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { uploadAvatar } from "@/lib/uploadAvatar";
import { updateUser } from "@/lib/firestore/users";
import Link from "next/link";

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
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

      if (file) {
        avatarUrl = await uploadAvatar(file, uid);
      }

      const data: any = {};
      const cleanUsername = username.trim().toLowerCase();

      if (cleanUsername) data.username = cleanUsername;
      if (avatarUrl) data.avatar = avatarUrl;

      if (Object.keys(data).length === 0) return;

      await updateUser(uid, data);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070A0F] via-[#0B1220] to-[#070A0F] text-[#E5E7EB] p-6">
      <div className="w-full max-w-md bg-[#0F1620]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Update your username and avatar
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <img
            src={preview || "/default-avatar.png"}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-[#A78BFA]"
          />

          <label className="cursor-pointer">
            <span className="inline-flex items-center px-4 py-2 rounded-xl bg-[#1B2633] hover:bg-[#243447] transition-colors">
              Choose image
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-4 py-3 rounded-xl bg-[#1B2633] border border-transparent outline-none transition-all focus:border-[#A78BFA]"
          />

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl font-medium bg-[#A78BFA] text-black hover:bg-[#8B5CF6] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {saved && (
            <div className="text-center text-sm text-[#A78BFA]">
              Profile updated
            </div>
          )}

          <Link
            href="/"
            className="flex items-center justify-center w-full py-3 rounded-xl font-medium bg-[#1B2633] hover:bg-[#243447] transition-colors"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
