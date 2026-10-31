// "use client";

// import { useEffect, useMemo, useState, useRef } from "react";
// import { useChatStore } from "@/store/chat-store";
// import { useChannelStore } from "@/store/channel-store";
// import { useGroupStore } from "@/store/group-store";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
// import {
//   subscribeToUserChats,
//   searchUsers,
//   createOrGetChat,
//   togglePinChat,
// } from "@/lib/firestore/chats";
// import {
//   subscribeToMyChannels,
//   togglePinChannel,
//   unsubscribeFromChannel,
//   deleteChannel,
// } from "@/lib/firestore/channels";
// import {
//   togglePinGroup,
//   leaveGroup,
//   deleteGroup,
// } from "@/lib/firestore/groups";
// import { setConversationOrder } from "@/lib/firestore/order";
// import {
//   buildConversationItems,
//   sortConversationItems,
//   sortByRecency,
//   ConversationItem,
// } from "@/lib/mergeConversations";
// import { Channel } from "@/types/channel";
// import { Group } from "@/types/group";
// import ChatItem from "./ChatItem";
// import ChannelItem from "../channel/ChannelItem";
// import GroupItem from "../group/groupItem";
// import CreateChannelModal from "../channel/CreateChannelModal";
// import ChannelSearchModal from "../channel/ChannelSearchModal";
// import ProfileModal from "../profile-modal/ProfileModal";
// import CreateGroupModal from "../group/createGroupModal";
// import UserProfileModal from "../profile-modal/UserProfileModal";
// import {
//   Settings,
//   Search,
//   UserCircle,
//   Pin,
//   Trash2,
//   CheckCheck,
//   Megaphone,
//   Plus,
//   ChevronsRight,
//   LogOut,
//   Users,
//   MessagesSquare,
//   X,
// } from "lucide-react";
// import Link from "next/link";
// import { db } from "@/lib/firebase";
// import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
// import {
//   useThemeStore,
//   DEFAULT_DARK,
//   DEFAULT_LIGHT,
// } from "@/store/theme-store";
// import { useWindowVisibilityStore } from "@/store/window-visibility-store";
// import { openConversation } from "@/lib/mergeConversations";
// import SmoothImage from "@/components/UI/SmoothImage";
// import { avatarThumb } from "@/lib/avatarThumb";
// import SidebarSkeleton from "./SidebarSkeleton";

// interface CtxMenu {
//   type: "chat" | "channel" | "group";
//   id: string;
//   x: number;
//   y: number;
//   pinned: boolean;
//   isOwner?: boolean;
// }

// interface DeleteConfirm {
//   type: "chat" | "channel" | "group";
//   id: string;
//   isOwner?: boolean;
// }

// export default function SideBar() {
//   const chats = useChatStore((s) => s.chats);
//   const setChats = useChatStore((s) => s.setChats);
//   const setActiveChat = useChatStore((s) => s.setActiveChat);
//   const activeChannelId = useChannelStore((s) => s.activeChannelId);
//   const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
//   const activeGroupId = useGroupStore((s) => s.activeGroupId);
//   const setActiveGroup = useGroupStore((s) => s.setActiveGroup);
//   const groups = useGroupStore((s) => s.groups);
//   const groupsLoaded = useGroupStore((s) => s.groupsLoaded);
//   const initGroups = useGroupStore((s) => s.initGroups);
//   const disposeGroups = useGroupStore((s) => s.disposeGroups);
//   const { firebaseUser } = useCurrentUser();
//   const { mode, customTheme } = useThemeStore();

//   const theme =
//     mode === "dark"
//       ? DEFAULT_DARK
//       : mode === "light"
//         ? DEFAULT_LIGHT
//         : customTheme;

//   const [query, setQuery] = useState("");
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
//   const [pinnedChannels, setPinnedChannels] = useState<Record<string, boolean>>(
//     {}
//   );
//   const [pinnedGroups, setPinnedGroups] = useState<Record<string, boolean>>({});
//   const [order, setOrder] = useState<Record<string, number>>({});
//   const [myUsername, setMyUsername] = useState("");
//   const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
//   const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(
//     null
//   );
//   const [myChannels, setMyChannels] = useState<Channel[]>([]);
//   const [chatsLoadedFor, setChatsLoadedFor] = useState<string | null>(null);
//   const [channelsLoadedFor, setChannelsLoadedFor] = useState<string | null>(
//     null
//   );
//   const [userDocLoadedFor, setUserDocLoadedFor] = useState<string | null>(null);
//   const [channelMenuOpen, setChannelMenuOpen] = useState(false);
//   const [createChannelOpen, setCreateChannelOpen] = useState(false);
//   const [searchChannelOpen, setSearchChannelOpen] = useState(false);
//   const [createGroupOpen, setCreateGroupOpen] = useState(false);

//   const [draggedId, setDraggedId] = useState<string | null>(null);
//   const [dragOverId, setDragOverId] = useState<string | null>(null);

//   const [profileUser, setProfileUser] = useState<any | null>(null);

//   const ctxRef = useRef<HTMLDivElement | null>(null);
//   const channelMenuRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (typeof window.electronAPI?.onWindowVisibilityChange === "function") {
//       window.electronAPI.onWindowVisibilityChange((visible) => {
//         useWindowVisibilityStore.getState().setVisible(visible);
//       });
//     } else {
//       console.warn("electronAPI.onWindowVisibilityChange missing", {
//         hasElectronAPI: !!window.electronAPI,
//         keys: window.electronAPI ? Object.keys(window.electronAPI) : null,
//       });
//     }
//   }, []);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = subscribeToUserChats(
//       firebaseUser.uid,
//       (nextChats) => {
//         setChats(nextChats);
//         setChatsLoadedFor(firebaseUser.uid);
//       },
//       (payload) => {
//         const { activeChatId } = useChatStore.getState();
//         const isThisChatOpen = activeChatId === payload.chatId;
//         const isWindowVisible = useWindowVisibilityStore.getState().isVisible;

//         if (isThisChatOpen && isWindowVisible) {
//           return;
//         }

//         window.electronAPI?.notifyNewMessage({
//           title: payload.senderName,
//           body: payload.text,
//           chatId: payload.chatId,
//         });
//       }
//     );
//     return unsub;
//   }, [firebaseUser, setChats]);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = subscribeToMyChannels(
//       firebaseUser.uid,
//       setMyChannels,
//       () => setChannelsLoadedFor(firebaseUser.uid)
//     );
//     return unsub;
//   }, [firebaseUser]);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     initGroups(firebaseUser.uid);
//     return () => disposeGroups();
//   }, [firebaseUser, initGroups, disposeGroups]);

//   useEffect(() => {
//     if (!firebaseUser) return;
//     const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
//       const data = snap.data();
//       setPinnedChats(data?.pinnedChats || {});
//       setPinnedChannels(data?.pinnedChannels || {});
//       setPinnedGroups(data?.pinnedGroups || {});
//       setOrder(data?.order || {});
//       setMyUsername(data?.username || "");
//       setUserDocLoadedFor(firebaseUser.uid);
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
//     if (!deleteConfirm) return;
//     const handler = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setDeleteConfirm(null);
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [deleteConfirm]);

//   useEffect(() => {
//     if (!channelMenuOpen) return;
//     function handleClick(e: MouseEvent) {
//       if (
//         channelMenuRef.current &&
//         !channelMenuRef.current.contains(e.target as Node)
//       )
//         setChannelMenuOpen(false);
//     }
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [channelMenuOpen]);

