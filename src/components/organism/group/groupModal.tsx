// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { createPortal } from "react-dom";
// import { useGroupStore } from "@/store/group-store";
// import {
//   getUserProfiles,
//   setGroupAdmin,
//   kickMember,
//   addMembersToGroup,
//   searchUsersByUsername,
//   updateGroupInfo,
// } from "@/lib/firestore/groups";
// import MediaGallery from "../media-gallery/MediaGallery";
// import { isOnline, formatLastSeen } from "@/lib/formatLastSeen";
// import {
//   X,
//   Users,
//   Crown,
//   ShieldCheck,
//   ShieldOff,
//   UserMinus,
//   UserPlus,
//   Loader2,
//   ArrowLeft,
//   Search,
//   Check,
//   Image as ImageIcon,
//   Settings,
//   Camera,
// } from "lucide-react";

// interface Props {
//   groupId: string;
//   myUid: string | null;
//   onClose: () => void;
// }

// interface MemberRow {
//   uid: string;
//   username: string;
//   avatar?: string;
//   online: boolean;
//   lastSeen: any;
//   role: "owner" | "admin" | "member";
// }

// interface MenuPos {
//   top: number;
//   left: number;
//   openUp: boolean;
// }

// async function uploadGroupAvatar(file: File): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "jhravxtb");
//   formData.append("folder", "group_avatars");

//   const res = await fetch(
//     "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
//     { method: "POST", body: formData }
//   );
//   if (!res.ok) throw new Error("Avatar upload failed");
//   const json = await res.json();
//   return json.secure_url as string;
// }

// function ConfirmMini({
//   title,
//   description,
//   confirmLabel,
//   onCancel,
//   onConfirm,
// }: {
//   title: string;
//   description: string;
//   confirmLabel: string;
//   onCancel: () => void;
//   onConfirm: () => void;
// }) {
//   return (
//     <div
//       className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm"
//       onClick={onCancel}
//     >
//       <div
//         className="w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="px-6 pt-6 pb-4">
//           <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
//             <UserMinus size={18} className="text-red-400" />
//           </div>
//           <h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>
//           <p className="text-[13px] text-zinc-400 leading-relaxed">
//             {description}
//           </p>
//         </div>
//         <div className="flex border-t border-white/[0.06]">
//           <button
//             onClick={onCancel}
//             className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
//           >
//             {confirmLabel}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const MENU_WIDTH = 170;

// export default function GroupModal({ groupId, myUid, onClose }: Props) {
//   const group = useGroupStore((s) => s.groups.find((g) => g.id === groupId));

//   const [profiles, setProfiles] = useState<Record<string, any>>({});
//   const [loadingProfiles, setLoadingProfiles] = useState(true);
//   const [zoomUrl, setZoomUrl] = useState<string | null>(null);
//   const [kickTarget, setKickTarget] = useState<MemberRow | null>(null);
//   const [busyUid, setBusyUid] = useState<string | null>(null);
//   const [menuUid, setMenuUid] = useState<string | null>(null);
//   const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
//   const [showMedia, setShowMedia] = useState(false);

//   // --- invite state ---
//   const [inviteMode, setInviteMode] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [searching, setSearching] = useState(false);
//   const [selectedUids, setSelectedUids] = useState<string[]>([]);
//   const [addingMembers, setAddingMembers] = useState(false);

//   // --- settings (name / avatar) state ---
//   const [settingsMode, setSettingsMode] = useState(false);
//   const [nameDraft, setNameDraft] = useState("");
//   const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
//   const [avatarFile, setAvatarFile] = useState<File | null>(null);
//   const [savingSettings, setSavingSettings] = useState(false);

//   const memberIdsKey = useMemo(
//     () => (group ? [...group.members].sort().join(",") : ""),
//     [group?.members]
//   );

//   useEffect(() => {
//     if (!group) return;
//     let cancelled = false;
//     setLoadingProfiles(true);
//     getUserProfiles(group.members).then((res) => {
//       if (!cancelled) {
//         setProfiles(res);
//         setLoadingProfiles(false);
//       }
//     });
//     return () => {
//       cancelled = true;
//     };
//   }, [memberIdsKey]);

//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.key !== "Escape") return;
//       if (showMedia) return; // MediaGallery handles its own Escape

//       if (kickTarget) setKickTarget(null);
//       else if (zoomUrl) setZoomUrl(null);
//       else if (inviteMode) closeInvite();
//       else if (settingsMode) closeSettings();
//       else onClose();
//     };

//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [showMedia, kickTarget, zoomUrl, inviteMode, settingsMode, onClose]);

//   function closeMenu() {
//     setMenuUid(null);
//     setMenuPos(null);
//   }

//   useEffect(() => {
//     if (!menuUid) return;
//     window.addEventListener("click", closeMenu);
//     window.addEventListener("resize", closeMenu);
//     return () => {
//       window.removeEventListener("click", closeMenu);
//       window.removeEventListener("resize", closeMenu);
//     };
//   }, [menuUid]);

//   useEffect(() => {
//     if (!inviteMode) return;
//     const term = searchTerm.trim();
//     if (!term) {
//       setSearchResults([]);
//       setSearching(false);
//       return;
//     }
//     setSearching(true);
//     const t = setTimeout(async () => {
//       try {
//         const res = await searchUsersByUsername(term, group?.members ?? []);
//         setSearchResults(res);
//       } finally {
//         setSearching(false);
//       }
//     }, 300);
//     return () => clearTimeout(t);
//   }, [searchTerm, inviteMode, group?.members]);

