// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import { useChatStore } from "@/store/chat-store";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
// import {
//   subscribeToUserChats,
//   searchUsers,
//   createOrGetChat,
//   togglePinChat,
// } from "@/lib/firestore/chats";
// import ChatItem from "./ChatItem";
// import ProfileModal from "../profile-modal/ProfileModal";
// import { Settings, Search, UserCircle, Pin } from "lucide-react";
// import Link from "next/link";
// import { db } from "@/lib/firebase";
// import { doc, onSnapshot } from "firebase/firestore";

// interface CtxMenu {
//   chatId: string;
//   x: number;
//   y: number;
//   pinned: boolean;
// }

// export default function SideBar() {
//   const chats = useChatStore((s) => s.chats);
//   const setChats = useChatStore((s) => s.setChats);
//   const setActiveChat = useChatStore((s) => s.setActiveChat);
//   const { firebaseUser } = useCurrentUser();

//   const [query, setQuery] = useState("");
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
//   const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
//   const ctxRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = subscribeToUserChats(firebaseUser.uid, setChats);
//     return unsub;
//   }, [firebaseUser, setChats]);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
//       setPinnedChats(snap.data()?.pinnedChats || {});
//     });
//     return () => unsub();
//   }, [firebaseUser]);

//   useEffect(() => {
//     if (!query.trim()) {
//       setUsers([]);
//       return;
//     }
//     const timeout = setTimeout(async () => {
//       setLoading(true);
//       try {
//         const res = await searchUsers(query.trim());
//         setUsers(res.filter((u) => u.id !== firebaseUser?.uid));
//       } finally {
//         setLoading(false);
//       }
//     }, 300);
//     return () => clearTimeout(timeout);
//   }, [query, firebaseUser]);

//   useEffect(() => {
//     if (!ctxMenu) return;
//     function handleClick() {
//       setCtxMenu(null);
//     }
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [ctxMenu]);

//   async function openChat(otherUid: string) {
//     if (!firebaseUser) return;
//     const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
//     setActiveChat(chatId);
//     setQuery("");
//     setUsers([]);
//   }

//   function handleCtxMenu(e: React.MouseEvent, chatId: string) {
//     e.preventDefault();
//     setCtxMenu({
//       chatId,
//       x: e.clientX,
//       y: e.clientY,
//       pinned: !!pinnedChats[chatId],
//     });
//   }

//   async function handlePin() {
//     if (!ctxMenu || !firebaseUser) return;
//     await togglePinChat(firebaseUser.uid, ctxMenu.chatId, !ctxMenu.pinned);
//     setCtxMenu(null);
//   }

//   const visibleChats = chats.filter((c) => !c.deleted);
//   const pinned = visibleChats.filter((c) => pinnedChats[c.id]);
//   const unpinned = visibleChats.filter((c) => !pinnedChats[c.id]);
//   const sortedChats = [...pinned, ...unpinned];

//   return (
//     <>
//       <section className="h-full w-80 flex flex-col bg-[#0F1620] border-r border-[#1F2A37]">
//         <div className="p-5 border-b border-[#1F2A37]">
//           <h2 className="text-lg font-semibold text-white">Messages</h2>
//           <p className="text-xs text-zinc-400 mt-1">All conversations</p>
//         </div>

//         <div className="p-4 border-b border-[#1F2A37]">
//           <div className="relative">
//             <Search
//               size={16}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
//             />
//             <input
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search users..."
//               className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#1B2633] text-white outline-none border border-transparent focus:border-[#A78BFA] transition-all"
//             />
//           </div>
//         </div>