//   useEffect(() => {
//     window.electronAPI?.onOpenChat((chatId: string) => {
//       setActiveChat(chatId);
//     });
//   }, [setActiveChat]);

//   async function openChat(otherUid: string) {
//     if (!firebaseUser) return;
//     const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
//     openConversation("chat", chatId);
//     setQuery("");
//     setUsers([]);
//     setProfileUser(null);
//   }

//   async function openUserProfile(u: any) {
//     setProfileUser(u);
//     try {
//       const snap = await getDoc(doc(db, "users", u.id));
//       if (snap.exists()) setProfileUser({ id: u.id, ...snap.data() });
//     } catch {
//       return;
//     }
//   }

//   function handleCtxMenu(
//     e: React.MouseEvent,
//     type: "chat" | "channel" | "group",
//     id: string,
//     pinned: boolean,
//     isOwner?: boolean
//   ) {
//     e.preventDefault();
//     setCtxMenu({ type, id, x: e.clientX, y: e.clientY, pinned, isOwner });
//   }

//   async function handlePin() {
//     if (!ctxMenu || !firebaseUser) return;
//     if (ctxMenu.type === "chat") {
//       await togglePinChat(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
//     } else if (ctxMenu.type === "channel") {
//       await togglePinChannel(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
//     } else {
//       await togglePinGroup(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
//     }
//     setCtxMenu(null);
//   }

//   async function handleMarkRead(chatId: string) {
//     if (!firebaseUser) return;
//     await updateDoc(doc(db, "chats", chatId), {
//       [`unreadCount.${firebaseUser.uid}`]: 0,
//     });
//     setCtxMenu(null);
//   }

//   async function confirmDelete() {
//     if (!deleteConfirm || !firebaseUser) return;

//     if (deleteConfirm.type === "chat") {
//       await updateDoc(doc(db, "chats", deleteConfirm.id), {
//         [`deleted.${firebaseUser.uid}`]: true,
//       });
//       useChatStore.getState().setActiveChat(null);
//     } else if (deleteConfirm.type === "channel") {
//       if (deleteConfirm.isOwner) {
//         await deleteChannel(deleteConfirm.id);
//       } else {
//         await unsubscribeFromChannel(deleteConfirm.id, firebaseUser.uid);
//       }
//       if (activeChannelId === deleteConfirm.id) setActiveChannel(null);
//     } else {
//       if (deleteConfirm.isOwner) {
//         await deleteGroup(deleteConfirm.id);
//       } else {
//         await leaveGroup(deleteConfirm.id, firebaseUser.uid);
//       }
//       if (activeGroupId === deleteConfirm.id) setActiveGroup(null);
//     }

//     setDeleteConfirm(null);
//   }

//   async function handleDrop(bucketIds: string[]) {
//     if (
//       !draggedId ||
//       !dragOverId ||
//       !firebaseUser ||
//       draggedId === dragOverId
//     ) {
//       setDraggedId(null);
//       setDragOverId(null);
//       return;
//     }
//     const ids = [...bucketIds];
//     const from = ids.indexOf(draggedId);
//     const to = ids.indexOf(dragOverId);
//     setDraggedId(null);
//     setDragOverId(null);
//     if (from === -1 || to === -1) return;
//     ids.splice(from, 1);
//     ids.splice(to, 0, draggedId);
//     await setConversationOrder(firebaseUser.uid, ids);
//   }

//   const { pinnedList, mergedList } = useMemo(() => {
//     const visibleChats = chats.filter((chat) => !chat.deleted);
//     const allItems = buildConversationItems(visibleChats, myChannels, groups);
//     const isPinned = (item: ConversationItem) =>
//       item.type === "chat"
//         ? pinnedChats[item.id]
//         : item.type === "channel"
//           ? pinnedChannels[item.id]
//           : pinnedGroups[item.id];

//     return {
//       pinnedList: sortConversationItems(allItems.filter(isPinned), order),
//       mergedList: sortByRecency(allItems.filter((item) => !isPinned(item))),
//     };
//   }, [
//     chats,
//     groups,
//     myChannels,
//     order,
//     pinnedChannels,
//     pinnedChats,
//     pinnedGroups,
//   ]);

//   const chatsLoaded = chatsLoadedFor === firebaseUser?.uid;
//   const channelsLoaded = channelsLoadedFor === firebaseUser?.uid;
//   const userDocLoaded = userDocLoadedFor === firebaseUser?.uid;
//   const ready = chatsLoaded && channelsLoaded && groupsLoaded && userDocLoaded;

//   const isLight = mode === "light";
//   const accent = "#522fb7";
//   const accentSoft = "#8b6cff";
//   const border = isLight ? "#e5e7eb" : "rgba(255,255,255,0.06)";
//   const hoverBg = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
//   const subText = isLight ? "#6b7280" : "#9a96ad";
//   const mutedText = isLight ? "#9ca3af" : "#6f6a85";
//   const menuText = isLight ? "#1f2937" : "#e4e1ef";
//   const menuDivider = isLight ? "#eceef2" : "rgba(255,255,255,0.07)";
//   const fieldBg = isLight ? "#f1f2f6" : "rgba(255,255,255,0.05)";
//   const fieldFocusBg = isLight ? "#ffffff" : "rgba(255,255,255,0.08)";
//   const popBg = isLight ? "#ffffff" : "#16141f";
//   const popBorder = isLight ? "#e5e7eb" : "rgba(255,255,255,0.09)";
//   const popShadow = isLight
//     ? "0 16px 40px rgba(20,15,50,0.16), 0 2px 8px rgba(20,15,50,0.06)"
//     : "0 16px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)";
//   const chipBg = isLight ? "rgba(82,47,183,0.1)" : "rgba(139,108,255,0.14)";
//   const newBtnBg = channelMenuOpen
//     ? isLight
//       ? "rgba(82,47,183,0.08)"
//       : "rgba(82,47,183,0.14)"
//     : isLight
//       ? "#ffffff"
//       : "rgba(255,255,255,0.025)";
//   const newBtnBorder = channelMenuOpen
//     ? "rgba(139,108,255,0.35)"
//     : isLight
//       ? "#d9dce3"
//       : "rgba(255,255,255,0.07)";

//   function renderItem(
//     item: ConversationItem,
//     pinned: boolean,
//     bucket: ConversationItem[]
//   ) {
//     const isChannelOwner =
//       item.type === "channel" &&
//       (item.data as Channel).ownerId === firebaseUser?.uid;

//     const isGroupOwner =
//       item.type === "group" &&
//       (item.data as Group).ownerId === firebaseUser?.uid;

//     return (
//       <div
//         key={item.id}
//         draggable={pinned}
//         onDragStart={() => pinned && setDraggedId(item.id)}
//         onDragOver={(e) => {
//           if (!pinned) return;
//           e.preventDefault();
//           if (dragOverId !== item.id) setDragOverId(item.id);
//         }}
//         onDrop={() => pinned && handleDrop(bucket.map((i) => i.id))}
//         onDragEnd={() => {
//           setDraggedId(null);
//           setDragOverId(null);
//         }}
//         onContextMenu={(e) =>
//           item.type === "chat"
//             ? handleCtxMenu(e, "chat", item.id, pinned)
//             : item.type === "channel"
//               ? handleCtxMenu(e, "channel", item.id, pinned, isChannelOwner)
//               : handleCtxMenu(e, "group", item.id, pinned, isGroupOwner)
//         }
//         className="relative transition-opacity duration-150"
//         style={{
//           opacity: draggedId === item.id ? 0.4 : 1,
//           boxShadow:
//             dragOverId === item.id && draggedId !== item.id
//               ? `inset 0 2px 0 0 ${accentSoft}`
//               : undefined,
//         }}
//       >
//         {item.type === "chat" ? (
//           <ChatItem chat={item.data} pinned={pinned} />
//         ) : item.type === "channel" ? (
//           <ChannelItem channel={item.data as Channel} pinned={pinned} />
//         ) : (
//           <GroupItem group={item.data as Group} pinned={pinned} />
//         )}
//       </div>
//     );
//   }

