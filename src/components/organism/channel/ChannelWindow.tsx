// "use client";

// import { useEffect, useState, useRef } from "react";
// import { Channel, ChannelPost } from "@/types/channel";
// import {
//   subscribeToChannelDoc,
//   subscribeToChannelPosts,
//   createChannelPost,
//   togglePostReaction,
//   checkIsSubscribed,
//   subscribeToChannel,
//   unsubscribeFromChannel,
//   deleteChannelPost,
//   deleteChannel,
// } from "@/lib/firestore/channels";
// import {
//   Megaphone,
//   Paperclip,
//   Send,
//   MoreVertical,
//   Trash2,
//   X,
//   Smile,
// } from "lucide-react";
// import { useChannelStore } from "@/store/channel-store";
// import { CUSTOM_EMOJIS, isCustomEmojiUrl } from "@/lib/customEmoji";
// import { doc, updateDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// const REACTION_EMOJIS = ["❤️", "😂", "😮", "👍", "🔥"];

// function formatTime(ts: any): string {
//   if (!ts) return "";
//   const date = ts.toDate ? ts.toDate() : new Date(ts);
//   return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// }

// async function uploadPostImage(file: File): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "jhravxtb");
//   formData.append("folder", "channel_posts");
//   const res = await fetch(
//     "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
//     { method: "POST", body: formData }
//   );
//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
//   return data.secure_url;
// }

// export default function ChannelWindow({
//   channelId,
//   myUid,
// }: {
//   channelId: string;
//   myUid: string;
// }) {
//   const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
//   const [channel, setChannel] = useState<Channel | null>(null);
//   const [posts, setPosts] = useState<ChannelPost[]>([]);
//   const [isSub, setIsSub] = useState(false);
//   const [text, setText] = useState("");
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
//   const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
//   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
//   const [deleteChannelConfirm, setDeleteChannelConfirm] = useState(false);
//   const fileRef = useRef<HTMLInputElement | null>(null);
//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const inputRef = useRef<HTMLInputElement | null>(null);
//   const emojiPanelRef = useRef<HTMLDivElement | null>(null);

//   const isOwner = channel?.ownerId === myUid;

//   useEffect(() => {
//     const unsub = subscribeToChannelDoc(channelId, setChannel);
//     return () => unsub();
//   }, [channelId]);

//   useEffect(() => {
//     const unsub = subscribeToChannelPosts(channelId, (p) => {
//       setPosts(p.slice().reverse());
//       requestAnimationFrame(() =>
//         bottomRef.current?.scrollIntoView({ behavior: "instant" })
//       );
//     });
//     return () => unsub();
//   }, [channelId]);

//   useEffect(() => {
//     checkIsSubscribed(channelId, myUid).then(setIsSub);
//   }, [channelId, myUid]);

//   useEffect(() => {
//     if (!emojiPanelOpen) return;
//     const handleClick = (e: MouseEvent) => {
//       if (
//         emojiPanelRef.current &&
//         !emojiPanelRef.current.contains(e.target as Node)
//       )
//         setEmojiPanelOpen(false);
//     };
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [emojiPanelOpen]);

//   async function toggleSub() {
//     if (isSub) {
//       setIsSub(false);
//       await unsubscribeFromChannel(channelId, myUid);
//     } else {
//       setIsSub(true);
//       await subscribeToChannel(channelId, myUid);
//     }
//   }

//   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = "";
//     setImageFile(file);
//     setImagePreview(URL.createObjectURL(file));
//   }

//   function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
//     const items = e.clipboardData?.items;
//     if (!items) return;
//     for (const item of Array.from(items)) {
//       if (item.type.startsWith("image/")) {
//         const file = item.getAsFile();
//         if (file) {
//           e.preventDefault();
//           setImageFile(file);
//           setImagePreview(URL.createObjectURL(file));
//         }
//         break;
//       }
//     }
//   }