//         {query && (
//           <div className="border-b border-[#1F2A37]">
//             {loading && (
//               <p className="text-xs text-zinc-400 px-4 py-2">Searching...</p>
//             )}
//             {!loading &&
//               users.map((u) => (
//                 <button
//                   key={u.id}
//                   onClick={() => openChat(u.id)}
//                   className="w-full flex items-center gap-3 p-3 hover:bg-[#1B2633] transition-colors text-left"
//                 >
//                   {u.avatar ? (
//                     <img
//                       src={u.avatar}
//                       alt={u.username}
//                       className="w-9 h-9 rounded-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-9 h-9 rounded-full bg-[#A78BFA] flex items-center justify-center text-black font-semibold">
//                       {u.username?.[0]?.toUpperCase()}
//                     </div>
//                   )}
//                   <span className="text-sm text-white">{u.username}</span>
//                 </button>
//               ))}
//             {!loading && users.length === 0 && (
//               <p className="text-xs text-zinc-400 px-4 py-2">No users found</p>
//             )}
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto">
//           {sortedChats.length === 0 && (
//             <p className="text-zinc-400 text-sm p-4">
//               No chats yet. Search users above.
//             </p>
//           )}
//           <div className="divide-y divide-[#1F2A37]">
//             {sortedChats.map((chat) => (
//               <div
//                 key={chat.id}
//                 onContextMenu={(e) => handleCtxMenu(e, chat.id)}
//                 className="relative"
//               >
//                 <ChatItem chat={chat} pinned={!!pinnedChats[chat.id]} />
//               </div>
//             ))}
//           </div>
//         </div>

//         <div>
//           <Link
//             href="/settings"
//             className="flex items-center gap-3 p-4 border-t border-[#1F2A37] hover:bg-[#1B2633] transition-colors"
//           >
//             <Settings size={18} className="text-[#A78BFA]" />
//             <span className="text-sm text-zinc-200">Settings</span>
//           </Link>
//           <button
//             onClick={() => setShowProfile(true)}
//             className="flex items-center gap-3 p-4 border-t border-[#1F2A37] hover:bg-[#1B2633] transition-colors w-full text-left"
//           >
//             <div className="w-8 h-8 rounded-full bg-[#1B2633] border border-[#A78BFA]/30 flex items-center justify-center flex-shrink-0">
//               <UserCircle size={18} className="text-[#A78BFA]" />
//             </div>
//             <span className="text-sm text-zinc-200">Your profile</span>
//           </button>
//         </div>
//       </section>

//       {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

//       {ctxMenu && (
//         <div
//           ref={ctxRef}
//           style={{
//             position: "fixed",
//             top: ctxMenu.y,
//             left: ctxMenu.x,
//             zIndex: 999,
//           }}
//           className="min-w-[140px] rounded-xl bg-[#151D28] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <button
//             onClick={handlePin}
//             className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
//           >
//             <Pin size={13} className={ctxMenu.pinned ? "text-[#A78BFA]" : ""} />
//             {ctxMenu.pinned ? "Unpin chat" : "Pin chat"}
//           </button>
//         </div>
//       )}
//     </>
//   );
// }
// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useChatStore } from "@/store/chat-store";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
// import {
//   subscribeToUserChats,
//   searchUsers,
//   createOrGetChat,
//   togglePinChat,
// } from "@/lib/firestore/chats";
// import ChatItem from "./ChatItem";
// import ProfileModal from "../profile-modal/ProfileModal";
// import {
//   Settings,
//   Search,
//   UserCircle,
//   Pin,
//   Trash2,
//   CheckCheck,
// } from "lucide-react";
// import Link from "next/link";
// import { db } from "@/lib/firebase";
// import { doc, onSnapshot, updateDoc } from "firebase/firestore";
// import {
//   useThemeStore,
//   DEFAULT_DARK,
//   DEFAULT_LIGHT,
// } from "@/store/theme-store";

// interface CtxMenu {
//   chatId: string;
//   x: number;
//   y: number;
//   pinned: boolean;
// }

// export default function SideBar() {
//   const chats = useChatStore((s) => s.chats);
//   const setChats = useChatStore((s) => s.setChats);
//   const setActiveChat = useChatStore((s) => s.setActiveChat);
//   const { firebaseUser } = useCurrentUser();
//   const { mode, customTheme } = useThemeStore();

