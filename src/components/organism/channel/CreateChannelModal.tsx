"use client";

import { useState, useRef } from "react";
import { X, Camera } from "lucide-react";
import { createChannel } from "@/lib/firestore/channels";

async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "channel_avatars");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function CreateChannelModal({
  uid,
  username,
  onClose,
  onCreated,
}: {
  uid: string;
  username: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) avatarUrl = await uploadAvatar(avatarFile);
      const channelId = await createChannel(
        uid,
        username,
        name.trim(),
        description.trim(),
        avatarUrl
      );
      onCreated(channelId);
      onClose();
    } catch (err) {
      console.error("Create channel failed:", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[380px] rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[15px] font-semibold text-white">New Channel</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 w-16 h-16 rounded-full border border-dashed border-white/20 bg-[#A78BFA]/[0.08] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#A78BFA]/40 transition-colors"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera size={20} className="text-[#A78BFA]" />
              )}
            </button>
            <div className="text-xs text-zinc-500">
              Channel avatar
              <br />
              Not required
            </div>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1.5 block">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Channel name"
              maxLength={40}
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 160))}
              placeholder="What this channel is about"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 transition-all resize-none"
            />
            <div className="text-[10px] text-zinc-600 text-right mt-1">
              {description.length} / 160
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: "linear-gradient(135deg, #A78BFA, #7c3aed)" }}
          >
            {creating ? "We are creating…" : "Create a channel"}
          </button>
        </div>
      </div>
    </div>
  );
}