//   useEffect(() => {
//     return () => {
//       if (avatarDraft) URL.revokeObjectURL(avatarDraft);
//     };
//   }, [avatarDraft]);

//   if (!group) return null;

//   const isOwner = myUid === group.ownerId;
//   const isAdmin = !!myUid && group.admins.includes(myUid);
//   const canManage = isOwner || isAdmin;

//   const rows: MemberRow[] = group.members.map((uid) => {
//     const p = profiles[uid] || {};
//     const role: MemberRow["role"] =
//       uid === group.ownerId
//         ? "owner"
//         : group.admins.includes(uid)
//         ? "admin"
//         : "member";
//     return {
//       uid,
//       username: p.username || "…",
//       avatar: p.avatar,
//       online: isOnline(p),
//       lastSeen: p.lastSeen,
//       role,
//     };
//   });

//   const roleOrder = { owner: 0, admin: 1, member: 2 };
//   rows.sort((a, b) => {
//     if (roleOrder[a.role] !== roleOrder[b.role])
//       return roleOrder[a.role] - roleOrder[b.role];
//     return a.username.localeCompare(b.username);
//   });

//   const menuRow = menuUid ? rows.find((r) => r.uid === menuUid) ?? null : null;

//   function canKick(target: MemberRow) {
//     if (!canManage) return false;
//     if (target.uid === myUid) return false;
//     if (target.role === "owner") return false;
//     if (target.role === "admin" && !isOwner) return false;
//     return true;
//   }

//   function openMenu(e: React.MouseEvent, uid: string) {
//     e.stopPropagation();

//     if (menuUid === uid) {
//       closeMenu();
//       return;
//     }

//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
//     const estimatedMenuHeight = isOwner ? 92 : 46;
//     const spaceBelow = window.innerHeight - rect.bottom;
//     const openUp = spaceBelow < estimatedMenuHeight + 12;

//     let left = rect.right - MENU_WIDTH;
//     left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

//     setMenuPos({
//       top: openUp ? rect.top - 6 : rect.bottom + 6,
//       left,
//       openUp,
//     });
//     setMenuUid(uid);
//   }

//   async function handleKickConfirmed() {
//     if (!kickTarget) return;
//     setBusyUid(kickTarget.uid);
//     try {
//       await kickMember(groupId, kickTarget.uid);
//     } finally {
//       setBusyUid(null);
//       setKickTarget(null);
//     }
//   }

//   async function toggleAdmin(target: MemberRow) {
//     if (!isOwner || target.role === "owner") return;
//     closeMenu();
//     setBusyUid(target.uid);
//     try {
//       await setGroupAdmin(groupId, target.uid, target.role !== "admin");
//     } finally {
//       setBusyUid(null);
//     }
//   }

//   function openInvite() {
//     setInviteMode(true);
//     setSearchTerm("");
//     setSearchResults([]);
//     setSelectedUids([]);
//   }

//   function closeInvite() {
//     setInviteMode(false);
//     setSearchTerm("");
//     setSearchResults([]);
//     setSelectedUids([]);
//   }

//   function toggleSelected(uid: string) {
//     setSelectedUids((prev) =>
//       prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
//     );
//   }

//   async function handleAddSelected() {
//     if (selectedUids.length === 0) return;
//     setAddingMembers(true);
//     try {
//       await addMembersToGroup(groupId, selectedUids);
//       closeInvite();
//     } finally {
//       setAddingMembers(false);
//     }
//   }

//   function openSettings() {
//     setSettingsMode(true);
//     setNameDraft(group!.name);
//     setAvatarDraft(null);
//     setAvatarFile(null);
//   }

//   function closeSettings() {
//     setSettingsMode(false);
//     setNameDraft("");
//     if (avatarDraft) URL.revokeObjectURL(avatarDraft);
//     setAvatarDraft(null);
//     setAvatarFile(null);
//   }

//   function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (avatarDraft) URL.revokeObjectURL(avatarDraft);
//     setAvatarFile(file);
//     setAvatarDraft(URL.createObjectURL(file));
//   }

//   async function handleSaveSettings() {
//     const trimmed = nameDraft.trim();
//     if (!trimmed) return;

//     setSavingSettings(true);
//     try {
//       let avatarUrl: string | undefined;
//       if (avatarFile) {
//         avatarUrl = await uploadGroupAvatar(avatarFile);
//       }
//       await updateGroupInfo(groupId, {
//         name: trimmed !== group!.name ? trimmed : undefined,
//         avatarUrl,
//       });
//       closeSettings();
//     } finally {
//       setSavingSettings(false);
//     }
//   }

//   const nameChanged =
//     nameDraft.trim() !== group.name && nameDraft.trim().length > 0;
//   const canSaveSettings =
//     (nameChanged || !!avatarFile) &&
//     nameDraft.trim().length > 0 &&
//     !savingSettings;