//   const theme =
//     mode === "dark"
//       ? DEFAULT_DARK
//       : mode === "light"
//       ? DEFAULT_LIGHT
//       : customTheme;

//   const [query, setQuery] = useState("");
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
//   const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
//   const [deleteChatConfirm, setDeleteChatConfirm] = useState<string | null>(
//     null
//   );
//   const ctxRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = subscribeToUserChats(firebaseUser.uid, setChats);
//     return unsub;
//   }, [firebaseUser, setChats]);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
//       setPinnedChats(snap.data()?.pinnedChats || {});
//     });
//     return () => unsub();
//   }, [firebaseUser]);

//   useEffect(() => {
//     if (!query.trim()) {
//       setUsers([]);
//       return;
//     }
//     const timeout = setTimeout(async () => {
//       setLoading(true);
//       try {
//         const res = await searchUsers(query.trim());
//         setUsers(res.filter((u) => u.id !== firebaseUser?.uid));
//       } finally {
//         setLoading(false);
//       }
//     }, 300);
//     return () => clearTimeout(timeout);
//   }, [query, firebaseUser]);

//   useEffect(() => {
//     if (!ctxMenu) return;
//     function handleClick() {
//       setCtxMenu(null);
//     }
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [ctxMenu]);

//   useEffect(() => {
//     if (!deleteChatConfirm) return;
//     const handler = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setDeleteChatConfirm(null);
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [deleteChatConfirm]);

//   async function openChat(otherUid: string) {
//     if (!firebaseUser) return;
//     const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
//     setActiveChat(chatId);
//     setQuery("");
//     setUsers([]);
//   }

//   function handleCtxMenu(e: React.MouseEvent, chatId: string) {
//     e.preventDefault();
//     setCtxMenu({
//       chatId,
//       x: e.clientX,
//       y: e.clientY,
//       pinned: !!pinnedChats[chatId],
//     });
//   }

//   async function handlePin() {
//     if (!ctxMenu || !firebaseUser) return;
//     await togglePinChat(firebaseUser.uid, ctxMenu.chatId, !ctxMenu.pinned);
//     setCtxMenu(null);
//   }

//   async function handleMarkRead(chatId: string) {
//     if (!firebaseUser) return;
//     await updateDoc(doc(db, "chats", chatId), {
//       [`unreadCount.${firebaseUser.uid}`]: 0,
//     });
//     setCtxMenu(null);
//   }

//   async function confirmDeleteChat() {
//     if (!deleteChatConfirm || !firebaseUser) return;
//     await updateDoc(doc(db, "chats", deleteChatConfirm), {
//       [`deleted.${firebaseUser.uid}`]: true,
//     });
//     useChatStore.getState().setActiveChat(null);
//     setDeleteChatConfirm(null);
//   }

//   const visibleChats = chats.filter((c) => !c.deleted);
//   const pinned = visibleChats.filter((c) => pinnedChats[c.id]);
//   const unpinned = visibleChats.filter((c) => !pinnedChats[c.id]);
//   const sortedChats = [...pinned, ...unpinned];

//   const accent = "#A78BFA";
//   const border = mode === "light" ? "#d1d5db" : "#1F2A37";
//   const inputBg = mode === "light" ? "#e5e7eb" : "#1B2633";
//   const hoverBg = mode === "light" ? "#e5e7eb" : "#1B2633";
//   const subText = mode === "light" ? "#6b7280" : "#a1a1aa";
//   const menuText = mode === "light" ? "#374151" : "#d4d4d8";
//   const menuDivider = mode === "light" ? "#e5e7eb" : "rgba(255,255,255,0.06)";

//   return (
//     <>
//       <section
//         className="h-full w-80 flex flex-col border-r transition-colors duration-200"
//         style={{
//           background: theme.sideBarBg,
//           borderColor: border,
//           color: theme.text,
//         }}
//       >
//         <div
//           className="p-5 border-b transition-colors duration-200"
//           style={{ borderColor: border }}
//         >
//           <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
//             Messages
//           </h2>
//           <p className="text-xs mt-1" style={{ color: subText }}>
//             All conversations
//           </p>
//         </div>

