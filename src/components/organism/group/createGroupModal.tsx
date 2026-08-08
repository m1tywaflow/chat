"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { X, Camera, Users, Check, Search } from "lucide-react";
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
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.username.toLowerCase().includes(q));
  }, [contacts, search]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selected.has(c.uid)),
    [contacts, selected]
  );

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

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim() && selected.size > 0) {
      handleCreate();
    }
  }

  const initial = name.trim() ? name.trim()[0].toUpperCase() : null;
  const canCreate = !!name.trim() && selected.size > 0 && !creating;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes rowIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
        @keyframes chipIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        .cgm-scroll::-webkit-scrollbar { width: 4px; }
        .cgm-scroll::-webkit-scrollbar-track { background: transparent; }
        .cgm-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .cgm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
        .cgm-chips::-webkit-scrollbar { display: none; }
        .cgm-row { animation: rowIn 0.15s ease both; }
        .cgm-chip { animation: chipIn 0.15s cubic-bezier(0.34,1.4,0.64,1) both; }
      `}</style>

      <div
        className="relative w-[380px] rounded-[24px] overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* single ambient glow — one accent, not two competing corners */}
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#5b3df0]/[0.16] blur-[100px]" />

        <div className="relative rounded-[24px] border border-white/[0.07] bg-[#0d0b17]/95 backdrop-blur-xl shadow-[0_20px_70px_-15px_rgba(91,61,240,0.35)]">
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h3 className="text-[15px] font-semibold text-white">New group</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-5">
            {/* avatar + name, centered — the two things every group needs
                before anything else, no boxed "Name" field around it */}
            <div className="flex flex-col items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="group relative shrink-0 w-20 h-20 rounded-full cursor-pointer"
              >
                {avatarPreview || initial ? (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78]" />
                ) : (
                  <div className="absolute inset-0 rounded-full border border-dashed border-white/15 group-hover:border-[#7c5cff]/50 transition-colors" />
                )}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-[#12111f] flex items-center justify-center m-[1.5px] scale-[0.965]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : initial ? (
                    <span className="text-3xl font-semibold text-white/90">
                      {initial}
                    </span>
                  ) : (
                    <Camera
                      size={20}
                      className="text-white/25 group-hover:text-white/50 transition-colors"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={17} className="text-white" />
                  </div>
                </div>
              </button>

              <div className="w-full">
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Group name"
                  className="w-full text-center bg-transparent text-[16px] font-medium text-white placeholder-white/25 outline-none border-b border-white/[0.08] focus:border-[#7c5cff]/60 pb-2 transition-colors"
                />
              </div>
            </div>

            {/* search */}
            <div className="flex items-center gap-2.5 px-3.5 h-11 rounded-full bg-white/[0.04] border border-white/[0.06] focus-within:border-[#7c5cff]/40 transition-colors">
              <Search size={14} className="text-white/25 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts"
                className="w-full bg-transparent text-[13.5px] text-white placeholder-white/25 outline-none"
              />
              {selected.size > 0 && (
                <span className="shrink-0 text-[11px] font-medium text-[#a996ff] tabular-nums">
                  {selected.size}
                </span>
              )}
            </div>

            {/* selected members — a quiet horizontal strip, not a boxed area */}
            {selectedContacts.length > 0 && (
              <div className="cgm-chips flex items-center gap-1.5 -mx-1 px-1 overflow-x-auto">
                {selectedContacts.map((c) => (
                  <button
                    key={c.uid}
                    onClick={() => toggleContact(c.uid)}
                    className="cgm-chip group shrink-0 flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.09] transition-colors cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[8px] text-white/70">
                          {c.username[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-white/75 max-w-[80px] truncate">
                      {c.username}
                    </span>
                    <X
                      size={10}
                      className="text-white/30 group-hover:text-white/70 transition-colors"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* contact list — flat rows, no surrounding box */}
            <div className="cgm-scroll max-h-52 overflow-y-auto -mx-1.5 flex flex-col gap-0.5">
              {filteredContacts.length === 0 && (
                <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                  <Search size={16} className="text-white/10" />
                  <p className="text-[12px] text-white/25">No contacts found</p>
                </div>
              )}
              {filteredContacts.map((c, i) => {
                const isSelected = selected.has(c.uid);
                return (
                  <button
                    key={c.uid}
                    onClick={() => toggleContact(c.uid)}
                    style={{ animationDelay: `${Math.min(i, 8) * 12}ms` }}
                    className={`cgm-row flex items-center gap-2.5 px-1.5 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#7c5cff]/[0.08]"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/[0.06] shrink-0 flex items-center justify-center">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[12px] text-white/60">
                          {c.username[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-[13.5px] text-white/85 truncate">
                      {c.username}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
                        isSelected
                          ? "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] scale-100"
                          : "border border-white/15 scale-95"
                      }`}
                    >
                      {isSelected && (
                        <Check
                          size={11}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* submit */}
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(124,92,255,0.6)] flex items-center justify-center gap-2"
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