//   return (
//     <>
//       <style>{`
//         .gm-scroll::-webkit-scrollbar { width: 4px; }
//         .gm-scroll::-webkit-scrollbar-track { background: transparent; }
//         .gm-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.25); border-radius: 999px; }
//         .gm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }
//         .gm-row-menu { animation: gmMenuIn 0.12s cubic-bezier(0.34,1.56,0.64,1); }
//         .gm-row-menu.open-down { transform-origin: top right; }
//         .gm-row-menu.open-up { transform-origin: bottom right; }
//         @keyframes gmMenuIn { from { opacity:0; transform:scale(0.9) translateY(-4px);} to { opacity:1; transform:scale(1) translateY(0);} }
//         .gm-avatar { cursor: zoom-in; transition: opacity 0.15s; }
//         .gm-avatar:hover { opacity: 0.85; }
//         .gm-modal { animation: gmModalIn 0.16s cubic-bezier(0.34,1.56,0.64,1); }
//         @keyframes gmModalIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
//         .gm-row { transition: background-color 0.15s, transform 0.1s; }
//         .gm-row:active { transform: scale(0.99); }
//         .gm-avatar-glow {
//           background: conic-gradient(from 180deg, #7c5cff, #a893ff, #5b3df0, #7c5cff);
//           animation: gmGlowSpin 6s linear infinite;
//         }
//         @keyframes gmGlowSpin { to { transform: rotate(360deg); } }
//         .gm-actionbar { animation: gmActionIn 0.22s cubic-bezier(0.34,1.56,0.64,1) 0.05s both; }
//         @keyframes gmActionIn { from { opacity: 0; transform: translateY(4px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
//       `}</style>

//       <div
//         className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
//         onClick={onClose}
//       >
//         <div
//           className="gm-modal w-[380px] max-h-[85vh] flex flex-col rounded-3xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden relative"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
//             <div className="absolute -top-24 -left-16 w-[280px] h-[280px] rounded-full bg-[#5b3df0]/12 blur-[100px]" />
//           </div>

//           {(inviteMode || settingsMode) && (
//             <button
//               onClick={inviteMode ? closeInvite : closeSettings}
//               className="absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
//             >
//               <ArrowLeft size={15} />
//             </button>
//           )}

//           <button
//             onClick={onClose}
//             className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
//           >
//             <X size={15} />
//           </button>

//           {settingsMode ? (
//             <>
//               {/* header: settings mode */}
//               <div className="relative z-10 flex flex-col items-center pt-9 pb-5 px-6 border-b border-white/[0.06]">
//                 <div
//                   className="relative w-24 h-24 mb-4 cursor-pointer group"
//                   onClick={() =>
//                     document.getElementById("gm-avatar-input")?.click()
//                   }
//                 >
//                   <div className="gm-avatar-glow absolute -inset-[3px] rounded-full opacity-80 blur-[3px]" />
//                   <div className="relative w-full h-full rounded-full overflow-hidden bg-[#1e2a3a] ring-4 ring-[#0d0b17] flex items-center justify-center">
//                     {avatarDraft || group.avatarUrl ? (
//                       <img
//                         src={avatarDraft ?? group.avatarUrl}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <Users size={30} className="text-[#a893ff]" />
//                     )}
//                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
//                       <Camera size={18} className="text-white" />
//                     </div>
//                   </div>
//                   <input
//                     id="gm-avatar-input"
//                     type="file"
//                     accept="image/*"
//                     className="hidden"
//                     onChange={handleAvatarPick}
//                   />
//                 </div>

//                 <input
//                   value={nameDraft}
//                   onChange={(e) => setNameDraft(e.target.value)}
//                   placeholder="Group name"
//                   maxLength={64}
//                   className="w-full max-w-[240px] text-center bg-transparent border-b border-white/10 focus:border-[#7c5cff]/50 outline-none text-[15px] font-semibold text-white py-1 transition-colors"
//                 />
//                 <p className="text-[11.5px] text-zinc-600 mt-3 text-center leading-relaxed px-2">
//                   Only owners and admins can change group name and photo
//                 </p>
//               </div>

//               <div className="relative z-10 flex-1" />

//               <div className="relative z-10 p-3 border-t border-white/[0.06]">
//                 <button
//                   onClick={handleSaveSettings}
//                   disabled={!canSaveSettings}
//                   className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#8f6bff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
//                 >
//                   {savingSettings ? (
//                     <Loader2 size={14} className="animate-spin" />
//                   ) : (
//                     "Save changes"
//                   )}
//                 </button>
//               </div>
//             </>
//           ) : inviteMode ? (
//             <>
//               {/* header: invite mode */}
//               <div className="relative z-10 flex flex-col items-center pt-8 pb-4 px-6 border-b border-white/[0.06]">
//                 <h2 className="text-[16px] font-semibold text-white text-center leading-tight">
//                   Add members
//                 </h2>
//                 <p className="text-[12.5px] text-zinc-500 mt-1">
//                   Search by username
//                 </p>
//               </div>

//               <div className="relative z-10 px-4 pt-3 pb-2">
//                 <div className="relative">
//                   <Search
//                     size={14}
//                     className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
//                   />
//                   <input
//                     autoFocus
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     placeholder="Username..."
//                     className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13.5px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7c5cff]/50 transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="gm-scroll relative z-10 flex-1 overflow-y-auto px-2 py-1">
//                 {searching ? (
//                   <div className="flex items-center justify-center py-10 text-zinc-500 gap-2">
//                     <Loader2 size={16} className="animate-spin" />
//                     <span className="text-xs">Searching…</span>
//                   </div>
//                 ) : searchTerm.trim() && searchResults.length === 0 ? (
//                   <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
//                     <span className="text-xs">No users found</span>
//                   </div>
//                 ) : (
//                   searchResults.map((u) => {
//                     const selected = selectedUids.includes(u.id);
//                     return (
//                       <button
//                         key={u.id}
//                         onClick={() => toggleSelected(u.id)}
//                         className="gm-row w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04] cursor-pointer"
//                       >
//                         <div className="shrink-0 relative">
//                           {u.avatar ? (
//                             <img
//                               src={u.avatar}
//                               className="w-10 h-10 rounded-full object-cover"
//                             />
//                           ) : (
//                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#1e2a3a] text-[#a893ff]">
//                               {u.username?.[0]?.toUpperCase()}
//                             </div>
//                           )}
//                         </div>
//                         <span className="flex-1 min-w-0 text-left text-[13.5px] font-medium text-white truncate">
//                           {u.username}
//                         </span>
//                         <div
//                           className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
//                             selected
//                               ? "bg-[#7c5cff] border-[#7c5cff]"
//                               : "border-white/20"
//                           }`}
//                         >
//                           {selected && (
//                             <Check size={12} className="text-white" />
//                           )}
//                         </div>
//                       </button>
//                     );
//                   })
//                 )}
//               </div>

