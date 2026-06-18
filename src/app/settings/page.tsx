"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { uploadAvatar } from "@/lib/uploadAvatar";
import { updateUser } from "@/lib/firestore/users";

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

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
    console.log("SAVE CLICKED", uid);

    let avatarUrl = "";

    if (file) {
      avatarUrl = await uploadAvatar(file, uid);
    }

    const data: any = {};

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername) {
      data.username = cleanUsername;
    }

    if (avatarUrl) {
      data.avatar = avatarUrl;
    }

    if (Object.keys(data).length === 0) {
      alert("Nothing to update");
      return;
    }

    await updateUser(uid, data);

    alert("Profile updated");

    window.location.reload();
  }

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-[420px] bg-zinc-900 p-6 rounded-2xl space-y-4">
        <h1 className="text-xl font-bold">Profile Settings</h1>

        <div className="flex items-center gap-4">
          <img
            src={preview || "/default-avatar.png"}
            className="w-16 h-16 rounded-full object-cover"
          />

          <input type="file" accept="image/*" onChange={handleFile} />
        </div>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-full p-2 rounded bg-zinc-800 outline-none"
        />

        <button
          onClick={save}
          className="w-full bg-green-500 text-black py-2 rounded-xl font-medium hover:bg-green-400"
        >
          Save
        </button>
        
      </div>
    </div>
  );
}