//   const newMenuItems = [
//     {
//       key: "channel",
//       icon: <Megaphone size={15} />,
//       title: "New channel",
//       subtitle: "Broadcast to subscribers",
//       accented: true,
//       onClick: () => setCreateChannelOpen(true),
//     },
//     {
//       key: "group",
//       icon: <Users size={15} />,
//       title: "New group",
//       subtitle: "Chat with multiple people",
//       accented: true,
//       onClick: () => setCreateGroupOpen(true),
//     },
//     {
//       key: "find",
//       icon: <Search size={15} />,
//       title: "Find a channel",
//       subtitle: "Discover public channels",
//       accented: false,
//       onClick: () => setSearchChannelOpen(true),
//     },
//   ];

//   const sectionHeaderClass =
//     "sticky top-0 z-10 flex items-center justify-between px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]";

//   return (
//     <>
//       <style>{`
//         .sidebar-scroll::-webkit-scrollbar { width: 4px; }
//         .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
//         .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.2); border-radius: 999px; }
//         .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.45); }
//         .sb-field {
//           background: var(--sb-field-bg);
//           box-shadow: inset 0 0 0 1px transparent;
//           transition: background 0.18s ease, box-shadow 0.18s ease;
//         }
//         .sb-field:hover { box-shadow: inset 0 0 0 1px var(--sb-border); }
//         .sb-field:focus-within {
//           background: var(--sb-field-focus);
//           box-shadow: inset 0 0 0 1.5px var(--sb-accent-soft);
//         }
//         .sb-field input::placeholder { color: var(--sb-muted); }
//         .sb-new-btn { transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease; }
//         .sb-new-btn:hover { border-color: rgba(139,108,255,0.35); }
//         .sb-new-btn:active { transform: scale(0.985); }
//         .sb-pop { animation: sbPop 0.13s ease-out; transform-origin: top left; }
//         .sb-fade { animation: sbFade 0.15s ease; }
//         .sb-press { transition: background 0.15s ease, transform 0.12s ease; }
//         .sb-press:active { transform: scale(0.975); }
//         @keyframes sbPop {
//           from { opacity: 0; transform: scale(0.95) translateY(-3px); }
//           to { opacity: 1; transform: scale(1) translateY(0); }
//         }
//         @keyframes sbFade {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//       `}</style>

//       <section
//         className="sidebar-entrance w-full h-full flex flex-col overflow-x-hidden border-r transition-colors duration-200 relative"
//         style={
//           {
//             background: theme.sideBarBg,
//             borderColor: border,
//             color: theme.text,
//             "--sb-field-bg": fieldBg,
//             "--sb-field-focus": fieldFocusBg,
//             "--sb-border": border,
//             "--sb-accent-soft": accentSoft,
//             "--sb-muted": mutedText,
//           } as React.CSSProperties
//         }
//       >
//         <div className="px-4 pt-4 pb-3">
//           <div className="relative">
//             <div className="sb-field relative flex items-center w-full h-11 rounded-[15px]">
//               <Search
//                 size={16}
//                 className="absolute left-3.5 pointer-events-none"
//                 style={{ color: mutedText }}
//               />

//               <input
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search users..."
//                 className="w-full h-full pl-10 pr-10 rounded-[15px] outline-none bg-transparent text-[13.5px]"
//                 style={{ color: theme.text }}
//               />

//               {query ? (
//                 <button
//                   onClick={() => setQuery("")}
//                   className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer"
//                   style={{ color: subText }}
//                   onMouseEnter={(e) =>
//                     (e.currentTarget.style.background = hoverBg)
//                   }
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.background = "transparent")
//                   }
//                 >
//                   <X size={13} />
//                 </button>
//               ) : (
//                 <div
//                   className="absolute right-3 pointer-events-none flex items-center justify-center"
//                   style={{ color: mutedText }}
//                 >
//                   <UserCircle size={16} strokeWidth={1.7} />
//                 </div>
//               )}
//             </div>

//             <div className="relative mt-2.5" ref={channelMenuRef}>
//               <button
//                 onClick={() => setChannelMenuOpen((v) => !v)}
//                 className="sb-new-btn group w-full h-10 flex items-center justify-between rounded-[13px] px-3.5 border cursor-pointer"
//                 style={{
//                   background: newBtnBg,
//                   borderColor: newBtnBorder,
//                 }}
//               >
//                 <span className="flex items-center gap-2.5">
//                   <span
//                     className="flex h-6 w-6 items-center justify-center rounded-lg"
//                     style={{ background: chipBg, color: accentSoft }}
//                   >
//                     <Plus size={14} />
//                   </span>

//                   <span
//                     className="text-[13px] font-medium"
//                     style={{ color: menuText }}
//                   >
//                     New
//                   </span>
//                 </span>

//                 <ChevronsRight
//                   size={14}
//                   className={`transition-transform duration-200 ${channelMenuOpen ? "rotate-90" : ""
//                     }`}
//                   style={{ color: mutedText }}
//                 />
//               </button>

//               {channelMenuOpen && (
//                 <div
//                   className="sb-pop absolute left-0 right-0 top-[45px] rounded-[14px] border overflow-hidden z-50 p-1.5"
//                   style={{
//                     background: popBg,
//                     borderColor: popBorder,
//                     boxShadow: popShadow,
//                   }}
//                 >
//                   {newMenuItems.map((entry, index) => (
//                     <div key={entry.key}>
//                       {index === newMenuItems.length - 1 && (
//                         <div
//                           className="my-1.5 h-px"
//                           style={{ background: menuDivider }}
//                         />
//                       )}
//                       <button
//                         onClick={() => {
//                           entry.onClick();
//                           setChannelMenuOpen(false);
//                         }}
//                         className="sb-press w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left cursor-pointer"
//                         style={{ color: menuText }}
//                         onMouseEnter={(e) =>
//                           (e.currentTarget.style.background = hoverBg)
//                         }
//                         onMouseLeave={(e) =>
//                           (e.currentTarget.style.background = "transparent")
//                         }
//                       >
//                         <span
//                           className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
//                           style={{
//                             background: entry.accented ? chipBg : fieldBg,
//                             color: entry.accented ? accentSoft : mutedText,
//                           }}
//                         >
//                           {entry.icon}
//                         </span>