//         <div
//           className="p-4 border-b transition-colors duration-200"
//           style={{ borderColor: border }}
//         >
//           <div className="relative">
//             <Search
//               size={16}
//               className="absolute left-3 top-1/2 -translate-y-1/2"
//               style={{ color: subText }}
//             />
//             <input
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search users..."
//               className="w-full pl-10 pr-3 py-2 rounded-xl outline-none border border-transparent focus:border-[#A78BFA] transition-all"
//               style={{ background: inputBg, color: theme.text }}
//             />
//           </div>
//         </div>

//         {query && (
//           <div
//             className="border-b transition-colors duration-200"
//             style={{ borderColor: border }}
//           >
//             {loading && (
//               <p className="text-xs px-4 py-2" style={{ color: subText }}>
//                 Searching...
//               </p>
//             )}
//             {!loading &&
//               users.map((u) => (
//                 <button
//                   key={u.id}
//                   onClick={() => openChat(u.id)}
//                   className="w-full flex items-center gap-3 p-3 transition-colors text-left"
//                   style={{ color: theme.text }}
//                   onMouseEnter={(e) =>
//                     (e.currentTarget.style.background = hoverBg)
//                   }
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.background = "transparent")
//                   }
//                 >
//                   {u.avatar ? (
//                     <img
//                       src={u.avatar}
//                       alt={u.username}
//                       className="w-9 h-9 rounded-full object-cover"
//                     />
//                   ) : (
//                     <div
//                       className="w-9 h-9 rounded-full flex items-center justify-center text-black font-semibold"
//                       style={{ background: accent }}
//                     >
//                       {u.username?.[0]?.toUpperCase()}
//                     </div>
//                   )}
//                   <span className="text-sm">{u.username}</span>
//                 </button>
//               ))}
//             {!loading && users.length === 0 && (
//               <p className="text-xs px-4 py-2" style={{ color: subText }}>
//                 No users found
//               </p>
//             )}
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto">
//           {sortedChats.length === 0 && (
//             <p className="text-sm p-4" style={{ color: subText }}>
//               No chats yet. Search users above.
//             </p>
//           )}
//           <div>
//             {sortedChats.map((chat) => (
//               <div
//                 key={chat.id}
//                 onContextMenu={(e) => handleCtxMenu(e, chat.id)}
//                 className="relative"
//                 style={{ borderTop: `1px solid ${border}` }}
//               >
//                 <ChatItem chat={chat} pinned={!!pinnedChats[chat.id]} />
//               </div>
//             ))}
//           </div>
//         </div>

//         <div>
//           <Link
//             href="/settings"
//             className="flex font-bold items-center gap-3 p-4 border-t transition-colors"
//             style={{ borderColor: border, color: theme.text }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <Settings size={18} style={{ color: accent }} />
//             <span className="text-sm">Settings</span>
//           </Link>
//           <button
//             onClick={() => setShowProfile(true)}
//             className="flex items-center gap-3 p-2 border-t cursor-pointer transition-colors w-full text-left"
//             style={{ borderColor: border, color: theme.text }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <div
//               className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
//               style={{ background: inputBg, border: `1px solid ${accent}4D` }}
//             >
//               <UserCircle size={18} style={{ color: accent }} />
//             </div>
//             <span className="text-sm font-bold">Your profile</span>
//           </button>
//         </div>
//       </section>

//       {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

