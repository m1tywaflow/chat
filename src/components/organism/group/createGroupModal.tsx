// "use client";

// import { useState, useRef, useMemo, useEffect } from "react";
// import { X, Camera, Users, Check, Search } from "lucide-react";
// import { createGroup } from "@/lib/firestore/groups";

// async function uploadAvatar(file: File): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "jhravxtb");
//   formData.append("folder", "group_avatars");
//   const res = await fetch(
//     "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
//     { method: "POST", body: formData }
//   );
//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
//   return data.secure_url;
// }

// interface ContactOption {
//   uid: string;
//   username: string;
//   avatarUrl?: string | null;
// }

// export default function CreateGroupModal({
//   uid,
//   username,
//   contacts,
//   onClose,
//   onCreated,
// }: {
//   uid: string;
//   username: string;
//   contacts: ContactOption[];
//   onClose: () => void;
//   onCreated: (groupId: string) => void;
// }) {
//   const [name, setName] = useState("");
//   const [avatarFile, setAvatarFile] = useState<File | null>(null);
//   const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [selected, setSelected] = useState<Set<string>>(new Set());
//   const [creating, setCreating] = useState(false);
//   const fileRef = useRef<HTMLInputElement | null>(null);
//   const nameRef = useRef<HTMLInputElement | null>(null);

//   useEffect(() => {
//     nameRef.current?.focus();
//   }, []);

//   const filteredContacts = useMemo(() => {
//     if (!search.trim()) return contacts;
//     const q = search.toLowerCase();
//     return contacts.filter((c) => c.username.toLowerCase().includes(q));
//   }, [contacts, search]);

//   const selectedContacts = useMemo(
//     () => contacts.filter((c) => selected.has(c.uid)),
//     [contacts, selected]
//   );

//   function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setAvatarFile(file);
//     setAvatarPreview(URL.createObjectURL(file));
//   }

//   function toggleContact(contactUid: string) {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       if (next.has(contactUid)) next.delete(contactUid);
//       else next.add(contactUid);
//       return next;
//     });
//   }

//   async function handleCreate() {
//     if (!name.trim() || selected.size === 0 || creating) return;
//     setCreating(true);
//     try {
//       let avatarUrl: string | null = null;
//       if (avatarFile) avatarUrl = await uploadAvatar(avatarFile);
//       const groupId = await createGroup(
//         uid,
//         username,
//         name.trim(),
//         Array.from(selected),
//         avatarUrl
//       );
//       onCreated(groupId);
//       onClose();
//     } catch (err) {
//       console.error("Create group failed:", err);
//     } finally {
//       setCreating(false);
//     }
//   }

//   function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
//     if (e.key === "Enter" && name.trim() && selected.size > 0) {
//       handleCreate();
//     }
//   }

//   const initial = name.trim() ? name.trim()[0].toUpperCase() : null;
//   const canCreate = !!name.trim() && selected.size > 0 && !creating;

//   return (
//     <div
//       className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
//       onClick={onClose}
//     >
//       <style>{`
//         @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
//         @keyframes rowIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
//         @keyframes chipIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
//         .cgm-scroll::-webkit-scrollbar { width: 4px; }
//         .cgm-scroll::-webkit-scrollbar-track { background: transparent; }
//         .cgm-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
//         .cgm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
//         .cgm-chips::-webkit-scrollbar { display: none; }
//         .cgm-row { animation: rowIn 0.15s ease both; }
//         .cgm-chip { animation: chipIn 0.15s cubic-bezier(0.34,1.4,0.64,1) both; }
//       `}</style>

//       <div
//         className="relative w-[380px] rounded-[24px] overflow-hidden"
//         style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.4,0.64,1)" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* single ambient glow — one accent, not two competing corners */}
//         <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#5b3df0]/[0.16] blur-[100px]" />

//         <div className="relative rounded-[24px] border border-white/[0.07] bg-[#0d0b17]/95 backdrop-blur-xl shadow-[0_20px_70px_-15px_rgba(91,61,240,0.35)]">
//           {/* header */}
//           <div className="flex items-center justify-between px-6 pt-5 pb-4">
//             <h3 className="text-[15px] font-semibold text-white">New group</h3>
//             <button
//               onClick={onClose}
//               className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer"
//             >
//               <X size={14} />
//             </button>
//           </div>

