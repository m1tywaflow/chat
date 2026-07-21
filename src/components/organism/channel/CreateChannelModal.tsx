"use client";

import { useState, useRef } from "react";
import { X, Camera, Megaphone } from "lucide-react";
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

function Field({
  label,
  children,
  trailing,
}: {
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 focus-within:border-[#7c5cff]/40 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
          {label}
        </span>
        {trailing}
      </div>
      {children}
    </div>
  );
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

  const initial = name.trim() ? name.trim()[0].toUpperCase() : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes ringSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        className="relative w-[400px] rounded-[26px] overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow field behind the card */}
        <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#5b3df0]/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-56 h-56 rounded-full bg-[#2b1f78]/25 blur-[90px]" />

        <div className="relative rounded-[26px] border border-white/[0.07] bg-[#0d0b17]/95 backdrop-blur-xl shadow-[0_0_70px_-15px_rgba(91,61,240,0.4)]">
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#4028b0] flex items-center justify-center shrink-0">
                <Megaphone size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white leading-tight">
                  New channel
                </h3>
                <p className="text-[11px] text-white/30 leading-tight mt-0.5">
                  broadcast to your subscribers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
            {/* avatar */}
            <div className="flex items-center gap-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="group relative shrink-0 w-[68px] h-[68px] rounded-2xl cursor-pointer"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78] blur-[2px] opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#12111f] flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : initial ? (
                    <span className="text-2xl font-semibold text-white/90">
                      {initial}
                    </span>
                  ) : (
                    <Camera size={20} className="text-white/70" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
              </button>
              <div className="text-[11px] text-white/30 leading-relaxed">
                Channel avatar
                <br />
                Optional — a letter badge is used if you skip it
              </div>
            </div>

            {/* name */}
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="Channel name"
                className="w-full bg-transparent text-[15px] text-white placeholder-white/20 outline-none"
              />
            </Field>

            {/* description */}
            <Field
              label="Description"
              trailing={
                <span className="text-[10px] text-white/20 tabular-nums">
                  {description.length}/160
                </span>
              }
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 160))}
                placeholder="What this channel is about"
                rows={3}
                className="w-full bg-transparent text-[14px] text-white placeholder-white/20 outline-none resize-none leading-relaxed"
              />
            </Field>

            {/* submit */}
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="w-full h-12 mt-1 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] shadow-[0_8px_24px_-8px_rgba(124,92,255,0.6)] flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  creating…
                </>
              ) : (
                "Create channel"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
