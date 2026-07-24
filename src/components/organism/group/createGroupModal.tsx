"use client";

import { useState, useRef, useMemo } from "react";
import { X, Camera, Users, Check } from "lucide-react";
import { createGroup } from "@/lib/firestore/groups"; // поправь путь, если положил не туда

async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "group_avatars");
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

interface ContactOption {
  uid: string;
  username: string;
  avatarUrl?: string | null;
}

export default function CreateGroupModal({
  uid,
  username,
  contacts,
  onClose,
  onCreated,
}: {
  uid: string;
  username: string;
  contacts: ContactOption[];
  onClose: () => void;
  onCreated: (groupId: string) => void;
}) {
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.username.toLowerCase().includes(q));
  }, [contacts, search]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function toggleContact(contactUid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contactUid)) next.delete(contactUid);
      else next.add(contactUid);
      return next;
    });
  }

  async function handleCreate() {
    if (!name.trim() || selected.size === 0 || creating) return;
    setCreating(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) avatarUrl = await uploadAvatar(avatarFile);
      const groupId = await createGroup(
        uid,
        username,
        name.trim(),
        Array.from(selected),
        avatarUrl
      );
      onCreated(groupId);
      onClose();
    } catch (err) {
      console.error("Create group failed:", err);
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
      `}</style>

      <div
        className="relative w-[400px] rounded-[26px] overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#5b3df0]/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-56 h-56 rounded-full bg-[#2b1f78]/25 blur-[90px]" />

        <div className="relative rounded-[26px] border border-white/[0.07] bg-[#0d0b17]/95 backdrop-blur-xl shadow-[0_0_70px_-15px_rgba(91,61,240,0.4)]">
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#4028b0] flex items-center justify-center shrink-0">
                <Users size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white leading-tight">
                  New group
                </h3>
                <p className="text-[11px] text-white/30 leading-tight mt-0.5">
                  chat with several people at once
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
                Group avatar
                <br />
                Optional — a letter badge is used if you skip it
              </div>
            </div>

            {/* name */}
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="Group name"
                className="w-full bg-transparent text-[15px] text-white placeholder-white/20 outline-none"
              />
            </Field>

            {/* members */}
            <Field
              label="Members"
              trailing={
                <span className="text-[10px] text-white/20 tabular-nums">
                  {selected.size} selected
                </span>
              }
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts"
                className="w-full bg-transparent text-[14px] text-white placeholder-white/20 outline-none mb-2"
              />

              <div className="max-h-40 overflow-y-auto -mx-1 flex flex-col">
                {filteredContacts.length === 0 && (
                  <p className="text-[12px] text-white/20 px-1 py-2">
                    No contacts found
                  </p>
                )}
                {filteredContacts.map((c) => {
                  const isSelected = selected.has(c.uid);
                  return (
                    <button
                      key={c.uid}
                      onClick={() => toggleContact(c.uid)}
                      className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                    >
                      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-white/[0.06] shrink-0 flex items-center justify-center">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] text-white/60">
                            {c.username[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 text-[13px] text-white/80 truncate">
                        {c.username}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0]"
                            : "border border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* submit */}
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selected.size === 0 || creating}
              className="w-full h-12 mt-1 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] shadow-[0_8px_24px_-8px_rgba(124,92,255,0.6)] flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  creating…
                </>
              ) : (
                "Create group"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