//           <div className="px-6 pb-6 flex flex-col gap-5">
//             {/* avatar + name, centered — the two things every group needs
//                 before anything else, no boxed "Name" field around it */}
//             <div className="flex flex-col items-center gap-3">
//               <input
//                 ref={fileRef}
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={handleAvatarChange}
//               />
//               <button
//                 onClick={() => fileRef.current?.click()}
//                 className="group relative shrink-0 w-20 h-20 rounded-full cursor-pointer"
//               >
//                 {avatarPreview || initial ? (
//                   <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78]" />
//                 ) : (
//                   <div className="absolute inset-0 rounded-full border border-dashed border-white/15 group-hover:border-[#7c5cff]/50 transition-colors" />
//                 )}
//                 <div className="relative w-full h-full rounded-full overflow-hidden bg-[#12111f] flex items-center justify-center m-[1.5px] scale-[0.965]">
//                   {avatarPreview ? (
//                     <img
//                       src={avatarPreview}
//                       alt="avatar"
//                       className="w-full h-full object-cover"
//                     />
//                   ) : initial ? (
//                     <span className="text-3xl font-semibold text-white/90">
//                       {initial}
//                     </span>
//                   ) : (
//                     <Camera
//                       size={20}
//                       className="text-white/25 group-hover:text-white/50 transition-colors"
//                     />
//                   )}
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <Camera size={17} className="text-white" />
//                   </div>
//                 </div>
//               </button>

//               <div className="w-full">
//                 <input
//                   ref={nameRef}
//                   value={name}
//                   onChange={(e) => setName(e.target.value.slice(0, 40))}
//                   onKeyDown={handleNameKeyDown}
//                   placeholder="Group name"
//                   className="w-full text-center bg-transparent text-[16px] font-medium text-white placeholder-white/25 outline-none border-b border-white/[0.08] focus:border-[#7c5cff]/60 pb-2 transition-colors"
//                 />
//               </div>
//             </div>

//             {/* search */}
//             <div className="flex items-center gap-2.5 px-3.5 h-11 rounded-full bg-white/[0.04] border border-white/[0.06] focus-within:border-[#7c5cff]/40 transition-colors">
//               <Search size={14} className="text-white/25 shrink-0" />
//               <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search contacts"
//                 className="w-full bg-transparent text-[13.5px] text-white placeholder-white/25 outline-none"
//               />
//               {selected.size > 0 && (
//                 <span className="shrink-0 text-[11px] font-medium text-[#a996ff] tabular-nums">
//                   {selected.size}
//                 </span>
//               )}
//             </div>

//             {/* selected members — a quiet horizontal strip, not a boxed area */}
//             {selectedContacts.length > 0 && (
//               <div className="cgm-chips flex items-center gap-1.5 -mx-1 px-1 overflow-x-auto">
//                 {selectedContacts.map((c) => (
//                   <button
//                     key={c.uid}
//                     onClick={() => toggleContact(c.uid)}
//                     className="cgm-chip group shrink-0 flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.09] transition-colors cursor-pointer"
//                   >
//                     <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
//                       {c.avatarUrl ? (
//                         <img
//                           src={c.avatarUrl}
//                           alt={c.username}
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <span className="text-[8px] text-white/70">
//                           {c.username[0]?.toUpperCase()}
//                         </span>
//                       )}
//                     </div>
//                     <span className="text-[11.5px] text-white/75 max-w-[80px] truncate">
//                       {c.username}
//                     </span>
//                     <X
//                       size={10}
//                       className="text-white/30 group-hover:text-white/70 transition-colors"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* contact list — flat rows, no surrounding box */}
//             <div className="cgm-scroll max-h-52 overflow-y-auto -mx-1.5 flex flex-col gap-0.5">
//               {filteredContacts.length === 0 && (
//                 <div className="flex flex-col items-center gap-1.5 py-8 text-center">
//                   <Search size={16} className="text-white/10" />
//                   <p className="text-[12px] text-white/25">No contacts found</p>
//                 </div>
//               )}
//               {filteredContacts.map((c, i) => {
//                 const isSelected = selected.has(c.uid);
//                 return (
//                   <button
//                     key={c.uid}
//                     onClick={() => toggleContact(c.uid)}
//                     style={{ animationDelay: `${Math.min(i, 8) * 12}ms` }}
//                     className={`cgm-row flex items-center gap-2.5 px-1.5 py-2 rounded-xl transition-colors cursor-pointer text-left ${
//                       isSelected
//                         ? "bg-[#7c5cff]/[0.08]"
//                         : "hover:bg-white/[0.04]"
//                     }`}
//                   >
//                     <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/[0.06] shrink-0 flex items-center justify-center">
//                       {c.avatarUrl ? (
//                         <img
//                           src={c.avatarUrl}
//                           alt={c.username}
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <span className="text-[12px] text-white/60">
//                           {c.username[0]?.toUpperCase()}
//                         </span>
//                       )}
//                     </div>
//                     <span className="flex-1 text-[13.5px] text-white/85 truncate">
//                       {c.username}
//                     </span>
//                     <div
//                       className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
//                         isSelected
//                           ? "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] scale-100"
//                           : "border border-white/15 scale-95"
//                       }`}
//                     >
//                       {isSelected && (
//                         <Check
//                           size={11}
//                           className="text-white"
//                           strokeWidth={3}
//                         />
//                       )}
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* submit */}
//             <button
//               onClick={handleCreate}
//               disabled={!canCreate}
//               className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(124,92,255,0.6)] flex items-center justify-center gap-2"
//             >
//               {creating ? (
//                 <>
//                   <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
//                   creating…
//                 </>
//               ) : (
//                 "Create group"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Users,
  Check,
  Search,
  Trash2,
  AlertCircle,
} from "lucide-react";
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