//               <div className="relative z-10 p-3 border-t border-white/[0.06]">
//                 <button
//                   onClick={handleAddSelected}
//                   disabled={selectedUids.length === 0 || addingMembers}
//                   className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#8f6bff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
//                 >
//                   {addingMembers ? (
//                     <Loader2 size={14} className="animate-spin" />
//                   ) : (
//                     <UserPlus size={14} />
//                   )}
//                   {selectedUids.length > 0
//                     ? `Add ${selectedUids.length} member${
//                         selectedUids.length === 1 ? "" : "s"
//                       }`
//                     : "Add members"}
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               {/* header */}
//               <div className="relative z-10 flex flex-col items-center pt-9 pb-6 px-6 border-b border-white/[0.06]">
//                 <div className="relative w-24 h-24 mb-4">
//                   <div className="gm-avatar-glow absolute -inset-[3px] rounded-full opacity-80 blur-[3px]" />
//                   <div
//                     className="gm-avatar relative w-full h-full rounded-full overflow-hidden bg-[#1e2a3a] ring-4 ring-[#0d0b17] flex items-center justify-center"
//                     onClick={() =>
//                       group.avatarUrl && setZoomUrl(group.avatarUrl)
//                     }
//                   >
//                     {group.avatarUrl ? (
//                       <img
//                         src={group.avatarUrl}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <Users size={30} className="text-[#a893ff]" />
//                     )}
//                   </div>
//                 </div>

//                 <h2 className="text-[18px] font-bold text-white text-center leading-tight tracking-[-0.01em]">
//                   {group.name}
//                 </h2>
//                 <p className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 mt-1.5">
//                   <span className="w-1 h-1 rounded-full bg-zinc-600" />
//                   {group.memberCount} member
//                   {group.memberCount === 1 ? "" : "s"}
//                 </p>

//                 {canManage && (
//                   <div className="gm-actionbar flex items-stretch mt-5 rounded-2xl bg-white/[0.035] border border-white/[0.08] overflow-hidden shadow-lg shadow-black/20">
//                     <button
//                       onClick={openInvite}
//                       className="flex items-center gap-2 pl-4 pr-5 py-2.5 text-[12.5px] font-semibold text-[#a893ff] hover:bg-[#7c5cff]/[0.14] active:bg-[#7c5cff]/[0.2] transition-colors cursor-pointer"
//                     >
//                       <UserPlus size={14} strokeWidth={2.25} />
//                       Add
//                     </button>
//                     <div className="w-px my-2 bg-white/[0.08]" />
//                     <button
//                       onClick={openSettings}
//                       className="flex items-center gap-2 pl-5 pr-4 py-2.5 text-[12.5px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer"
//                     >
//                       <Settings size={14} strokeWidth={2.25} />
//                       Edit
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* members list */}
//               <div
//                 className="gm-scroll relative z-10 flex-1 overflow-y-auto px-2 py-2"
//                 onScroll={closeMenu}
//               >
//                 {loadingProfiles && rows.every((r) => r.username === "…") ? (
//                   <div className="flex items-center justify-center py-10 text-zinc-500 gap-2">
//                     <Loader2 size={16} className="animate-spin" />
//                     <span className="text-xs">Loading members…</span>
//                   </div>
//                 ) : (
//                   rows.map((row) => (
//                     <div
//                       key={row.uid}
//                       className="gm-row group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04] relative"
//                     >
//                       <div
//                         className="shrink-0 relative gm-avatar"
//                         onClick={() => row.avatar && setZoomUrl(row.avatar)}
//                       >
//                         {row.avatar ? (
//                           <img
//                             src={row.avatar}
//                             className="w-10 h-10 rounded-full object-cover"
//                           />
//                         ) : (
//                           <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#1e2a3a] text-[#a893ff]">
//                             {row.username?.[0]?.toUpperCase()}
//                           </div>
//                         )}
//                         <span
//                           className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-[#0d0b17]"
//                           style={{
//                             background: row.online ? "#34D399" : "#3f3f46",
//                           }}
//                         />
//                       </div>

//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-1.5">
//                           <span className="text-[13.5px] font-medium text-white truncate">
//                             {row.username}
//                           </span>
//                           {row.role === "owner" && (
//                             <Crown
//                               size={12}
//                               className="text-yellow-400 shrink-0"
//                             />
//                           )}
//                           {row.role === "admin" && (
//                             <ShieldCheck
//                               size={12}
//                               className="text-[#a893ff] shrink-0"
//                             />
//                           )}
//                         </div>
//                         <span className="text-[11.5px] text-zinc-500 truncate block">
//                           {row.role === "owner"
//                             ? "owner"
//                             : row.role === "admin"
//                             ? "admin"
//                             : row.online
//                             ? "online"
//                             : formatLastSeen(row.lastSeen)}
//                         </span>
//                       </div>