//       {/* context menu */}
//       {ctxMenu && (
//         <div
//           ref={ctxRef}
//           style={{
//             position: "fixed",
//             top: ctxMenu.y,
//             left: ctxMenu.x,
//             zIndex: 999,
//             background: mode === "light" ? "#ffffff" : "#151D28",
//           }}
//           className="min-w-[168px] rounded-xl border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <button
//             onClick={handlePin}
//             className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
//             style={{ color: menuText }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <Pin
//               size={13}
//               style={{ color: ctxMenu.pinned ? accent : "inherit" }}
//             />
//             {ctxMenu.pinned ? "Unpin chat" : "Pin chat"}
//           </button>
//           <button
//             onClick={() => handleMarkRead(ctxMenu.chatId)}
//             className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
//             style={{ color: menuText }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <CheckCheck size={13} />
//             Mark as read
//           </button>
//           <div
//             style={{ height: 1, background: menuDivider, margin: "2px 0" }}
//           />
//           <button
//             onClick={() => {
//               setDeleteChatConfirm(ctxMenu.chatId);
//               setCtxMenu(null);
//             }}
//             className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer text-red-400"
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <Trash2 size={13} className="text-red-400/70" />
//             Delete chat
//           </button>
//         </div>
//       )}

//       {/* delete chat confirm */}
//       {deleteChatConfirm && (
//         <div
//           className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
//           onClick={() => setDeleteChatConfirm(null)}
//         >
//           <div
//             className="w-[320px] rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="px-6 pt-6 pb-4">
//               <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
//                 <Trash2 size={18} className="text-red-400" />
//               </div>
//               <h3 className="text-[15px] font-semibold text-white mb-1">
//                 Delete chat?
//               </h3>
//               <p className="text-[13px] text-zinc-400 leading-relaxed">
//                 This will permanently delete the entire conversation. This
//                 action cannot be undone.
//               </p>
//             </div>
//             <div className="flex border-t border-white/[0.06]">
//               <button
//                 onClick={() => setDeleteChatConfirm(null)}
//                 className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDeleteChat}
//                 className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
"use client";

