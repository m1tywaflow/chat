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

function Field({
  label,
  children,
  trailing,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 transition-colors focus-within:border-[#7c5cff]/50 focus-within:bg-white/[0.03] ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
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
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes rowIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes chipIn { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
        .cgm-scroll::-webkit-scrollbar { width: 4px; }
        .cgm-scroll::-webkit-scrollbar-track { background: transparent; }
        .cgm-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .cgm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
        .cgm-row { animation: rowIn 0.18s ease both; }
        .cgm-chip { animation: chipIn 0.18s cubic-bezier(0.34,1.4,0.64,1) both; }
      `}</style>

      <div
        className="relative w-[400px] rounded-[26px] overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#5b3df0]/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-56 h-56 rounded-full bg-[#2b1f78]/20 blur-[90px]" />

        <div className="relative rounded-[26px] border border-white/[0.07] bg-[#0d0b17]/95 backdrop-blur-xl shadow-[0_20px_70px_-15px_rgba(91,61,240,0.35)]">
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#4028b0] flex items-center justify-center shrink-0 shadow-[0_4px_14px_-4px_rgba(124,92,255,0.6)]">
                <Users size={15} className="text-white" strokeWidth={2.25} />
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
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-6 pt-5 pb-6 flex flex-col gap-3.5">
            {/* avatar + name */}
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
                className="group relative shrink-0 w-16 h-16 rounded-2xl cursor-pointer"
              >
                {avatarPreview || initial ? (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78] opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="absolute inset-0 rounded-2xl border border-dashed border-white/15 group-hover:border-[#7c5cff]/50 transition-colors" />
                )}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#12111f] flex items-center justify-center m-[1.5px] scale-[0.965]">
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
                    <Camera
                      size={18}
                      className="text-white/25 group-hover:text-white/50 transition-colors"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <Field
                  label="Name"
                  trailing={
                    <span className="text-[10px] text-white/15 tabular-nums">
                      {name.length}/40
                    </span>
                  }
                >
                  <input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 40))}
                    onKeyDown={handleNameKeyDown}
                    placeholder="Group name"
                    className="w-full bg-transparent text-[15px] text-white placeholder-white/20 outline-none"
                  />
                </Field>
              </div>
            </div>

            {/* members */}
            <Field
              label="Members"
              trailing={
                <span
                  className={`text-[10px] tabular-nums transition-colors ${
                    selected.size > 0 ? "text-[#a996ff]" : "text-white/20"
                  }`}
                >
                  {selected.size} selected
                </span>
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <Search size={13} className="text-white/20 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts"
                  className="w-full bg-transparent text-[13.5px] text-white placeholder-white/20 outline-none"
                />
              </div>

              {selectedContacts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2.5 border-b border-white/[0.05]">
                  {selectedContacts.map((c) => (
                    <button
                      key={c.uid}
                      onClick={() => toggleContact(c.uid)}
                      className="cgm-chip group flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[#7c5cff]/12 border border-[#7c5cff]/25 hover:bg-[#7c5cff]/20 hover:border-[#7c5cff]/40 transition-colors cursor-pointer"
                    >
                      <div className="w-4.5 h-4.5 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
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
                      <span className="text-[11.5px] text-white/80 max-w-[90px] truncate">
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

              <div className="cgm-scroll max-h-40 overflow-y-auto -mx-1 flex flex-col gap-0.5">
                {filteredContacts.length === 0 && (
                  <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                    <Search size={16} className="text-white/10" />
                    <p className="text-[12px] text-white/20">
                      No contacts found
                    </p>
                  </div>
                )}
                {filteredContacts.map((c, i) => {
                  const isSelected = selected.has(c.uid);
                  return (
                    <button
                      key={c.uid}
                      onClick={() => toggleContact(c.uid)}
                      style={{ animationDelay: `${Math.min(i, 8) * 15}ms` }}
                      className={`cgm-row flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-[#7c5cff]/[0.08]"
                          : "hover:bg-white/[0.04]"
                      }`}
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
                        className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
                          isSelected
                            ? "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] scale-100"
                            : "border border-white/15 scale-95"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={10}
                            className="text-white"
                            strokeWidth={3}
                          />
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
              disabled={!canCreate}
              className="w-full h-12 mt-0.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(124,92,255,0.6)] flex items-center justify-center gap-2"
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