//                         <span className="flex flex-col leading-tight min-w-0">
//                           <span className="text-[13px] font-medium">
//                             {entry.title}
//                           </span>
//                           <span
//                             className="text-[11px] mt-0.5 truncate"
//                             style={{ color: mutedText }}
//                           >
//                             {entry.subtitle}
//                           </span>
//                         </span>
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {query && (
//           <div className="sb-fade border-y" style={{ borderColor: border }}>
//             {loading && (
//               <p className="text-xs px-4 py-3" style={{ color: subText }}>
//                 Searching...
//               </p>
//             )}
//             {!loading &&
//               users.map((u, index) => (
//                 <button
//                   key={u.id}
//                   onClick={() => openUserProfile(u)}
//                   className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer"
//                   style={{
//                     color: theme.text,
//                     borderTop:
//                       index === 0 ? "none" : `1px solid ${menuDivider}`,
//                   }}
//                   onMouseEnter={(e) =>
//                     (e.currentTarget.style.background = hoverBg)
//                   }
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.background = "transparent")
//                   }
//                 >
//                   {u.avatar ? (
//                     <SmoothImage
//                       src={avatarThumb(u.avatar, 72)}
//                       alt={u.username}
//                       width={36}
//                       height={36}
//                       className="w-9 h-9 rounded-full object-cover"
//                     />
//                   ) : (
//                     <div
//                       className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
//                       style={{ background: accent }}
//                     >
//                       {u.username?.[0]?.toUpperCase()}
//                     </div>
//                   )}
//                   <span className="text-[13.5px] font-medium truncate">
//                     {u.username}
//                   </span>
//                 </button>
//               ))}
//             {!loading && users.length === 0 && (
//               <p className="text-xs px-4 py-3" style={{ color: subText }}>
//                 No users found
//               </p>
//             )}
//           </div>
//         )}

//         <div className="sidebar-scroll flex-1 overflow-y-auto">
//           {!ready ? (
//             <SidebarSkeleton />
//           ) : pinnedList.length === 0 && mergedList.length === 0 ? (
//             <div className="sb-fade flex flex-col items-center justify-center gap-3 h-full text-center px-8 pb-10">
//               <div
//                 className="w-12 h-12 rounded-full flex items-center justify-center"
//                 style={{ background: chipBg }}
//               >
//                 <MessagesSquare size={20} style={{ color: accentSoft }} />
//               </div>
//               <div className="flex flex-col gap-1">
//                 <p
//                   className="text-[14px] font-semibold"
//                   style={{ color: theme.text }}
//                 >
//                   No chats yet
//                 </p>
//                 <p
//                   className="text-[12.5px] leading-relaxed"
//                   style={{ color: subText }}
//                 >
//                   Search users above to start a conversation.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className="pb-2">
//               {pinnedList.length > 0 && (
//                 <div
//                   className={sectionHeaderClass}
//                   style={{ color: mutedText, background: theme.sideBarBg }}
//                 >
//                   <span className="flex items-center gap-1.5">
//                     <Pin size={10} />
//                     Pinned
//                   </span>
//                   <span>{pinnedList.length}</span>
//                 </div>
//               )}
//               {pinnedList.map((item) => renderItem(item, true, pinnedList))}

//               {pinnedList.length > 0 && mergedList.length > 0 && (
//                 <div
//                   className={sectionHeaderClass}
//                   style={{ color: mutedText, background: theme.sideBarBg }}
//                 >
//                   <span>All chats</span>
//                   <span>{mergedList.length}</span>
//                 </div>
//               )}
//               {mergedList.map((item) => renderItem(item, false, mergedList))}
//             </div>
//           )}
//         </div>

//         <div
//           className="flex items-center gap-2 px-3 py-3 border-t"
//           style={{ borderColor: border }}
//         >
//           <button
//             onClick={() => setShowProfile(true)}
//             className="sb-press flex h-11 flex-1 min-w-0 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-left"
//             style={{ color: theme.text, background: fieldBg }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) => (e.currentTarget.style.background = fieldBg)}
//           >
//             <span
//               className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
//               style={{ background: chipBg }}
//             >
//               <UserCircle size={16} style={{ color: accentSoft }} />
//             </span>
//             <span className="text-[13.5px] font-medium truncate">
//               Your profile
//             </span>
//           </button>

//           <Link
//             href="/settings"
//             className="sb-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
//             style={{ color: subText, background: fieldBg }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.background = hoverBg;
//               e.currentTarget.style.color = accentSoft;
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.background = fieldBg;
//               e.currentTarget.style.color = subText;
//             }}
//             aria-label="Settings"
//           >
//             <Settings size={18} />
//           </Link>
//         </div>
//       </section>

//       {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

//       {createChannelOpen && firebaseUser && (
//         <CreateChannelModal
//           uid={firebaseUser.uid}
//           username={myUsername}
//           onClose={() => setCreateChannelOpen(false)}
//           onCreated={(channelId) => setActiveChannel(channelId)}
//         />
//       )}

//       {createGroupOpen && firebaseUser && (
//         <CreateGroupModal
//           uid={firebaseUser.uid}
//           username={myUsername}
//           contacts={chats.map((c) => ({
//             uid: c.participant.id,
//             username: c.participant.username,
//             avatarUrl: c.participant.avatar,
//           }))}
//           onClose={() => setCreateGroupOpen(false)}
//           onCreated={(groupId) => {
//             setActiveGroup(groupId);
//             setCreateGroupOpen(false);
//           }}
//         />
//       )}

//       {searchChannelOpen && firebaseUser && (
//         <ChannelSearchModal
//           uid={firebaseUser.uid}
//           myChannelIds={new Set(myChannels.map((c) => c.id))}
//           onClose={() => setSearchChannelOpen(false)}
//           onOpenChannel={(channelId) => {
//             setActiveChannel(channelId);
//             setSearchChannelOpen(false);
//           }}
//         />
//       )}

//       {profileUser && (
//         <UserProfileModal
//           user={profileUser}
//           onClose={() => setProfileUser(null)}
//           onWrite={() => openChat(profileUser.id)}
//         />
//       )}

//       {ctxMenu && (
//         <div
//           ref={ctxRef}
//           style={{
//             position: "fixed",
//             top: ctxMenu.y,
//             left: ctxMenu.x,
//             zIndex: 999,
//             background: popBg,
//             borderColor: popBorder,
//             boxShadow: popShadow,
//             transformOrigin: "top left",
//           }}
//           className="sb-pop min-w-[180px] rounded-xl border p-1"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <button
//             onClick={handlePin}
//             className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer"
//             style={{ color: menuText }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <Pin
//               size={14}
//               style={{ color: ctxMenu.pinned ? accentSoft : subText }}
//             />
//             {ctxMenu.pinned
//               ? ctxMenu.type === "chat"
//                 ? "Unpin chat"
//                 : ctxMenu.type === "channel"
//                   ? "Unpin channel"
//                   : "Unpin group"
//               : ctxMenu.type === "chat"
//                 ? "Pin chat"
//                 : ctxMenu.type === "channel"
//                   ? "Pin channel"
//                   : "Pin group"}
//           </button>

//           {ctxMenu.type === "chat" && (
//             <button
//               onClick={() => handleMarkRead(ctxMenu.id)}
//               className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer"
//               style={{ color: menuText }}
//               onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
//               onMouseLeave={(e) =>
//                 (e.currentTarget.style.background = "transparent")
//               }
//             >
//               <CheckCheck size={14} style={{ color: subText }} />
//               Mark as read
//             </button>
//           )}

//           <div
//             className="my-1 mx-1"
//             style={{ height: 1, background: menuDivider }}
//           />

//           <button
//             onClick={() => {
//               setDeleteConfirm({
//                 type: ctxMenu.type,
//                 id: ctxMenu.id,
//                 isOwner: ctxMenu.isOwner,
//               });
//               setCtxMenu(null);
//             }}
//             className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer text-red-400"
//             onMouseEnter={(e) =>
//               (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
//             }
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             {ctxMenu.type === "chat" ? (
//               <>
//                 <Trash2 size={14} />
//                 Delete chat
//               </>
//             ) : ctxMenu.type === "channel" ? (
//               ctxMenu.isOwner ? (
//                 <>
//                   <Trash2 size={14} />
//                   Delete channel
//                 </>
//               ) : (
//                 <>
//                   <LogOut size={14} />
//                   Leave channel
//                 </>
//               )
//             ) : ctxMenu.isOwner ? (
//               <>
//                 <Trash2 size={14} />
//                 Delete group
//               </>
//             ) : (
//               <>
//                 <LogOut size={14} />
//                 Leave group
//               </>
//             )}
//           </button>
//         </div>
//       )}

//       {deleteConfirm && (
//         <div
//           className="sb-fade fixed inset-0 z-[200] flex items-center justify-center bg-black/55 backdrop-blur-[3px]"
//           onClick={() => setDeleteConfirm(null)}
//         >
//           <div
//             className="sb-pop w-[320px] rounded-2xl border p-5 text-center"
//             style={{
//               background: popBg,
//               borderColor: popBorder,
//               boxShadow: popShadow,
//               transformOrigin: "center",
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div
//               className="mx-auto mb-3.5 w-11 h-11 rounded-full flex items-center justify-center"
//               style={{ background: "rgba(239,68,68,0.12)" }}
//             >
//               {(deleteConfirm.type === "channel" ||
//                 deleteConfirm.type === "group") &&
//                 !deleteConfirm.isOwner ? (
//                 <LogOut size={18} className="text-red-400" />
//               ) : (
//                 <Trash2 size={18} className="text-red-400" />
//               )}
//             </div>

//             <h3
//               className="text-[16px] font-semibold mb-1.5"
//               style={{ color: isLight ? "#111827" : "#ffffff" }}
//             >
//               {deleteConfirm.type === "chat"
//                 ? "Delete chat?"
//                 : deleteConfirm.type === "channel"
//                   ? deleteConfirm.isOwner
//                     ? "Delete channel?"
//                     : "Leave channel?"
//                   : deleteConfirm.isOwner
//                     ? "Delete group?"
//                     : "Leave group?"}
//             </h3>

//             <p
//               className="text-[13px] leading-relaxed mb-5"
//               style={{ color: subText }}
//             >
//               {deleteConfirm.type === "chat"
//                 ? "This will permanently delete the entire conversation. This action cannot be undone."
//                 : deleteConfirm.type === "channel"
//                   ? deleteConfirm.isOwner
//                     ? "This will permanently delete the channel for all subscribers. This action cannot be undone."
//                     : "You will stop receiving posts from this channel. You can subscribe again anytime."
//                   : deleteConfirm.isOwner
//                     ? "This will permanently delete the group for all members. This action cannot be undone."
//                     : "You will stop receiving messages from this group. You'll need a new invite to rejoin."}
//             </p>

//             <div className="flex flex-col gap-2">
//               <button
//                 onClick={confirmDelete}
//                 className="sb-press w-full h-10 rounded-xl text-sm font-semibold text-white cursor-pointer hover:brightness-110"
//                 style={{ background: "#ef4444" }}
//               >
//                 {(deleteConfirm.type === "channel" ||
//                   deleteConfirm.type === "group") &&
//                   !deleteConfirm.isOwner
//                   ? "Leave"
//                   : "Delete"}
//               </button>
//               <button
//                 onClick={() => setDeleteConfirm(null)}
//                 className="sb-press w-full h-10 rounded-xl text-sm font-medium cursor-pointer"
//                 style={{ color: menuText, background: fieldBg }}
//                 onMouseEnter={(e) =>
//                   (e.currentTarget.style.background = hoverBg)
//                 }
//                 onMouseLeave={(e) =>
//                   (e.currentTarget.style.background = fieldBg)
//                 }
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }


"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import { useChannelStore } from "@/store/channel-store";
import { useGroupStore } from "@/store/group-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  subscribeToUserChats,
  searchUsers,
  createOrGetChat,
  togglePinChat,
} from "@/lib/firestore/chats";
import {
  subscribeToMyChannels,
  togglePinChannel,
  unsubscribeFromChannel,
  deleteChannel,
} from "@/lib/firestore/channels";
import {
  togglePinGroup,
  leaveGroup,
  deleteGroup,
} from "@/lib/firestore/groups";
import { setConversationOrder } from "@/lib/firestore/order";
import {
  buildConversationItems,
  sortConversationItems,
  sortByRecency,
  ConversationItem,
} from "@/lib/mergeConversations";
import { ensureSavedChat, getSavedChatId, getSavedParticipant } from "@/lib/savedChat";
import { Chat } from "@/types/chat";
import { Channel } from "@/types/channel";
import { Group } from "@/types/group";
import ChatItem from "./ChatItem";
import ChannelItem from "../channel/ChannelItem";
import GroupItem from "../group/groupItem";
import CreateChannelModal from "../channel/CreateChannelModal";
import ChannelSearchModal from "../channel/ChannelSearchModal";
import ProfileModal from "../profile-modal/ProfileModal";
import CreateGroupModal from "../group/createGroupModal";
import UserProfileModal from "../profile-modal/UserProfileModal";
import {
  Settings,
  Search,
  UserCircle,
  Pin,
  Trash2,
  CheckCheck,
  Megaphone,
  Plus,
  ChevronsRight,
  LogOut,
  Users,
  MessagesSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";
import { openConversation } from "@/lib/mergeConversations";
import SmoothImage from "@/components/UI/SmoothImage";
import { avatarThumb } from "@/lib/avatarThumb";
import SidebarSkeleton from "./SidebarSkeleton";

interface CtxMenu {
  type: "chat" | "channel" | "group";
  id: string;
  x: number;
  y: number;
  pinned: boolean;
  isOwner?: boolean;
}

interface DeleteConfirm {
  type: "chat" | "channel" | "group";
  id: string;
  isOwner?: boolean;
}

export default function SideBar() {
  const chats = useChatStore((s) => s.chats);
  const setChats = useChatStore((s) => s.setChats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
  const activeGroupId = useGroupStore((s) => s.activeGroupId);
  const setActiveGroup = useGroupStore((s) => s.setActiveGroup);
  const groups = useGroupStore((s) => s.groups);
  const groupsLoaded = useGroupStore((s) => s.groupsLoaded);
  const initGroups = useGroupStore((s) => s.initGroups);
  const disposeGroups = useGroupStore((s) => s.disposeGroups);
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
  const [pinnedChannels, setPinnedChannels] = useState<Record<string, boolean>>(
    {}
  );
  const [pinnedGroups, setPinnedGroups] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<Record<string, number>>({});
  const [myUsername, setMyUsername] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(
    null
  );
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [chatsLoadedFor, setChatsLoadedFor] = useState<string | null>(null);
  const [channelsLoadedFor, setChannelsLoadedFor] = useState<string | null>(
    null
  );
  const [userDocLoadedFor, setUserDocLoadedFor] = useState<string | null>(null);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [searchChannelOpen, setSearchChannelOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [profileUser, setProfileUser] = useState<any | null>(null);

  const ctxRef = useRef<HTMLDivElement | null>(null);
  const channelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window.electronAPI?.onWindowVisibilityChange === "function") {
      window.electronAPI.onWindowVisibilityChange((visible) => {
        useWindowVisibilityStore.getState().setVisible(visible);
      });
    } else {
      console.warn("electronAPI.onWindowVisibilityChange missing", {
        hasElectronAPI: !!window.electronAPI,
        keys: window.electronAPI ? Object.keys(window.electronAPI) : null,
      });
    }
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    ensureSavedChat(firebaseUser.uid).catch((err) => {
      console.error("Saved chat init failed:", err);
    });
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToUserChats(
      firebaseUser.uid,
      (nextChats) => {
        setChats(nextChats);
        setChatsLoadedFor(firebaseUser.uid);
      },
      (payload) => {
        const { activeChatId } = useChatStore.getState();
        const isThisChatOpen = activeChatId === payload.chatId;
        const isWindowVisible = useWindowVisibilityStore.getState().isVisible;

        if (isThisChatOpen && isWindowVisible) {
          return;
        }

        window.electronAPI?.notifyNewMessage({
          title: payload.senderName,
          body: payload.text,
          chatId: payload.chatId,
        });
      }
    );
    return unsub;
  }, [firebaseUser, setChats]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToMyChannels(
      firebaseUser.uid,
      setMyChannels,
      () => setChannelsLoadedFor(firebaseUser.uid)
    );
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    initGroups(firebaseUser.uid);
    return () => disposeGroups();
  }, [firebaseUser, initGroups, disposeGroups]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      const data = snap.data();
      setPinnedChats(data?.pinnedChats || {});
      setPinnedChannels(data?.pinnedChannels || {});
      setPinnedGroups(data?.pinnedGroups || {});
      setOrder(data?.order || {});
      setMyUsername(data?.username || "");
      setUserDocLoadedFor(firebaseUser.uid);
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
    if (!deleteConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirm(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteConfirm]);

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

  useEffect(() => {
    window.electronAPI?.onOpenChat((chatId: string) => {
      setActiveChat(chatId);
    });
  }, [setActiveChat]);

  async function openChat(otherUid: string) {
    if (!firebaseUser) return;
    const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
    openConversation("chat", chatId);
    setQuery("");
    setUsers([]);
    setProfileUser(null);
  }

  async function openUserProfile(u: any) {
    setProfileUser(u);
    try {
      const snap = await getDoc(doc(db, "users", u.id));
      if (snap.exists()) setProfileUser({ id: u.id, ...snap.data() });
    } catch {
      return;
    }
  }

  function handleCtxMenu(
    e: React.MouseEvent,
    type: "chat" | "channel" | "group",
    id: string,
    pinned: boolean,
    isOwner?: boolean
  ) {
    e.preventDefault();
    setCtxMenu({ type, id, x: e.clientX, y: e.clientY, pinned, isOwner });
  }

  async function handlePin() {
    if (!ctxMenu || !firebaseUser) return;
    if (ctxMenu.type === "chat") {
      await togglePinChat(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
    } else if (ctxMenu.type === "channel") {
      await togglePinChannel(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
    } else {
      await togglePinGroup(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
    }
    setCtxMenu(null);
  }

  async function handleMarkRead(chatId: string) {
    if (!firebaseUser) return;
    await updateDoc(doc(db, "chats", chatId), {
      [`unreadCount.${firebaseUser.uid}`]: 0,
    });
    setCtxMenu(null);
  }

  async function confirmDelete() {
    if (!deleteConfirm || !firebaseUser) return;

    if (deleteConfirm.type === "chat") {
      await updateDoc(doc(db, "chats", deleteConfirm.id), {
        [`deleted.${firebaseUser.uid}`]: true,
      });
      useChatStore.getState().setActiveChat(null);
    } else if (deleteConfirm.type === "channel") {
      if (deleteConfirm.isOwner) {
        await deleteChannel(deleteConfirm.id);
      } else {
        await unsubscribeFromChannel(deleteConfirm.id, firebaseUser.uid);
      }
      if (activeChannelId === deleteConfirm.id) setActiveChannel(null);
    } else {
      if (deleteConfirm.isOwner) {
        await deleteGroup(deleteConfirm.id);
      } else {
        await leaveGroup(deleteConfirm.id, firebaseUser.uid);
      }
      if (activeGroupId === deleteConfirm.id) setActiveGroup(null);
    }

    setDeleteConfirm(null);
  }

  async function handleDrop(bucketIds: string[]) {
    if (
      !draggedId ||
      !dragOverId ||
      !firebaseUser ||
      draggedId === dragOverId
    ) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = [...bucketIds];
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(dragOverId);
    setDraggedId(null);
    setDragOverId(null);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    await setConversationOrder(firebaseUser.uid, ids);
  }

  const { pinnedList, mergedList } = useMemo(() => {
    const visibleChats = chats.filter((chat) => !chat.deleted && !chat.isSaved);
    const allItems = buildConversationItems(visibleChats, myChannels, groups);
    const isPinned = (item: ConversationItem) =>
      item.type === "chat"
        ? pinnedChats[item.id]
        : item.type === "channel"
          ? pinnedChannels[item.id]
          : pinnedGroups[item.id];

    return {
      pinnedList: sortConversationItems(allItems.filter(isPinned), order),
      mergedList: sortByRecency(allItems.filter((item) => !isPinned(item))),
    };
  }, [
    chats,
    groups,
    myChannels,
    order,
    pinnedChannels,
    pinnedChats,
    pinnedGroups,
  ]);

  const savedChat = useMemo<Chat | null>(() => {
    if (!firebaseUser) return null;
    const found = chats.find((chat) => chat.isSaved);
    if (found) return found;
    return {
      id: getSavedChatId(firebaseUser.uid),
      participant: getSavedParticipant(
        firebaseUser.uid
      ) as unknown as Chat["participant"],
      lastMessage: "",
      lastMessageTime: "",
      unreadCount: 0,
      isSaved: true,
    };
  }, [chats, firebaseUser]);

  const chatsLoaded = chatsLoadedFor === firebaseUser?.uid;
  const channelsLoaded = channelsLoadedFor === firebaseUser?.uid;
  const userDocLoaded = userDocLoadedFor === firebaseUser?.uid;
  const ready = chatsLoaded && channelsLoaded && groupsLoaded && userDocLoaded;

  const isLight = mode === "light";
  const accent = "#522fb7";
  const accentSoft = "#8b6cff";
  const border = isLight ? "#e5e7eb" : "rgba(255,255,255,0.06)";
  const hoverBg = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
  const subText = isLight ? "#6b7280" : "#9a96ad";
  const mutedText = isLight ? "#9ca3af" : "#6f6a85";
  const menuText = isLight ? "#1f2937" : "#e4e1ef";
  const menuDivider = isLight ? "#eceef2" : "rgba(255,255,255,0.07)";
  const fieldBg = isLight ? "#f1f2f6" : "rgba(255,255,255,0.05)";
  const fieldFocusBg = isLight ? "#ffffff" : "rgba(255,255,255,0.08)";
  const popBg = isLight ? "#ffffff" : "#16141f";
  const popBorder = isLight ? "#e5e7eb" : "rgba(255,255,255,0.09)";
  const popShadow = isLight
    ? "0 16px 40px rgba(20,15,50,0.16), 0 2px 8px rgba(20,15,50,0.06)"
    : "0 16px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)";
  const chipBg = isLight ? "rgba(82,47,183,0.1)" : "rgba(139,108,255,0.14)";
  const newBtnBg = channelMenuOpen
    ? isLight
      ? "rgba(82,47,183,0.08)"
      : "rgba(82,47,183,0.14)"
    : isLight
      ? "#ffffff"
      : "rgba(255,255,255,0.025)";
  const newBtnBorder = channelMenuOpen
    ? "rgba(139,108,255,0.35)"
    : isLight
      ? "#d9dce3"
      : "rgba(255,255,255,0.07)";

  function renderItem(
    item: ConversationItem,
    pinned: boolean,
    bucket: ConversationItem[]
  ) {
    const isChannelOwner =
      item.type === "channel" &&
      (item.data as Channel).ownerId === firebaseUser?.uid;

    const isGroupOwner =
      item.type === "group" &&
      (item.data as Group).ownerId === firebaseUser?.uid;

    return (
      <div
        key={item.id}
        draggable={pinned}
        onDragStart={() => pinned && setDraggedId(item.id)}
        onDragOver={(e) => {
          if (!pinned) return;
          e.preventDefault();
          if (dragOverId !== item.id) setDragOverId(item.id);
        }}
        onDrop={() => pinned && handleDrop(bucket.map((i) => i.id))}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverId(null);
        }}
        onContextMenu={(e) =>
          item.type === "chat"
            ? handleCtxMenu(e, "chat", item.id, pinned)
            : item.type === "channel"
              ? handleCtxMenu(e, "channel", item.id, pinned, isChannelOwner)
              : handleCtxMenu(e, "group", item.id, pinned, isGroupOwner)
        }
        className="relative transition-opacity duration-150"
        style={{
          opacity: draggedId === item.id ? 0.4 : 1,
          boxShadow:
            dragOverId === item.id && draggedId !== item.id
              ? `inset 0 2px 0 0 ${accentSoft}`
              : undefined,
        }}
      >
        {item.type === "chat" ? (
          <ChatItem chat={item.data} pinned={pinned} />
        ) : item.type === "channel" ? (
          <ChannelItem channel={item.data as Channel} pinned={pinned} />
        ) : (
          <GroupItem group={item.data as Group} pinned={pinned} />
        )}
      </div>
    );
  }

  const newMenuItems = [
    {
      key: "channel",
      icon: <Megaphone size={15} />,
      title: "New channel",
      subtitle: "Broadcast to subscribers",
      accented: true,
      onClick: () => setCreateChannelOpen(true),
    },
    {
      key: "group",
      icon: <Users size={15} />,
      title: "New group",
      subtitle: "Chat with multiple people",
      accented: true,
      onClick: () => setCreateGroupOpen(true),
    },
    {
      key: "find",
      icon: <Search size={15} />,
      title: "Find a channel",
      subtitle: "Discover public channels",
      accented: false,
      onClick: () => setSearchChannelOpen(true),
    },
  ];

  const sectionHeaderClass =
    "sticky top-0 z-10 flex items-center justify-between px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]";

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.2); border-radius: 999px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.45); }
        .sb-field {
          background: var(--sb-field-bg);
          box-shadow: inset 0 0 0 1px transparent;
          transition: background 0.18s ease, box-shadow 0.18s ease;
        }
        .sb-field:hover { box-shadow: inset 0 0 0 1px var(--sb-border); }
        .sb-field:focus-within {
          background: var(--sb-field-focus);
          box-shadow: inset 0 0 0 1.5px var(--sb-accent-soft);
        }
        .sb-field input::placeholder { color: var(--sb-muted); }
        .sb-new-btn { transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease; }
        .sb-new-btn:hover { border-color: rgba(139,108,255,0.35); }
        .sb-new-btn:active { transform: scale(0.985); }
        .sb-pop { animation: sbPop 0.13s ease-out; transform-origin: top left; }
        .sb-fade { animation: sbFade 0.15s ease; }
        .sb-press { transition: background 0.15s ease, transform 0.12s ease; }
        .sb-press:active { transform: scale(0.975); }
        @keyframes sbPop {
          from { opacity: 0; transform: scale(0.95) translateY(-3px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sbFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <section
        className="sidebar-entrance w-full h-full flex flex-col overflow-x-hidden border-r transition-colors duration-200 relative"
        style={
          {
            background: theme.sideBarBg,
            borderColor: border,
            color: theme.text,
            "--sb-field-bg": fieldBg,
            "--sb-field-focus": fieldFocusBg,
            "--sb-border": border,
            "--sb-accent-soft": accentSoft,
            "--sb-muted": mutedText,
          } as React.CSSProperties
        }
      >
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <div className="sb-field relative flex items-center w-full h-11 rounded-[15px]">
              <Search
                size={16}
                className="absolute left-3.5 pointer-events-none"
                style={{ color: mutedText }}
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full h-full pl-10 pr-10 rounded-[15px] outline-none bg-transparent text-[13.5px]"
                style={{ color: theme.text }}
              />

              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer"
                  style={{ color: subText }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = hoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <X size={13} />
                </button>
              ) : (
                <div
                  className="absolute right-3 pointer-events-none flex items-center justify-center"
                  style={{ color: mutedText }}
                >
                  <UserCircle size={16} strokeWidth={1.7} />
                </div>
              )}
            </div>

            <div className="relative mt-2.5" ref={channelMenuRef}>
              <button
                onClick={() => setChannelMenuOpen((v) => !v)}
                className="sb-new-btn group w-full h-10 flex items-center justify-between rounded-[13px] px-3.5 border cursor-pointer"
                style={{
                  background: newBtnBg,
                  borderColor: newBtnBorder,
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ background: chipBg, color: accentSoft }}
                  >
                    <Plus size={14} />
                  </span>

                  <span
                    className="text-[13px] font-medium"
                    style={{ color: menuText }}
                  >
                    New
                  </span>
                </span>

                <ChevronsRight
                  size={14}
                  className={`transition-transform duration-200 ${channelMenuOpen ? "rotate-90" : ""
                    }`}
                  style={{ color: mutedText }}
                />
              </button>

              {channelMenuOpen && (
                <div
                  className="sb-pop absolute left-0 right-0 top-[45px] rounded-[14px] border overflow-hidden z-50 p-1.5"
                  style={{
                    background: popBg,
                    borderColor: popBorder,
                    boxShadow: popShadow,
                  }}
                >
                  {newMenuItems.map((entry, index) => (
                    <div key={entry.key}>
                      {index === newMenuItems.length - 1 && (
                        <div
                          className="my-1.5 h-px"
                          style={{ background: menuDivider }}
                        />
                      )}
                      <button
                        onClick={() => {
                          entry.onClick();
                          setChannelMenuOpen(false);
                        }}
                        className="sb-press w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left cursor-pointer"
                        style={{ color: menuText }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = hoverBg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: entry.accented ? chipBg : fieldBg,
                            color: entry.accented ? accentSoft : mutedText,
                          }}
                        >
                          {entry.icon}
                        </span>

                        <span className="flex flex-col leading-tight min-w-0">
                          <span className="text-[13px] font-medium">
                            {entry.title}
                          </span>
                          <span
                            className="text-[11px] mt-0.5 truncate"
                            style={{ color: mutedText }}
                          >
                            {entry.subtitle}
                          </span>
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {query && (
          <div className="sb-fade border-y" style={{ borderColor: border }}>
            {loading && (
              <p className="text-xs px-4 py-3" style={{ color: subText }}>
                Searching...
              </p>
            )}
            {!loading &&
              users.map((u, index) => (
                <button
                  key={u.id}
                  onClick={() => openUserProfile(u)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer"
                  style={{
                    color: theme.text,
                    borderTop:
                      index === 0 ? "none" : `1px solid ${menuDivider}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = hoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {u.avatar ? (
                    <SmoothImage
                      src={avatarThumb(u.avatar, 72)}
                      alt={u.username}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: accent }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-[13.5px] font-medium truncate">
                    {u.username}
                  </span>
                </button>
              ))}
            {!loading && users.length === 0 && (
              <p className="text-xs px-4 py-3" style={{ color: subText }}>
                No users found
              </p>
            )}
          </div>
        )}

        <div className="sidebar-scroll flex-1 overflow-y-auto">
          {!ready ? (
            <SidebarSkeleton />
          ) : (
            <div className="pb-2">
              {savedChat && (
                <div
                  key={savedChat.id}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative"
                >
                  <ChatItem chat={savedChat} />
                </div>
              )}

              {pinnedList.length === 0 && mergedList.length === 0 ? (
                <div className="sb-fade flex flex-col items-center justify-center gap-3 text-center px-8 py-14">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: chipBg }}
                  >
                    <MessagesSquare size={20} style={{ color: accentSoft }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: theme.text }}
                    >
                      No chats yet
                    </p>
                    <p
                      className="text-[12.5px] leading-relaxed"
                      style={{ color: subText }}
                    >
                      Search users above to start a conversation.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="mx-4 my-1 h-px"
                    style={{ background: menuDivider }}
                  />

                  {pinnedList.length > 0 && (
                    <div
                      className={sectionHeaderClass}
                      style={{ color: mutedText, background: theme.sideBarBg }}
                    >
                      <span className="flex items-center gap-1.5">
                        <Pin size={10} />
                        Pinned
                      </span>
                      <span>{pinnedList.length}</span>
                    </div>
                  )}
                  {pinnedList.map((item) => renderItem(item, true, pinnedList))}

                  {pinnedList.length > 0 && mergedList.length > 0 && (
                    <div
                      className={sectionHeaderClass}
                      style={{ color: mutedText, background: theme.sideBarBg }}
                    >
                      <span>All chats</span>
                      <span>{mergedList.length}</span>
                    </div>
                  )}
                  {mergedList.map((item) =>
                    renderItem(item, false, mergedList)
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-2 px-3 py-3 border-t"
          style={{ borderColor: border }}
        >
          <button
            onClick={() => setShowProfile(true)}
            className="sb-press flex h-11 flex-1 min-w-0 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-left"
            style={{ color: theme.text, background: fieldBg }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = fieldBg)}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: chipBg }}
            >
              <UserCircle size={16} style={{ color: accentSoft }} />
            </span>
            <span className="text-[13.5px] font-medium truncate">
              Your profile
            </span>
          </button>

          <Link
            href="/settings"
            className="sb-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ color: subText, background: fieldBg }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverBg;
              e.currentTarget.style.color = accentSoft;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = fieldBg;
              e.currentTarget.style.color = subText;
            }}
            aria-label="Settings"
          >
            <Settings size={18} />
          </Link>
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

      {createGroupOpen && firebaseUser && (
        <CreateGroupModal
          uid={firebaseUser.uid}
          username={myUsername}
          contacts={chats
            .filter((c) => !c.isSaved)
            .map((c) => ({
              uid: c.participant.id,
              username: c.participant.username,
              avatarUrl: c.participant.avatar,
            }))}
          onClose={() => setCreateGroupOpen(false)}
          onCreated={(groupId) => {
            setActiveGroup(groupId);
            setCreateGroupOpen(false);
          }}
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

      {profileUser && (
        <UserProfileModal
          user={profileUser}
          onClose={() => setProfileUser(null)}
          onWrite={() => openChat(profileUser.id)}
        />
      )}

      {ctxMenu && (
        <div
          ref={ctxRef}
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 999,
            background: popBg,
            borderColor: popBorder,
            boxShadow: popShadow,
            transformOrigin: "top left",
          }}
          className="sb-pop min-w-[180px] rounded-xl border p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handlePin}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer"
            style={{ color: menuText }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Pin
              size={14}
              style={{ color: ctxMenu.pinned ? accentSoft : subText }}
            />
            {ctxMenu.pinned
              ? ctxMenu.type === "chat"
                ? "Unpin chat"
                : ctxMenu.type === "channel"
                  ? "Unpin channel"
                  : "Unpin group"
              : ctxMenu.type === "chat"
                ? "Pin chat"
                : ctxMenu.type === "channel"
                  ? "Pin channel"
                  : "Pin group"}
          </button>

          {ctxMenu.type === "chat" && (
            <button
              onClick={() => handleMarkRead(ctxMenu.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer"
              style={{ color: menuText }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <CheckCheck size={14} style={{ color: subText }} />
              Mark as read
            </button>
          )}

          <div
            className="my-1 mx-1"
            style={{ height: 1, background: menuDivider }}
          />

          <button
            onClick={() => {
              setDeleteConfirm({
                type: ctxMenu.type,
                id: ctxMenu.id,
                isOwner: ctxMenu.isOwner,
              });
              setCtxMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer text-red-400"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {ctxMenu.type === "chat" ? (
              <>
                <Trash2 size={14} />
                Delete chat
              </>
            ) : ctxMenu.type === "channel" ? (
              ctxMenu.isOwner ? (
                <>
                  <Trash2 size={14} />
                  Delete channel
                </>
              ) : (
                <>
                  <LogOut size={14} />
                  Leave channel
                </>
              )
            ) : ctxMenu.isOwner ? (
              <>
                <Trash2 size={14} />
                Delete group
              </>
            ) : (
              <>
                <LogOut size={14} />
                Leave group
              </>
            )}
          </button>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="sb-fade fixed inset-0 z-[200] flex items-center justify-center bg-black/55 backdrop-blur-[3px]"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="sb-pop w-[320px] rounded-2xl border p-5 text-center"
            style={{
              background: popBg,
              borderColor: popBorder,
              boxShadow: popShadow,
              transformOrigin: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto mb-3.5 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.12)" }}
            >
              {(deleteConfirm.type === "channel" ||
                deleteConfirm.type === "group") &&
                !deleteConfirm.isOwner ? (
                <LogOut size={18} className="text-red-400" />
              ) : (
                <Trash2 size={18} className="text-red-400" />
              )}
            </div>

            <h3
              className="text-[16px] font-semibold mb-1.5"
              style={{ color: isLight ? "#111827" : "#ffffff" }}
            >
              {deleteConfirm.type === "chat"
                ? "Delete chat?"
                : deleteConfirm.type === "channel"
                  ? deleteConfirm.isOwner
                    ? "Delete channel?"
                    : "Leave channel?"
                  : deleteConfirm.isOwner
                    ? "Delete group?"
                    : "Leave group?"}
            </h3>

            <p
              className="text-[13px] leading-relaxed mb-5"
              style={{ color: subText }}
            >
              {deleteConfirm.type === "chat"
                ? "This will permanently delete the entire conversation. This action cannot be undone."
                : deleteConfirm.type === "channel"
                  ? deleteConfirm.isOwner
                    ? "This will permanently delete the channel for all subscribers. This action cannot be undone."
                    : "You will stop receiving posts from this channel. You can subscribe again anytime."
                  : deleteConfirm.isOwner
                    ? "This will permanently delete the group for all members. This action cannot be undone."
                    : "You will stop receiving messages from this group. You'll need a new invite to rejoin."}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={confirmDelete}
                className="sb-press w-full h-10 rounded-xl text-sm font-semibold text-white cursor-pointer hover:brightness-110"
                style={{ background: "#ef4444" }}
              >
                {(deleteConfirm.type === "channel" ||
                  deleteConfirm.type === "group") &&
                  !deleteConfirm.isOwner
                  ? "Leave"
                  : "Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="sb-press w-full h-10 rounded-xl text-sm font-medium cursor-pointer"
                style={{ color: menuText, background: fieldBg }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = hoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = fieldBg)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}