//   function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
//     if (e.key === "Enter") handlePost();
//   }

//   async function handlePost() {
//     if (!text.trim() && !imageFile) return;
//     setUploading(true);
//     try {
//       let imageUrl: string | undefined;
//       if (imageFile) imageUrl = await uploadPostImage(imageFile);
//       await createChannelPost(channelId, myUid, text.trim(), imageUrl);
//       setText("");
//       setImageFile(null);
//       setImagePreview(null);
//     } catch (err) {
//       console.error("Post failed:", err);
//     } finally {
//       setUploading(false);
//     }
//   }

//   async function sendSticker(url: string) {
//     setEmojiPanelOpen(false);
//     await createChannelPost(channelId, myUid, "", url);
//   }

//   function getReactionSummary(reactions: Record<string, string[]> | undefined) {
//     if (!reactions) return [];
//     return Object.entries(reactions)
//       .filter(([, uids]) => uids.length > 0)
//       .map(([token, uids]) => ({
//         token,
//         count: uids.length,
//         mine: uids.includes(myUid),
//       }));
//   }
//   function ConfirmDialog({
//     icon,
//     title,
//     description,
//     onCancel,
//     onConfirm,
//     confirmLabel = "Delete",
//   }: {
//     icon: React.ReactNode;
//     title: string;
//     description: string;
//     onCancel: () => void;
//     onConfirm: () => void;
//     confirmLabel?: string;
//   }) {
//     useEffect(() => {
//       const handler = (e: KeyboardEvent) => {
//         if (e.key === "Escape") onCancel();
//       };
//       window.addEventListener("keydown", handler);
//       return () => window.removeEventListener("keydown", handler);
//     }, [onCancel]);

//     return (
//       <div
//         className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
//         onClick={onCancel}
//       >
//         <div
//           className="w-[320px] rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div className="px-6 pt-6 pb-4">
//             <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
//               {icon}
//             </div>
//             <h3 className="text-[15px] font-semibold text-white mb-1">
//               {title}
//             </h3>
//             <p className="text-[13px] text-zinc-400 leading-relaxed">
//               {description}
//             </p>
//           </div>
//           <div className="flex border-t border-white/[0.06]">
//             <button
//               onClick={onCancel}
//               className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
//             >
//               {confirmLabel}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   async function confirmDelete() {
//     if (!channelId || !deleteConfirmId) return;
//     await deleteChannelPost(channelId, deleteConfirmId);
//     setDeleteConfirmId(null);
//   }

//   async function confirmDeleteChat() {
//     if (!channelId) return;
//     await updateDoc(doc(db, "channels", channelId), {
//       [`deleted.${myUid}`]: true,
//     });
//     useChannelStore.getState().setActiveChannel(null);
//     setDeleteChannelConfirm(false);
//   }
//   if (!channel) return null;