//                       {busyUid === row.uid ? (
//                         <Loader2
//                           size={15}
//                           className="animate-spin text-zinc-500 shrink-0"
//                         />
//                       ) : (
//                         (isOwner || canKick(row)) &&
//                         row.role !== "owner" && (
//                           <button
//                             onClick={(e) => openMenu(e, row.uid)}
//                             className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer ${
//                               menuUid === row.uid
//                                 ? "opacity-100 bg-white/[0.08] text-white"
//                                 : "opacity-0 group-hover:opacity-100"
//                             }`}
//                           >
//                             <UserMinus size={14} />
//                           </button>
//                         )
//                       )}
//                     </div>
//                   ))
//                 )}
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {menuUid &&
//         menuPos &&
//         menuRow &&
//         createPortal(
//           <div
//             className={`gm-row-menu fixed z-[240] w-[170px] rounded-xl bg-[#12111f] border border-white/[0.08] shadow-xl shadow-black/50 overflow-hidden ${
//               menuPos.openUp ? "open-up" : "open-down"
//             }`}
//             style={{
//               left: menuPos.left,
//               ...(menuPos.openUp
//                 ? { bottom: window.innerHeight - menuPos.top }
//                 : { top: menuPos.top }),
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             {isOwner && (
//               <button
//                 onClick={() => toggleAdmin(menuRow)}
//                 className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
//               >
//                 {menuRow.role === "admin" ? (
//                   <>
//                     <ShieldOff size={13} className="text-zinc-500" />
//                     Remove admin
//                   </>
//                 ) : (
//                   <>
//                     <ShieldCheck size={13} className="text-zinc-500" />
//                     Make admin
//                   </>
//                 )}
//               </button>
//             )}
//             {canKick(menuRow) && (
//               <button
//                 onClick={() => {
//                   closeMenu();
//                   setKickTarget(menuRow);
//                 }}
//                 className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
//               >
//                 <UserMinus size={13} className="text-red-400/70" />
//                 Remove from group
//               </button>
//             )}
//           </div>,
//           document.body
//         )}

//       {zoomUrl && (
//         <div
//           className="fixed inset-0 z-[230] flex items-center justify-center bg-black/90 backdrop-blur-sm"
//           onClick={() => setZoomUrl(null)}
//         >
//           <button
//             onClick={() => setZoomUrl(null)}
//             className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
//           >
//             <X size={16} />
//           </button>
//           <img
//             src={zoomUrl}
//             alt="avatar"
//             className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
//             onClick={(e) => e.stopPropagation()}
//           />
//         </div>
//       )}

//       {kickTarget && (
//         <ConfirmMini
//           title={`Remove ${kickTarget.username}?`}
//           description="They will lose access to this group and won't see new messages. They can be re-invited later."
//           confirmLabel="Remove"
//           onCancel={() => setKickTarget(null)}
//           onConfirm={handleKickConfirmed}
//         />
//       )}
//       {showMedia && (
//         <MediaGallery groupId={groupId} onClose={() => setShowMedia(false)} />
//       )}
//     </>
//   );
// }
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useGroupStore } from "@/store/group-store";
import {
  getUserProfiles,
  setGroupAdmin,
  kickMember,
  addMembersToGroup,
  searchUsersByUsername,
  updateGroupInfo,
} from "@/lib/firestore/groups";
import MediaGallery from "../media-gallery/MediaGallery";
import { isOnline, formatLastSeen } from "@/lib/formatLastSeen";
import {
  X,
  Users,
  Crown,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  UserPlus,
  Loader2,
  ArrowLeft,
  Search,
  Check,
  Image as ImageIcon,
  Settings,
  Camera,
} from "lucide-react";

interface Props {
  groupId: string;
  myUid: string | null;
  onClose: () => void;
}

interface MemberRow {
  uid: string;
  username: string;
  avatar?: string;
  online: boolean;
  lastSeen: any;
  role: "owner" | "admin" | "member";
}

interface MenuPos {
  top: number;
  left: number;
  openUp: boolean;
}

async function uploadGroupAvatar(file: File): Promise<string> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "group_avatars");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Avatar upload failed");
  }

  const json = await res.json();

  return json.secure_url as string;
}