function pluralizeMembers(n: number) {
  return n === 1 ? "member" : "members";
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
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !creating) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [creating, onClose]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.username.toLowerCase().includes(q));
  }, [contacts, search]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selected.has(c.uid)),
    [contacts, selected]
  );

  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selected.has(c.uid));

  function setAvatarFromFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFromFile(file);
  }

  function handleAvatarDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setAvatarFromFile(file);
  }

  function handleRemoveAvatar(e: React.MouseEvent) {
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleContact(contactUid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contactUid)) next.delete(contactUid);
      else next.add(contactUid);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredContacts.forEach((c) => next.delete(c.uid));
      } else {
        filteredContacts.forEach((c) => next.add(c.uid));
      }
      return next;
    });
  }

  const handleCreate = useCallback(async () => {
    if (!name.trim() || selected.size === 0 || creating) return;
    setCreating(true);
    setError(null);
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
      setError("Couldn't create the group. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [name, selected, creating, avatarFile, uid, username, onCreated, onClose]);

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim() && selected.size > 0) {
      handleCreate();
    }
  }

  const initial = name.trim() ? name.trim()[0].toUpperCase() : null;
  const canCreate = !!name.trim() && selected.size > 0 && !creating;
  const nameLen = name.trim().length;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => !creating && onClose()}
    >
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes rowIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
        @keyframes chipIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes ringSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes errorIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        .cgm-scroll::-webkit-scrollbar { width: 4px; }
        .cgm-scroll::-webkit-scrollbar-track { background: transparent; }
        .cgm-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .cgm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
        .cgm-chips::-webkit-scrollbar { display: none; }
        .cgm-row { animation: rowIn 0.15s ease both; }
        .cgm-chip { animation: chipIn 0.15s cubic-bezier(0.34,1.4,0.64,1) both; }
        .cgm-error { animation: errorIn 0.15s ease both; }
        .cgm-ring { background: conic-gradient(from 0deg, #7c5cff, #5b3df0, #2b1f78, #7c5cff); animation: ringSpin 3s linear infinite; }
      `}</style>

      <div
        className="relative w-[380px] rounded-[24px] overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#5b3df0]/[0.16] blur-[100px]" />

        <div className="relative rounded-[24px] border border-white/[0.07] bg-[#0d0b17]/95 backdrop-blur-xl shadow-[0_20px_70px_-15px_rgba(91,61,240,0.35)]">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-white">
                New group
              </h3>
              {selected.size > 0 && (
                <span className="text-[11px] font-medium text-[#a996ff] bg-[#7c5cff]/[0.12] px-2 py-[3px] rounded-full tabular-nums">
                  {selected.size} {pluralizeMembers(selected.size)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={creating}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingAvatar(true);
                }}
                onDragLeave={() => setIsDraggingAvatar(false)}
                onDrop={handleAvatarDrop}
                className="group relative shrink-0 w-20 h-20 rounded-full cursor-pointer"
              >
                <div
                  className={`absolute -inset-[3px] rounded-full transition-opacity duration-300 ${
                    isDraggingAvatar ? "cgm-ring opacity-100" : "opacity-0"
                  }`}
                />
                {avatarPreview || initial ? (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78]" />
                ) : (
                  <div
                    className={`absolute inset-0 rounded-full border border-dashed transition-colors ${
                      isDraggingAvatar
                        ? "border-[#7c5cff] bg-[#7c5cff]/[0.06]"
                        : "border-white/15 group-hover:border-[#7c5cff]/50"
                    }`}
                  />
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
                {avatarPreview && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1a1826] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-400/30 transition-colors cursor-pointer shadow-md"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              <div className="w-full relative">
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Group name"
                  className="w-full text-center bg-transparent text-[16px] font-medium text-white placeholder-white/25 outline-none border-b border-white/[0.08] focus:border-[#7c5cff]/60 pb-2 transition-colors"
                />
                {nameLen > 28 && (
                  <span className="absolute right-0 -bottom-4 text-[10px] text-white/25 tabular-nums">
                    {nameLen}/40
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 h-11 rounded-full bg-white/[0.04] border border-white/[0.06] focus-within:border-[#7c5cff]/40 transition-colors">
              <Search size={14} className="text-white/25 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts"
                className="w-full bg-transparent text-[13.5px] text-white placeholder-white/25 outline-none"
              />
              {filteredContacts.length > 0 && (
                <button
                  onClick={toggleSelectAllFiltered}
                  className="shrink-0 text-[11px] font-medium text-[#a996ff] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

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

            {error && (
              <div className="cgm-error flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <p className="text-[11.5px] text-red-300">{error}</p>
              </div>
            )}

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
                <>
                  <Users size={15} />
                  Create group
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