//   return (
//     <div
//       className="flex flex-col w-full h-full"
//       style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
//     >
//       <div className="flex-none flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#0c121a]">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="shrink-0 w-9 h-9 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-sm font-semibold">
//             {channel.avatarUrl ? (
//               <img
//                 src={channel.avatarUrl}
//                 alt={channel.name}
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               channel.name.charAt(0).toUpperCase()
//             )}
//           </div>
//           <div className="min-w-0">
//             <div className="flex items-center gap-1.5 text-sm font-semibold text-white truncate">
//               {channel.name}
//               <Megaphone size={12} className="text-[#A78BFA] shrink-0" />
//             </div>
//             <div className="text-[11px] text-zinc-500">
//               {channel.subscriberCount} subscribers
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           {!isOwner && (
//             <button
//               onClick={toggleSub}
//               className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
//                 isSub
//                   ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-red-400/30 hover:text-red-400"
//                   : "bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/25 hover:bg-[#A78BFA]/25"
//               }`}
//             >
//               {isSub ? "Unsubscribe" : "Subscribe"}
//             </button>
//           )}
//           {isOwner && (
//             <div className="relative">
//               <button
//                 onClick={() => setMenuOpen((v) => !v)}
//                 className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//               >
//                 <MoreVertical size={16} />
//               </button>
//               {menuOpen && (
//                 <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#0d0b14] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
//                   <button
//                     onClick={() => {
//                       setMenuOpen(false);
//                       setDeleteChannelConfirm(true);
//                     }}
//                     className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
//                   >
//                     <Trash2 size={14} />
//                     Delete channel
//                   </button>
//                 </div>
//               )}
//               {deleteConfirmId && (
//                 <ConfirmDialog
//                   icon={<Trash2 size={18} className="text-red-400" />}
//                   title="Delete message?"
//                   description="This action cannot be undone. The message will be permanently removed for everyone."
//                   onCancel={() => setDeleteConfirmId(null)}
//                   onConfirm={confirmDelete}
//                   confirmLabel="Delete"
//                 />
//               )}

//               {/* Delete chat confirm */}
//               {deleteChannelConfirm && (
//                 <ConfirmDialog
//                   icon={<Trash2 size={18} className="text-red-400" />}
//                   title="Delete chat?"
//                   description="This will permanently delete the entire conversation. This action cannot be undone."
//                   onCancel={() => setDeleteChannelConfirm(false)}
//                   onConfirm={confirmDeleteChat}
//                   confirmLabel="Delete"
//                 />
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
//         {posts.map((p) => {
//           const reactionSummary = getReactionSummary(p.reactions);
//           const isPickerOpen = pickerOpenId === p.id;
//           const isSticker =
//             !p.text && p.imageUrl && isCustomEmojiUrl(p.imageUrl);

//           if (isSticker) {
//             return (
//               <div
//                 key={p.id}
//                 className="relative group max-w-[420px] mx-auto flex flex-col items-start gap-1"
//               >
//                 <img
//                   src={p.imageUrl!}
//                   alt="sticker"
//                   className="w-32 h-32 object-contain"
//                 />
//                 <div className="flex items-center gap-2 px-1">
//                   <div className="text-[10px] text-zinc-500">
//                     {formatTime(p.createdAt)}
//                   </div>
//                   {isOwner && (
//                     <button
//                       onClick={() => setDeleteConfirmId(p.id)}
//                       className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer"
//                     >
//                       <Trash2 size={12} />
//                     </button>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-1 px-1 flex-wrap">
//                   {reactionSummary.map(({ token, count, mine }) => (
//                     <button
//                       key={token}
//                       onClick={() =>
//                         togglePostReaction(channelId, p.id, token, myUid)
//                       }
//                       className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border ${
//                         mine
//                           ? "bg-[#A78BFA]/20 border-[#A78BFA]/50 text-[#A78BFA]"
//                           : "bg-black/20 border-white/15 text-zinc-400"
//                       }`}
//                     >
//                       <span>{token}</span>
//                       <span className="font-medium">{count}</span>
//                     </button>
//                   ))}
//                   <div className="relative">
//                     <button
//                       onClick={() =>
//                         setPickerOpenId(isPickerOpen ? null : p.id)
//                       }
//                       className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/[0.05] transition-colors cursor-pointer text-sm"
//                     >
//                       +
//                     </button>
//                     {isPickerOpen && (
//                       <div className="absolute z-30 bottom-full mb-2 left-0 flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50">
//                         {REACTION_EMOJIS.map((token) => (
//                           <button
//                             key={token}
//                             onClick={() => {
//                               togglePostReaction(channelId, p.id, token, myUid);
//                               setPickerOpenId(null);
//                             }}
//                             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer text-lg"
//                           >
//                             {token}
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           }

//           return (
//             <div
//               key={p.id}
//               className="relative group max-w-[420px] mx-auto rounded-2xl border border-white/[0.08] overflow-hidden"
//               style={{ background: "var(--color-msg-bg)" }}
//             >
//               {p.imageUrl && (
//                 <img
//                   src={p.imageUrl}
//                   alt="post"
//                   className="w-full max-h-[360px] object-cover"
//                 />
//               )}
//               <div className="px-4 py-3">
//                 {p.text && (
//                   <div className="text-sm leading-relaxed whitespace-pre-wrap">
//                     {p.text}
//                     {p.edited && (
//                       <span className="text-[10px] ml-1 opacity-50">
//                         (edited)
//                       </span>
//                     )}
//                   </div>
//                 )}
//                 <div className="flex items-center justify-between mt-2">
//                   <div className="text-[10px] text-zinc-500">
//                     {formatTime(p.createdAt)}
//                   </div>
//                   {isOwner && (
//                     <button
//                       onClick={() => setDeleteConfirmId(p.id)}
//                       className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer"
//                     >
//                       <Trash2 size={13} />
//                     </button>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-1 mt-2 flex-wrap">
//                   {reactionSummary.map(({ token, count, mine }) => (
//                     <button
//                       key={token}
//                       onClick={() =>
//                         togglePostReaction(channelId, p.id, token, myUid)
//                       }
//                       className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border ${
//                         mine
//                           ? "bg-[#A78BFA]/20 border-[#A78BFA]/50 text-[#A78BFA]"
//                           : "bg-black/20 border-white/15 text-zinc-400"
//                       }`}
//                     >
//                       <span>{token}</span>
//                       <span className="font-medium">{count}</span>
//                     </button>
//                   ))}
//                   <div className="relative">
//                     <button
//                       onClick={() =>
//                         setPickerOpenId(isPickerOpen ? null : p.id)
//                       }
//                       className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/[0.05] transition-colors cursor-pointer text-sm"
//                     >
//                       +
//                     </button>
//                     {isPickerOpen && (
//                       <div className="absolute z-30 bottom-full mb-2 left-0 flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50">
//                         {REACTION_EMOJIS.map((token) => (
//                           <button
//                             key={token}
//                             onClick={() => {
//                               togglePostReaction(channelId, p.id, token, myUid);
//                               setPickerOpenId(null);
//                             }}
//                             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer text-lg"
//                           >
//                             {token}
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         {posts.length === 0 && (
//           <div className="text-center text-zinc-600 text-sm py-10">
//             No posts yet
//           </div>
//         )}
//         <div ref={bottomRef} />
//       </div>

//       {isOwner && (
//         <div className="flex-none border-t border-white/[0.06] bg-[#0d0b14] px-3 py-3">
//           {imagePreview && (
//             <div className="mb-2 relative inline-block">
//               <img
//                 src={imagePreview}
//                 alt="preview"
//                 className="h-20 rounded-xl object-cover border border-white/[0.08]"
//               />
//               <button
//                 onClick={() => {
//                   setImageFile(null);
//                   setImagePreview(null);
//                 }}
//                 className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors"
//               >
//                 <X size={11} />
//               </button>
//             </div>
//           )}
//           <div className="flex items-center gap-2">
//             <input
//               ref={fileRef}
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={handleFileChange}
//             />
//             <button
//               onClick={() => fileRef.current?.click()}
//               title="Attach photo"
//               className="shrink-0 cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 hover:text-[#A78BFA] hover:bg-[#A78BFA]/[0.08] transition-all hover:scale-105 active:scale-95"
//             >
//               <Paperclip size={16} />
//             </button>

//             <div className="relative shrink-0" ref={emojiPanelRef}>
//               <button
//                 onClick={() => setEmojiPanelOpen((v) => !v)}
//                 title="Send a sticker"
//                 className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 hover:text-[#A78BFA] hover:bg-[#A78BFA]/[0.08] transition-all hover:scale-105 active:scale-95"
//               >
//                 <Smile size={16} />
//               </button>
//               {emojiPanelOpen && (
//                 <div className="chat-scroll absolute z-30 bottom-full mb-2 left-0 grid grid-cols-4 gap-1.5 p-2.5 w-[220px] max-h-[210px] overflow-y-auto rounded-2xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50">
//                   {CUSTOM_EMOJIS.map((e) => (
//                     <button
//                       key={e.id}
//                       onClick={() => sendSticker(e.url)}
//                       className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
//                     >
//                       <img
//                         src={e.url}
//                         alt={e.id}
//                         className="w-9 h-9 object-contain"
//                       />
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <input
//               ref={inputRef}
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               onKeyDown={handleKeyDown}
//               onPaste={handlePaste}
//               placeholder="Write a post…"
//               className="flex-1 h-11 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 transition-all"
//             />

//             <button
//               onClick={handlePost}
//               disabled={(!text.trim() && !imageFile) || uploading}
//               className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
//               style={{
//                 background: "linear-gradient(135deg, #A78BFA, #7c3aed)",
//               }}
//             >
//               {uploading ? (
//                 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
//               ) : (
//                 <Send size={14} className="text-white" />
//               )}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useEffect, useState, useRef } from "react";
import { Channel, ChannelPost } from "@/types/channel";
import {
  subscribeToChannelDoc,
  subscribeToChannelPosts,
  createChannelPost,
  togglePostReaction,
  checkIsSubscribed,
  subscribeToChannel,
  unsubscribeFromChannel,
  deleteChannelPost,
  deleteChannel,
} from "@/lib/firestore/channels";
import {
  Megaphone,
  Paperclip,
  Send,
  MoreVertical,
  Trash2,
  X,
  Smile,
  MessageCircle,
  Plus,
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { CUSTOM_EMOJIS, isCustomEmojiUrl } from "@/lib/customEmoji";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChannelInfoModal from "./ChannelInfoModal";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "👍", "🔥"];

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function uploadPostImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "channel_posts");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

function ReactionPill({
  token,
  count,
  mine,
  onClick,
}: {
  token: string;
  count: number;
  mine: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 h-6 px-2 rounded-full text-xs cursor-pointer border transition-colors ${
        mine
          ? "bg-[#A78BFA]/20 border-[#A78BFA]/50 text-[#A78BFA]"
          : "bg-black/20 border-white/15 text-zinc-400 hover:border-white/25"
      }`}
    >
      <span className="leading-none">{token}</span>
      <span className="font-medium leading-none">{count}</span>
    </button>
  );
}

export default function ChannelWindow({
  channelId,
  myUid,
}: {
  channelId: string;
  myUid: string;
}) {
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
  const openPostComments = useChannelStore((s) => s.openPostComments);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [isSub, setIsSub] = useState(false);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteChannelConfirm, setDeleteChannelConfirm] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);

  const isOwner = channel?.ownerId === myUid;

  useEffect(() => {
    const unsub = subscribeToChannelDoc(channelId, setChannel);
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = subscribeToChannelPosts(channelId, (p) => {
      setPosts(p.slice().reverse());
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "instant" })
      );
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    checkIsSubscribed(channelId, myUid).then(setIsSub);
  }, [channelId, myUid]);

  useEffect(() => {
    if (!emojiPanelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(e.target as Node)
      )
        setEmojiPanelOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [emojiPanelOpen]);

  async function toggleSub() {
    if (isSub) {
      setIsSub(false);
      await unsubscribeFromChannel(channelId, myUid);
    } else {
      setIsSub(true);
      await subscribeToChannel(channelId, myUid);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
        }
        break;
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handlePost();
  }

  async function handlePost() {
    if (!text.trim() && !imageFile) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadPostImage(imageFile);
      await createChannelPost(channelId, myUid, text.trim(), imageUrl);
      setText("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setUploading(false);
    }
  }

  async function sendSticker(url: string) {
    setEmojiPanelOpen(false);
    await createChannelPost(channelId, myUid, "", url);
  }

  function getReactionSummary(reactions: Record<string, string[]> | undefined) {
    if (!reactions) return [];
    return Object.entries(reactions)
      .filter(([, uids]) => uids.length > 0)
      .map(([token, uids]) => ({
        token,
        count: uids.length,
        mine: uids.includes(myUid),
      }));
  }

  function PostActionsBar({ post }: { post: ChannelPost }) {
    const reactionSummary = getReactionSummary(post.reactions);
    const isPickerOpen = pickerOpenId === post.id;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {reactionSummary.map(({ token, count, mine }) => (
          <ReactionPill
            key={token}
            token={token}
            count={count}
            mine={mine}
            onClick={() => togglePostReaction(channelId, post.id, token, myUid)}
          />
        ))}
        <button
          onClick={() => openPostComments(post.id)}
          className="flex items-center gap-1 h-6 px-2 rounded-full text-xs cursor-pointer border bg-black/20 border-white/15 text-zinc-400 hover:text-[#A78BFA] hover:border-[#A78BFA]/40 transition-colors"
        >
          <MessageCircle size={12} />
          <span className="font-medium leading-none">
            {post.commentCount || 0}
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setPickerOpenId(isPickerOpen ? null : post.id)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Plus size={13} />
          </button>
          {isPickerOpen && (
            <div className="absolute z-30 bottom-full mb-2 left-0 flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50">
              {REACTION_EMOJIS.map((token) => (
                <button
                  key={token}
                  onClick={() => {
                    togglePostReaction(channelId, post.id, token, myUid);
                    setPickerOpenId(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer text-lg"
                >
                  {token}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function ConfirmDialog({
    icon,
    title,
    description,
    onCancel,
    onConfirm,
    confirmLabel = "Delete",
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
  }) {
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [onCancel]);

    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <div
          className="w-80 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              {icon}
            </div>
            <h3 className="text-[15px] font-semibold text-white mb-1">
              {title}
            </h3>
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

  async function confirmDelete() {
    if (!channelId || !deleteConfirmId) return;
    await deleteChannelPost(channelId, deleteConfirmId);
    setDeleteConfirmId(null);
  }

  async function confirmDeleteChat() {
    if (!channelId) return;
    await updateDoc(doc(db, "channels", channelId), {
      [`deleted.${myUid}`]: true,
    });
    useChannelStore.getState().setActiveChannel(null);
    setDeleteChannelConfirm(false);
  }

  if (!channel) return null;

  return (
    <div
      className="flex flex-col w-full h-full"
      style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
    >
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.5); }
      `}</style>

      <div className="flex-none flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#0c121a]">
        <div
          onClick={() => setInfoModalOpen(true)}
          className="flex items-center gap-3 min-w-0 cursor-pointer rounded-lg -mx-2 px-2 py-1 hover:bg-white/[0.04] transition-colors"
        >
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-sm font-semibold">
            {channel.avatarUrl ? (
              <img
                src={channel.avatarUrl}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              channel.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white truncate">
              {channel.name}
              <Megaphone size={12} className="text-[#A78BFA] shrink-0" />
            </div>
            <div className="text-[11px] text-zinc-500">
              {channel.subscriberCount} subscribers
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && (
            <button
              onClick={toggleSub}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                isSub
                  ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-red-400/30 hover:text-red-400"
                  : "bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/25 hover:bg-[#A78BFA]/25"
              }`}
            >
              {isSub ? "Unsubscribe" : "Subscribe"}
            </button>
          )}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#0d0b14] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteChannelConfirm(true);
                    }}
                    className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete channel
                  </button>
                </div>
              )}
              {deleteConfirmId && (
                <ConfirmDialog
                  icon={<Trash2 size={18} className="text-red-400" />}
                  title="Delete message?"
                  description="This action cannot be undone. The message will be permanently removed for everyone."
                  onCancel={() => setDeleteConfirmId(null)}
                  onConfirm={confirmDelete}
                  confirmLabel="Delete"
                />
              )}
              {deleteChannelConfirm && (
                <ConfirmDialog
                  icon={<Trash2 size={18} className="text-red-400" />}
                  title="Delete chat?"
                  description="This will permanently delete the entire conversation. This action cannot be undone."
                  onCancel={() => setDeleteChannelConfirm(false)}
                  onConfirm={confirmDeleteChat}
                  confirmLabel="Delete"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="chat-scroll flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {posts.map((p) => {
          const isSticker =
            !p.text && p.imageUrl && isCustomEmojiUrl(p.imageUrl);

          if (isSticker) {
            return (
              <div
                key={p.id}
                className="relative group max-w-[420px] flex flex-col items-start gap-1.5"
              >
                <img
                  src={p.imageUrl!}
                  alt="sticker"
                  className="w-32 h-32 object-contain"
                />
                <div className="flex items-center gap-2 px-1">
                  <div className="text-[10px] text-zinc-500">
                    {formatTime(p.createdAt)}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="px-1">
                  <PostActionsBar post={p} />
                </div>
              </div>
            );
          }

          return (
            <div
              key={p.id}
              className="relative group max-w-[420px] rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{ background: "var(--color-msg-bg)" }}
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt="post"
                  className="w-full max-h-[360px] object-cover"
                />
              )}
              <div className="px-4 py-3">
                {p.text && (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {p.text}
                    {p.edited && (
                      <span className="text-[10px] ml-1 opacity-50">
                        (edited)
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[10px] text-zinc-500">
                    {formatTime(p.createdAt)}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="mt-2">
                  <PostActionsBar post={p} />
                </div>
              </div>
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center text-zinc-600 text-sm py-10">
            No posts yet
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isOwner && (
        <div className="flex-none border-t border-white/[0.06] bg-[#0d0b14] px-3 py-3">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img
                src={imagePreview}
                alt="preview"
                className="h-20 rounded-xl object-cover border border-white/[0.08]"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              title="Attach photo"
              className="shrink-0 cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 hover:text-[#A78BFA] hover:bg-[#A78BFA]/[0.08] transition-all hover:scale-105 active:scale-95"
            >
              <Paperclip size={16} />
            </button>

            <div className="relative shrink-0" ref={emojiPanelRef}>
              <button
                onClick={() => setEmojiPanelOpen((v) => !v)}
                title="Send a sticker"
                className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 hover:text-[#A78BFA] hover:bg-[#A78BFA]/[0.08] transition-all hover:scale-105 active:scale-95"
              >
                <Smile size={16} />
              </button>
              {emojiPanelOpen && (
                <div className="chat-scroll absolute z-30 bottom-full mb-2 left-0 grid grid-cols-4 gap-1.5 p-2.5 w-[220px] max-h-[210px] overflow-y-auto rounded-2xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50">
                  {CUSTOM_EMOJIS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => sendSticker(e.url)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                    >
                      <img
                        src={e.url}
                        alt={e.id}
                        className="w-9 h-9 object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Write a post…"
              className="flex-1 h-11 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 transition-all"
            />

            <button
              onClick={handlePost}
              disabled={(!text.trim() && !imageFile) || uploading}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #A78BFA, #7c3aed)",
              }}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} className="text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {infoModalOpen && (
        <ChannelInfoModal
          channel={channel}
          isOwner={isOwner}
          isSub={isSub}
          onClose={() => setInfoModalOpen(false)}
          onToggleSub={() => {
            toggleSub();
            setInfoModalOpen(false);
          }}
          onRequestDelete={() => {
            setInfoModalOpen(false);
            setDeleteChannelConfirm(true);
          }}
        />
      )}
    </div>
  );
}