function ConfirmMini({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <UserMinus size={18} className="text-red-400" />
          </div>

          <h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>

          <p className="text-[13px] text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex border-t border-white/[0.06]">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const MENU_WIDTH = 170;

export default function GroupModal({ groupId, myUid, onClose }: Props) {
  const group = useGroupStore((s) => s.groups.find((g) => g.id === groupId));

  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [kickTarget, setKickTarget] = useState<MemberRow | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const [menuUid, setMenuUid] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);

  // MEDIA
  const [showMedia, setShowMedia] = useState(false);

  // --- invite state ---
  const [inviteMode, setInviteMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // --- settings state ---
  const [settingsMode, setSettingsMode] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const memberIdsKey = useMemo(
    () => (group ? [...group.members].sort().join(",") : ""),
    [group?.members]
  );

  useEffect(() => {
    if (!group) return;

    let cancelled = false;

    setLoadingProfiles(true);

    getUserProfiles(group.members).then((res) => {
      if (!cancelled) {
        setProfiles(res);
        setLoadingProfiles(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [memberIdsKey]);

  // ESCAPE
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      // MediaGallery сама обрабатывает Escape
      if (showMedia) return;

      if (kickTarget) {
        setKickTarget(null);
      } else if (zoomUrl) {
        setZoomUrl(null);
      } else if (inviteMode) {
        closeInvite();
      } else if (settingsMode) {
        closeSettings();
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [showMedia, kickTarget, zoomUrl, inviteMode, settingsMode, onClose]);

  function closeMenu() {
    setMenuUid(null);
    setMenuPos(null);
  }

  useEffect(() => {
    if (!menuUid) return;

    window.addEventListener("click", closeMenu);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("resize", closeMenu);
    };
  }, [menuUid]);

  // SEARCH USERS
  useEffect(() => {
    if (!inviteMode) return;

    const term = searchTerm.trim();

    if (!term) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    const t = setTimeout(async () => {
      try {
        const res = await searchUsersByUsername(term, group?.members ?? []);

        setSearchResults(res);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [searchTerm, inviteMode, group?.members]);

  // AVATAR PREVIEW CLEANUP
  useEffect(() => {
    return () => {
      if (avatarDraft) {
        URL.revokeObjectURL(avatarDraft);
      }
    };
  }, [avatarDraft]);

  if (!group) return null;

  const isOwner = myUid === group.ownerId;
  const isAdmin = !!myUid && group.admins.includes(myUid);
  const canManage = isOwner || isAdmin;

  const rows: MemberRow[] = group.members.map((uid) => {
    const p = profiles[uid] || {};

    const role: MemberRow["role"] =
      uid === group.ownerId
        ? "owner"
        : group.admins.includes(uid)
        ? "admin"
        : "member";

    return {
      uid,
      username: p.username || "…",
      avatar: p.avatar,
      online: isOnline(p),
      lastSeen: p.lastSeen,
      role,
    };
  });

  const roleOrder = {
    owner: 0,
    admin: 1,
    member: 2,
  };

  rows.sort((a, b) => {
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }

    return a.username.localeCompare(b.username);
  });

  const menuRow = menuUid ? rows.find((r) => r.uid === menuUid) ?? null : null;

  function canKick(target: MemberRow) {
    if (!canManage) return false;
    if (target.uid === myUid) return false;
    if (target.role === "owner") return false;

    if (target.role === "admin" && !isOwner) {
      return false;
    }

    return true;
  }

  function openMenu(e: React.MouseEvent, uid: string) {
    e.stopPropagation();

    if (menuUid === uid) {
      closeMenu();
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const estimatedMenuHeight = isOwner ? 92 : 46;

    const spaceBelow = window.innerHeight - rect.bottom;

    const openUp = spaceBelow < estimatedMenuHeight + 12;

    let left = rect.right - MENU_WIDTH;

    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    setMenuPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      openUp,
    });

    setMenuUid(uid);
  }

  async function handleKickConfirmed() {
    if (!kickTarget) return;

    setBusyUid(kickTarget.uid);

    try {
      await kickMember(groupId, kickTarget.uid);
    } finally {
      setBusyUid(null);
      setKickTarget(null);
    }
  }

  async function toggleAdmin(target: MemberRow) {
    if (!isOwner || target.role === "owner") {
      return;
    }

    closeMenu();
    setBusyUid(target.uid);

    try {
      await setGroupAdmin(groupId, target.uid, target.role !== "admin");
    } finally {
      setBusyUid(null);
    }
  }

  function openInvite() {
    setInviteMode(true);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedUids([]);
  }

  function closeInvite() {
    setInviteMode(false);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedUids([]);
  }

  function toggleSelected(uid: string) {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  }

  async function handleAddSelected() {
    if (selectedUids.length === 0) return;

    setAddingMembers(true);

    try {
      await addMembersToGroup(groupId, selectedUids);

      closeInvite();
    } finally {
      setAddingMembers(false);
    }
  }

  function openSettings() {
    setSettingsMode(true);
    setNameDraft(group.name);
    setAvatarDraft(null);
    setAvatarFile(null);
  }

  function closeSettings() {
    setSettingsMode(false);
    setNameDraft("");

    if (avatarDraft) {
      URL.revokeObjectURL(avatarDraft);
    }

    setAvatarDraft(null);
    setAvatarFile(null);
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (avatarDraft) {
      URL.revokeObjectURL(avatarDraft);
    }

    setAvatarFile(file);
    setAvatarDraft(URL.createObjectURL(file));
  }

  async function handleSaveSettings() {
    const trimmed = nameDraft.trim();

    if (!trimmed) return;

    setSavingSettings(true);

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        avatarUrl = await uploadGroupAvatar(avatarFile);
      }

      await updateGroupInfo(groupId, {
        name: trimmed !== group.name ? trimmed : undefined,
        avatarUrl,
      });

      closeSettings();
    } finally {
      setSavingSettings(false);
    }
  }

  const nameChanged =
    nameDraft.trim() !== group.name && nameDraft.trim().length > 0;

  const canSaveSettings =
    (nameChanged || !!avatarFile) &&
    nameDraft.trim().length > 0 &&
    !savingSettings;

  return (
    <>
      <style>{`
        .gm-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .gm-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .gm-scroll::-webkit-scrollbar-thumb {
          background: rgba(124,92,255,0.25);
          border-radius: 999px;
        }

        .gm-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(124,92,255,0.5);
        }

        .gm-row-menu {
          animation: gmMenuIn 0.12s cubic-bezier(0.34,1.56,0.64,1);
        }

        .gm-row-menu.open-down {
          transform-origin: top right;
        }

        .gm-row-menu.open-up {
          transform-origin: bottom right;
        }

        @keyframes gmMenuIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-4px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .gm-avatar {
          cursor: zoom-in;
          transition: opacity 0.15s;
        }

        .gm-avatar:hover {
          opacity: 0.85;
        }

        .gm-modal {
          animation: gmModalIn 0.16s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes gmModalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(6px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .gm-row {
          transition:
            background-color 0.15s,
            transform 0.1s;
        }

        .gm-row:active {
          transform: scale(0.99);
        }

        .gm-avatar-glow {
          background:
            conic-gradient(
              from 180deg,
              #7c5cff,
              #a893ff,
              #5b3df0,
              #7c5cff
            );

          animation:
            gmGlowSpin 6s linear infinite;
        }

        @keyframes gmGlowSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .gm-actionbar {
          animation:
            gmActionIn
            0.22s
            cubic-bezier(0.34,1.56,0.64,1)
            0.05s
            both;
        }

        @keyframes gmActionIn {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* MAIN MODAL */}
      <div
        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="gm-modal w-[380px] max-h-[85vh] flex flex-col rounded-3xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-24 -left-16 w-[280px] h-[280px] rounded-full bg-[#5b3df0]/12 blur-[100px]" />
          </div>

          {(inviteMode || settingsMode) && (
            <button
              onClick={inviteMode ? closeInvite : closeSettings}
              className="absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
            </button>
          )}

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>

          {settingsMode ? (
            <>
              <div className="relative z-10 flex flex-col items-center pt-9 pb-5 px-6 border-b border-white/[0.06]">
                <div
                  className="relative w-24 h-24 mb-4 cursor-pointer group"
                  onClick={() =>
                    document.getElementById("gm-avatar-input")?.click()
                  }
                >
                  <div className="gm-avatar-glow absolute -inset-[3px] rounded-full opacity-80 blur-[3px]" />

                  <div className="relative w-full h-full rounded-full overflow-hidden bg-[#1e2a3a] ring-4 ring-[#0d0b17] flex items-center justify-center">
                    {avatarDraft || group.avatarUrl ? (
                      <img
                        src={avatarDraft ?? group.avatarUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={30} className="text-[#a893ff]" />
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>

                  <input
                    id="gm-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarPick}
                  />
                </div>

                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Group name"
                  maxLength={64}
                  className="w-full max-w-[240px] text-center bg-transparent border-b border-white/10 focus:border-[#7c5cff]/50 outline-none text-[15px] font-semibold text-white py-1 transition-colors"
                />

                <p className="text-[11.5px] text-zinc-600 mt-3 text-center leading-relaxed px-2">
                  Only owners and admins can change group name and photo
                </p>
              </div>

              <div className="relative z-10 flex-1" />

              <div className="relative z-10 p-3 border-t border-white/[0.06]">
                <button
                  onClick={handleSaveSettings}
                  disabled={!canSaveSettings}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#8f6bff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
                >
                  {savingSettings ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </>
          ) : inviteMode ? (
            <>
              <div className="relative z-10 flex flex-col items-center pt-8 pb-4 px-6 border-b border-white/[0.06]">
                <h2 className="text-[16px] font-semibold text-white text-center leading-tight">
                  Add members
                </h2>

                <p className="text-[12.5px] text-zinc-500 mt-1">
                  Search by username
                </p>
              </div>

              <div className="relative z-10 px-4 pt-3 pb-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Username..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13.5px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7c5cff]/50 transition-colors"
                  />
                </div>
              </div>

              <div className="gm-scroll relative z-10 flex-1 overflow-y-auto px-2 py-1">
                {searching ? (
                  <div className="flex items-center justify-center py-10 text-zinc-500 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs">Searching…</span>
                  </div>
                ) : searchTerm.trim() && searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                    <span className="text-xs">No users found</span>
                  </div>
                ) : (
                  searchResults.map((u) => {
                    const selected = selectedUids.includes(u.id);

                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleSelected(u.id)}
                        className="gm-row w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04] cursor-pointer"
                      >
                        <div className="shrink-0 relative">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#1e2a3a] text-[#a893ff]">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>

                        <span className="flex-1 min-w-0 text-left text-[13.5px] font-medium text-white truncate">
                          {u.username}
                        </span>

                        <div
                          className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-[#7c5cff] border-[#7c5cff]"
                              : "border-white/20"
                          }`}
                        >
                          {selected && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="relative z-10 p-3 border-t border-white/[0.06]">
                <button
                  onClick={handleAddSelected}
                  disabled={selectedUids.length === 0 || addingMembers}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#8f6bff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
                >
                  {addingMembers ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}

                  {selectedUids.length > 0
                    ? `Add ${selectedUids.length} member${
                        selectedUids.length === 1 ? "" : "s"
                      }`
                    : "Add members"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* HEADER */}
              <div className="relative z-10 flex flex-col items-center pt-9 pb-6 px-6 border-b border-white/[0.06]">
                <div className="relative w-24 h-24 mb-4">
                  <div className="gm-avatar-glow absolute -inset-[3px] rounded-full opacity-80 blur-[3px]" />

                  <div
                    className="gm-avatar relative w-full h-full rounded-full overflow-hidden bg-[#1e2a3a] ring-4 ring-[#0d0b17] flex items-center justify-center"
                    onClick={() =>
                      group.avatarUrl && setZoomUrl(group.avatarUrl)
                    }
                  >
                    {group.avatarUrl ? (
                      <img
                        src={group.avatarUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={30} className="text-[#a893ff]" />
                    )}
                  </div>
                </div>

                <h2 className="text-[18px] font-bold text-white text-center leading-tight tracking-[-0.01em]">
                  {group.name}
                </h2>

                <p className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 mt-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  {group.memberCount} member
                  {group.memberCount === 1 ? "" : "s"}
                </p>

                <div className="gm-actionbar flex items-stretch mt-5 rounded-2xl bg-white/[0.035] border border-white/[0.08] overflow-hidden shadow-lg shadow-black/20">
                  <button
                    onClick={() => setShowMedia(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold text-[#a893ff] hover:bg-[#7c5cff]/[0.14] active:bg-[#7c5cff]/[0.2] transition-colors cursor-pointer"
                  >
                    <ImageIcon size={14} strokeWidth={2.25} />
                    Media
                  </button>

                  {canManage && (
                    <>
                      <div className="w-px my-2 bg-white/[0.08]" />

                      <button
                        onClick={openInvite}
                        className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold text-[#a893ff] hover:bg-[#7c5cff]/[0.14] active:bg-[#7c5cff]/[0.2] transition-colors cursor-pointer"
                      >
                        <UserPlus size={14} strokeWidth={2.25} />
                        Add
                      </button>

                      <div className="w-px my-2 bg-white/[0.08]" />

                      <button
                        onClick={openSettings}
                        className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        <Settings size={14} strokeWidth={2.25} />
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                className="gm-scroll relative z-10 flex-1 overflow-y-auto px-2 py-2"
                onScroll={closeMenu}
              >
                {loadingProfiles && rows.every((r) => r.username === "…") ? (
                  <div className="flex items-center justify-center py-10 text-zinc-500 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs">Loading members…</span>
                  </div>
                ) : (
                  rows.map((row) => (
                    <div
                      key={row.uid}
                      className="gm-row group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04] relative"
                    >
                      <div
                        className="shrink-0 relative gm-avatar"
                        onClick={() => row.avatar && setZoomUrl(row.avatar)}
                      >
                        {row.avatar ? (
                          <img
                            src={row.avatar}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#1e2a3a] text-[#a893ff]">
                            {row.username?.[0]?.toUpperCase()}
                          </div>
                        )}

                        <span
                          className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-[#0d0b17]"
                          style={{
                            background: row.online ? "#34D399" : "#3f3f46",
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-medium text-white truncate">
                            {row.username}
                          </span>

                          {row.role === "owner" && (
                            <Crown
                              size={12}
                              className="text-yellow-400 shrink-0"
                            />
                          )}

                          {row.role === "admin" && (
                            <ShieldCheck
                              size={12}
                              className="text-[#a893ff] shrink-0"
                            />
                          )}
                        </div>

                        <span className="text-[11.5px] text-zinc-500 truncate block">
                          {row.role === "owner"
                            ? "owner"
                            : row.role === "admin"
                            ? "admin"
                            : row.online
                            ? "online"
                            : formatLastSeen(row.lastSeen)}
                        </span>
                      </div>

                      {busyUid === row.uid ? (
                        <Loader2
                          size={15}
                          className="animate-spin text-zinc-500 shrink-0"
                        />
                      ) : (
                        (isOwner || canKick(row)) &&
                        row.role !== "owner" && (
                          <button
                            onClick={(e) => openMenu(e, row.uid)}
                            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer ${
                              menuUid === row.uid
                                ? "opacity-100 bg-white/[0.08] text-white"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <UserMinus size={14} />
                          </button>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {menuUid &&
        menuPos &&
        menuRow &&
        createPortal(
          <div
            className={`gm-row-menu fixed z-[240] w-[170px] rounded-xl bg-[#12111f] border border-white/[0.08] shadow-xl shadow-black/50 overflow-hidden ${
              menuPos.openUp ? "open-up" : "open-down"
            }`}
            style={{
              left: menuPos.left,
              ...(menuPos.openUp
                ? {
                    bottom: window.innerHeight - menuPos.top,
                  }
                : {
                    top: menuPos.top,
                  }),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isOwner && (
              <button
                onClick={() => toggleAdmin(menuRow)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                {menuRow.role === "admin" ? (
                  <>
                    <ShieldOff size={13} className="text-zinc-500" />
                    Remove admin
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} className="text-zinc-500" />
                    Make admin
                  </>
                )}
              </button>
            )}

            {canKick(menuRow) && (
              <button
                onClick={() => {
                  closeMenu();
                  setKickTarget(menuRow);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <UserMinus size={13} className="text-red-400/70" />
                Remove from group
              </button>
            )}
          </div>,
          document.body
        )}

      {showMedia && (
        <MediaGallery groupId={groupId} onClose={() => setShowMedia(false)} />
      )}

      {zoomUrl && (
        <div
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setZoomUrl(null)}
        >
          <button
            onClick={() => setZoomUrl(null)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>

          <img
            src={zoomUrl}
            alt="avatar"
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {kickTarget && (
        <ConfirmMini
          title={`Remove ${kickTarget.username}?`}
          description="They will lose access to this group and won't see new messages. They can be re-invited later."
          confirmLabel="Remove"
          onCancel={() => setKickTarget(null)}
          onConfirm={handleKickConfirmed}
        />
      )}
    </>
  );
}