import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import { useChannelStore } from "@/store/channel-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  subscribeToUserChats,
  searchUsers,
  createOrGetChat,
  togglePinChat,
} from "@/lib/firestore/chats";
import { subscribeToMyChannels } from "@/lib/firestore/channels";
import { mergeConversations } from "@/lib/mergeConversations";
import { Channel } from "@/types/channel";
import ChatItem from "./ChatItem";
import ChannelItem from "../channel/ChannelItem";
import CreateChannelModal from "../channel/CreateChannelModal";
import ChannelSearchModal from "../channel/ChannelSearchModal";
import ProfileModal from "../profile-modal/ProfileModal";
import {
  Settings,
  Search,
  UserCircle,
  Pin,
  Trash2,
  CheckCheck,
  Megaphone,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";

interface CtxMenu {
  chatId: string;
  x: number;
  y: number;
  pinned: boolean;
}

export default function SideBar() {
  const chats = useChatStore((s) => s.chats);
  const setChats = useChatStore((s) => s.setChats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
  const { firebaseUser } = useCurrentUser();
  const { mode, customTheme } = useThemeStore();

  const theme =
    mode === "dark"
      ? DEFAULT_DARK
      : mode === "light"
      ? DEFAULT_LIGHT
      : customTheme;

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
  const [myUsername, setMyUsername] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [deleteChatConfirm, setDeleteChatConfirm] = useState<string | null>(
    null
  );
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [searchChannelOpen, setSearchChannelOpen] = useState(false);
  const ctxRef = useRef<HTMLDivElement | null>(null);
  const channelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToUserChats(firebaseUser.uid, setChats);
    return unsub;
  }, [firebaseUser, setChats]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToMyChannels(firebaseUser.uid, setMyChannels);
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      setPinnedChats(snap.data()?.pinnedChats || {});
      setMyUsername(snap.data()?.username || "");
    });
    return () => unsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(query.trim());
        setUsers(res.filter((u) => u.id !== firebaseUser?.uid));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, firebaseUser]);

  useEffect(() => {
    if (!ctxMenu) return;
    function handleClick() {
      setCtxMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [ctxMenu]);

  useEffect(() => {
    if (!deleteChatConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteChatConfirm(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteChatConfirm]);

  useEffect(() => {
    if (!channelMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        channelMenuRef.current &&
        !channelMenuRef.current.contains(e.target as Node)
      )
        setChannelMenuOpen(false);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [channelMenuOpen]);

  async function openChat(otherUid: string) {
    if (!firebaseUser) return;
    const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
    setActiveChat(chatId);
    setQuery("");
    setUsers([]);
  }

  function handleCtxMenu(e: React.MouseEvent, chatId: string) {
    e.preventDefault();
    setCtxMenu({
      chatId,
      x: e.clientX,
      y: e.clientY,
      pinned: !!pinnedChats[chatId],
    });
  }

  async function handlePin() {
    if (!ctxMenu || !firebaseUser) return;
    await togglePinChat(firebaseUser.uid, ctxMenu.chatId, !ctxMenu.pinned);
    setCtxMenu(null);
  }

  async function handleMarkRead(chatId: string) {
    if (!firebaseUser) return;
    await updateDoc(doc(db, "chats", chatId), {
      [`unreadCount.${firebaseUser.uid}`]: 0,
    });
    setCtxMenu(null);
  }

  async function confirmDeleteChat() {
    if (!deleteChatConfirm || !firebaseUser) return;
    await updateDoc(doc(db, "chats", deleteChatConfirm), {
      [`deleted.${firebaseUser.uid}`]: true,
    });
    useChatStore.getState().setActiveChat(null);
    setDeleteChatConfirm(null);
  }

  function openChannel(channelId: string) {
    setActiveChannel(channelId);
  }

  const visibleChats = chats.filter((c) => !c.deleted);
  const pinned = visibleChats.filter((c) => pinnedChats[c.id]);
  const unpinned = visibleChats.filter((c) => !pinnedChats[c.id]);
  const mergedList = mergeConversations(unpinned, myChannels);

  const accent = "#A78BFA";
  const border = mode === "light" ? "#d1d5db" : "#1F2A37";
  const inputBg = mode === "light" ? "#e5e7eb" : "#1B2633";
  const hoverBg = mode === "light" ? "#e5e7eb" : "#1B2633";
  const subText = mode === "light" ? "#6b7280" : "#a1a1aa";
  const menuText = mode === "light" ? "#374151" : "#d4d4d8";
  const menuDivider = mode === "light" ? "#e5e7eb" : "rgba(255,255,255,0.06)";

  return (
    <>
      <section
        className="h-full w-80 flex flex-col border-r transition-colors duration-200"
        style={{
          background: theme.sideBarBg,
          borderColor: border,
          color: theme.text,
        }}
      >
        <div
          className="p-5 border-b transition-colors duration-200"
          style={{ borderColor: border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            Messages
          </h2>
          <p className="text-xs mt-1" style={{ color: subText }}>
            All conversations
          </p>
        </div>

        <div
          className="p-4 border-b transition-colors duration-200"
          style={{ borderColor: border }}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: subText }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2 rounded-xl outline-none border border-transparent focus:border-[#A78BFA] transition-all"
                style={{ background: inputBg, color: theme.text }}
              />
            </div>
            <div className="relative shrink-0" ref={channelMenuRef}>
              <button
                onClick={() => setChannelMenuOpen((v) => !v)}
                title="Channels"
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                style={{ background: inputBg, color: accent }}
              >
                <Megaphone size={16} />
              </button>
              {channelMenuOpen && (
                <div
                  className="absolute right-0 top-11 w-48 rounded-xl border shadow-xl shadow-black/40 overflow-hidden z-50"
                  style={{
                    background: mode === "light" ? "#ffffff" : "#0d0b14",
                    borderColor: border,
                  }}
                >
                  <button
                    onClick={() => {
                      setCreateChannelOpen(true);
                      setChannelMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: menuText }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Plus size={14} />
                    Создать канал
                  </button>
                  <button
                    onClick={() => {
                      setSearchChannelOpen(true);
                      setChannelMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: menuText }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Search size={14} />
                    Найти канал
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {query && (
          <div
            className="border-b transition-colors duration-200"
            style={{ borderColor: border }}
          >
            {loading && (
              <p className="text-xs px-4 py-2" style={{ color: subText }}>
                Searching...
              </p>
            )}
            {!loading &&
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openChat(u.id)}
                  className="w-full flex items-center gap-3 p-3 transition-colors text-left"
                  style={{ color: theme.text }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = hoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.username}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black font-semibold"
                      style={{ background: accent }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm">{u.username}</span>
                </button>
              ))}
            {!loading && users.length === 0 && (
              <p className="text-xs px-4 py-2" style={{ color: subText }}>
                No users found
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {pinned.length === 0 && mergedList.length === 0 && (
            <p className="text-sm p-4" style={{ color: subText }}>
              No chats yet. Search users above.
            </p>
          )}
          <div>
            {pinned.map((chat) => (
              <div
                key={chat.id}
                onContextMenu={(e) => handleCtxMenu(e, chat.id)}
                className="relative"
                style={{ borderTop: `1px solid ${border}` }}
              >
                <ChatItem chat={chat} pinned />
              </div>
            ))}
            {mergedList.map((item) =>
              item.type === "chat" ? (
                <div
                  key={item.id}
                  onContextMenu={(e) => handleCtxMenu(e, item.id)}
                  className="relative"
                  style={{ borderTop: `1px solid ${border}` }}
                >
                  <ChatItem chat={item.data} pinned={false} />
                </div>
              ) : (
                <div
                  key={item.id}
                  className="relative px-2"
                  style={{ borderTop: `1px solid ${border}` }}
                >
                  <ChannelItem
                    channel={item.data}
                    active={activeChannelId === item.id}
                    onClick={() => openChannel(item.id)}
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <Link
            href="/settings"
            className="flex font-bold items-center gap-3 p-4 border-t transition-colors"
            style={{ borderColor: border, color: theme.text }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Settings size={18} style={{ color: accent }} />
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 p-2 border-t cursor-pointer transition-colors w-full text-left"
            style={{ borderColor: border, color: theme.text }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: inputBg, border: `1px solid ${accent}4D` }}
            >
              <UserCircle size={18} style={{ color: accent }} />
            </div>
            <span className="text-sm font-bold">Your profile</span>
          </button>
        </div>
      </section>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {createChannelOpen && firebaseUser && (
        <CreateChannelModal
          uid={firebaseUser.uid}
          username={myUsername}
          onClose={() => setCreateChannelOpen(false)}
          onCreated={(channelId) => setActiveChannel(channelId)}
        />
      )}

      {searchChannelOpen && firebaseUser && (
        <ChannelSearchModal
          uid={firebaseUser.uid}
          myChannelIds={new Set(myChannels.map((c) => c.id))}
          onClose={() => setSearchChannelOpen(false)}
          onOpenChannel={(channelId) => {
            setActiveChannel(channelId);
            setSearchChannelOpen(false);
          }}
        />
      )}

      {/* context menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 999,
            background: mode === "light" ? "#ffffff" : "#151D28",
          }}
          className="min-w-[168px] rounded-xl border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handlePin}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
            style={{ color: menuText }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Pin
              size={13}
              style={{ color: ctxMenu.pinned ? accent : "inherit" }}
            />
            {ctxMenu.pinned ? "Unpin chat" : "Pin chat"}
          </button>
          <button
            onClick={() => handleMarkRead(ctxMenu.chatId)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
            style={{ color: menuText }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <CheckCheck size={13} />
            Mark as read
          </button>
          <div
            style={{ height: 1, background: menuDivider, margin: "2px 0" }}
          />
          <button
            onClick={() => {
              setDeleteChatConfirm(ctxMenu.chatId);
              setCtxMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer text-red-400"
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Trash2 size={13} className="text-red-400/70" />
            Delete chat
          </button>
        </div>
      )}

      {/* delete chat confirm */}
      {deleteChatConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteChatConfirm(null)}
        >
          <div
            className="w-[320px] rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-1">
                Delete chat?
              </h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                This will permanently delete the entire conversation. This
                action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-white/[0.06]">
              <button
                onClick={() => setDeleteChatConfirm(null)}
                className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
