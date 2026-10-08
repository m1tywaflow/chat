// "use client";

// import {
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { formatLastSeen, isOnline } from "@/lib/formatLastSeen";
// import { useChatStore } from "@/store/chat-store";
// import {
//   subscribeToMessages,
//   loadOlderMessages,
//   sendMessage,
//   sendVoiceMessage,
//   markMessageRead,
//   toggleReaction,
//   editMessage,
//   deleteMessage,
//   pinMessage,
//   forwardMessageToChat,
// } from "@/lib/firestore/chats";
// import { forwardMessageToChannel } from "@/lib/firestore/channels";
// import { forwardMessageToGroup } from "@/lib/firestore/groups";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
// import {
//   X,
//   CornerUpLeft,
//   MoreVertical,
//   Trash2,
//   ImageIcon,
//   ImagePlus,
//   ImageOff,
//   Download,
//   Pencil,
//   Pin,
//   PinOff,
//   Copy,
//   ChevronDown,
//   Forward,
//   Phone,
//   Video,
// } from "lucide-react";
// import ProfileModal from "../profile-modal/ProfileModal";
// import MediaGallery from "../media-gallery/MediaGallery";
// import ForwardPicker from "@/components/molecules/forward-picker/ForwardPicker";
// import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
// import { useWindowVisibilityStore } from "@/store/window-visibility-store";
// import { createCall, fetchLiveKitToken } from "@/lib/calls";
// import { useCallStore } from "@/store/call-store";
// import { disintegrate } from "@/lib/disintegrate";

// import MessageRow from "./MessageRow";
// import Composer, { ComposerHandle, SendPayload } from "./Composer";
// import {
//   ConfirmDialog,
//   dayKey,
//   formatDayLabel,
//   isVideo,
//   toDate,
//   uploadToCloudinary,
// } from "./chat-shared";
// import "./chat-window.css";

// const NEAR_BOTTOM_THRESHOLD = 120;
// const GROUP_GAP_MS = 5 * 60 * 1000;

// interface MsgMenuState {
//   id: string;
//   x: number;
//   y: number;
//   openUpward: boolean;
//   isMine: boolean;
// }

// type Row =
//   | { type: "date"; key: string; label: string }
//   | {
//     type: "msg";
//     m: any;
//     isFirstInGroup: boolean;
//     isLastInGroup: boolean;
//   };

// function sameList(a: string[], b: string[]) {
//   return a.length === b.length && a.every((v, i) => v === b[i]);
// }

// export default function ChatWindow() {
//   const chatId = useChatStore((s) => s.activeChatId);
//   const markOpened = useChatStore((s) => s.markOpened);
//   const setActiveCall = useCallStore((s) => s.setActiveCall);
//   const setLivekitToken = useCallStore((s) => s.setLivekitToken);
//   const setCallStoreMyUid = useCallStore((s) => s.setMyUid);
//   const isWindowVisible = useWindowVisibilityStore((s) => s.isVisible);

//   const [messages, setMessages] = useState<any[]>([]);
//   const [pendingMessages, setPendingMessages] = useState<any[]>([]);
//   const [myUid, setMyUid] = useState<string | null>(null);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);
//   const [replyMessage, setReplyMessage] = useState<any | null>(null);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [otherUser, setOtherUser] = useState<any>(null);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
//   const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
//   const [pickerExpanded, setPickerExpanded] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [msgMenu, setMsgMenu] = useState<MsgMenuState | null>(null);
//   const [pinnedMessage, setPinnedMessage] = useState<{
//     id: string;
//     text: string;
//   } | null>(null);
//   const [galleryOpen, setGalleryOpen] = useState(false);
//   const [copiedId, setCopiedId] = useState<string | null>(null);
//   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
//   const [deleteChatConfirm, setDeleteChatConfirm] = useState(false);
//   const [wallpaper, setWallpaper] = useState<any>(null);
//   const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
//   const [showScrollButton, setShowScrollButton] = useState(false);
//   const [isDraggingFile, setIsDraggingFile] = useState(false);
//   const [forwardData, setForwardData] = useState<any | null>(null);
//   const [hasMoreMessages, setHasMoreMessages] = useState(false);
//   const [isLoadingOlder, setIsLoadingOlder] = useState(false);
//   const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());

//   const menuRef = useRef<HTMLDivElement | null>(null);
//   const msgMenuRef = useRef<HTMLDivElement | null>(null);
//   const chatScrollRef = useRef<HTMLDivElement | null>(null);
//   const topSentinelRef = useRef<HTMLDivElement | null>(null);
//   const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
//   const composerRef = useRef<ComposerHandle | null>(null);

//   const isNearBottom = useRef(true);
//   const unreadComputedForChat = useRef<string | null>(null);
//   const activeChatIdRef = useRef<string | null>(chatId);
//   const confirmedMessageIdsRef = useRef<Set<string>>(new Set());
//   const scrollIntentRef = useRef<"initial" | "follow" | "force" | null>(null);
//   const dragCounter = useRef(0);
//   const isLoadingOlderRef = useRef(false);
//   const olderMessageIdsRef = useRef<Set<string>>(new Set());
//   const readReceiptIdsRef = useRef<Set<string>>(new Set());
//   const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
//   const visibleRef = useRef(isWindowVisible);
//   const unreadRef = useRef(0);
//   const callBusyRef = useRef(false);
//   const loadOlderRef = useRef<() => void>(() => { });

//   useLayoutEffect(() => {
//     activeChatIdRef.current = chatId;
//   }, [chatId]);

//   useLayoutEffect(() => {
//     visibleRef.current = isWindowVisible;
//   }, [isWindowVisible]);

//   useEffect(() => {
//     return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
//   }, []);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     const [uid1, uid2] = chatId.split("_");
//     const otherUid = uid1 === myUid ? uid2 : uid1;
//     const unsub = onSnapshot(doc(db, "users", otherUid), (snap) => {
//       if (snap.exists()) setOtherUser({ id: snap.id, ...snap.data() });
//     });
//     return () => unsub();
//   }, [chatId, myUid]);

//   useLayoutEffect(() => {
//     setPendingMessages((previous) => {
//       previous.forEach((message) => {
//         if (
//           typeof message.imageUrl === "string" &&
//           message.imageUrl.startsWith("blob:")
//         ) {
//           URL.revokeObjectURL(message.imageUrl);
//         }
//       });
//       return [];
//     });
//     setMessages([]);
//     setFirstUnreadId(null);
//     setShowScrollButton(false);
//     setTypingUsers([]);
//     setReplyMessage(null);
//     setEditingId(null);
//     setPickerOpenId(null);
//     setMsgMenu(null);
//     setFreshIds(new Set());
//     unreadComputedForChat.current = null;
//     isNearBottom.current = true;
//     confirmedMessageIdsRef.current = new Set();
//     scrollIntentRef.current = null;
//     setHasMoreMessages(false);
//     setIsLoadingOlder(false);
//     isLoadingOlderRef.current = false;
//     olderMessageIdsRef.current = new Set();
//     readReceiptIdsRef.current = new Set();
//     preserveScrollRef.current = null;
//     unreadRef.current = 0;
//   }, [chatId]);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     const unsub = subscribeToMessages(chatId, (msgs, hasMore) => {
//       if (activeChatIdRef.current !== chatId) return;
//       setHasMoreMessages(hasMore);

//       const isFirstLoadForThisChat = unreadComputedForChat.current !== chatId;
//       const prevIds = confirmedMessageIdsRef.current;
//       const nextIds = new Set<string>(msgs.map((m) => m.id));
//       const hasNewConfirmedMessage = [...nextIds].some((id) => !prevIds.has(id));
//       confirmedMessageIdsRef.current = nextIds;

//       if (isFirstLoadForThisChat) {
//         scrollIntentRef.current = "initial";
//       } else {
//         if (hasNewConfirmedMessage && isNearBottom.current) {
//           scrollIntentRef.current = "follow";
//         }
//         const added = msgs
//           .filter((m) => !prevIds.has(m.id) && m.senderId !== myUid)
//           .map((m) => m.id);
//         if (added.length) {
//           setFreshIds((prev) => new Set([...prev, ...added]));
//         }
//       }

//       if (isFirstLoadForThisChat) {
//         unreadComputedForChat.current = chatId;
//         const firstUnread = msgs.find(
//           (m) => m.senderId !== myUid && !(m.readBy || []).includes(myUid)
//         );
//         setFirstUnreadId(firstUnread ? firstUnread.id : null);
//       }

//       setMessages((previous) => [
//         ...previous.filter(
//           (message) =>
//             olderMessageIdsRef.current.has(message.id) && !nextIds.has(message.id)
//         ),
//         ...msgs,
//       ]);

//       setPendingMessages((previous) => {
//         if (!previous.length) return previous;
//         const consumed = new Set<number>();
//         const next = previous.filter((pending) => {
//           const isBlob =
//             typeof pending.imageUrl === "string" &&
//             pending.imageUrl.startsWith("blob:");
//           const matchIndex = msgs.findIndex(
//             (message, index) =>
//               !consumed.has(index) &&
//               message.senderId === pending.senderId &&
//               (message.text || "") === (pending.text || "") &&
//               (isBlob
//                 ? Boolean(message.imageUrl)
//                 : (message.imageUrl || null) === (pending.imageUrl || null))
//           );
//           if (matchIndex === -1) return true;
//           consumed.add(matchIndex);
//           if (isBlob) URL.revokeObjectURL(pending.imageUrl);
//           return false;
//         });
//         return next.length === previous.length ? previous : next;
//       });
//     });
//     return () => unsub();
//   }, [chatId, myUid]);

//   useEffect(() => {
//     if (!chatId || !myUid || !isWindowVisible) return;
//     const ids = messages
//       .filter(
//         (m) =>
//           m.senderId !== myUid &&
//           !(m.readBy || []).includes(myUid) &&
//           !readReceiptIdsRef.current.has(m.id)
//       )
//       .map((m) => m.id);
//     ids.forEach((id) => {
//       readReceiptIdsRef.current.add(id);
//       markMessageRead(chatId, id, myUid).catch(() => {
//         readReceiptIdsRef.current.delete(id);
//       });
//     });
//   }, [messages, chatId, myUid, isWindowVisible]);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
//       if (activeChatIdRef.current !== chatId) return;
//       const data = snap.data();

//       const typingList = data?.typing
//         ? Object.entries(data.typing)
//           .filter(([uid, val]) => val && uid !== myUid)
//           .map(([uid]) => uid)
//         : [];
//       setTypingUsers((prev) => (sameList(prev, typingList) ? prev : typingList));

//       const pin = data?.pinnedMessage || null;
//       setPinnedMessage((prev) =>
//         prev?.id === pin?.id && prev?.text === pin?.text ? prev : pin
//       );

//       const wp = data?.wallpaper || null;
//       setWallpaper((prev: any) =>
//         (prev?.url ?? null) === (wp?.url ?? null) ? prev : wp
//       );

//       const unread = data?.unreadCount?.[myUid] || 0;
//       unreadRef.current = unread;
//       if (unread > 0 && visibleRef.current) {
//         unreadRef.current = 0;
//         updateDoc(doc(db, "chats", chatId), {
//           [`unreadCount.${myUid}`]: 0,
//         }).catch(() => { });
//       }
//     });
//     return () => unsub();
//   }, [chatId, myUid]);

//   useEffect(() => {
//     if (!isWindowVisible || !chatId || !myUid || unreadRef.current <= 0) return;
//     unreadRef.current = 0;
//     updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 }).catch(
//       () => { }
//     );
//   }, [isWindowVisible, chatId, myUid]);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     markOpened(chatId);
//     updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 }).catch(
//       () => { }
//     );
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [chatId, myUid]);

//   useEffect(() => {
//     if (typeof window.electronAPI?.onWindowVisibilityChange === "function") {
//       window.electronAPI.onWindowVisibilityChange((visible: boolean) => {
//         useWindowVisibilityStore.getState().setVisible(visible);
//       });
//     }
//   }, []);

//   function handleScroll() {
//     const el = chatScrollRef.current;
//     if (!el) return;
//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
//     isNearBottom.current = nearBottom;
//     setShowScrollButton((prev) => (prev === !nearBottom ? prev : !nearBottom));
//   }

//   async function loadOlder() {
//     if (!chatId) return;
//     if (isLoadingOlderRef.current || !hasMoreMessages) return;
//     const oldest = messages[0];
//     if (!oldest) return;

//     isLoadingOlderRef.current = true;
//     setIsLoadingOlder(true);

//     const el = chatScrollRef.current;
//     preserveScrollRef.current = el
//       ? { height: el.scrollHeight, top: el.scrollTop }
//       : null;

//     try {
//       const { messages: older, hasMore } = await loadOlderMessages(chatId, oldest);
//       if (activeChatIdRef.current !== chatId) return;
//       setHasMoreMessages(hasMore);
//       if (older.length) {
//         setMessages((prev) => {
//           const existingIds = new Set(prev.map((m) => m.id));
//           const deduped = older.filter((m) => !existingIds.has(m.id));
//           deduped.forEach((message) => olderMessageIdsRef.current.add(message.id));
//           return [...deduped, ...prev];
//         });
//       } else {
//         preserveScrollRef.current = null;
//       }
//     } finally {
//       isLoadingOlderRef.current = false;
//       setIsLoadingOlder(false);
//     }
//   }

//   useLayoutEffect(() => {
//     loadOlderRef.current = loadOlder;
//   });

//   useEffect(() => {
//     const root = chatScrollRef.current;
//     const target = topSentinelRef.current;
//     if (!root || !target || !hasMoreMessages) return;
//     const io = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) loadOlderRef.current();
//       },
//       { root, rootMargin: "200px 0px 0px 0px" }
//     );
//     io.observe(target);
//     return () => io.disconnect();
//   }, [chatId, hasMoreMessages, messages.length]);

//   useLayoutEffect(() => {
//     const el = chatScrollRef.current;
//     const preserved = preserveScrollRef.current;
//     if (!el || !preserved) return;
//     el.scrollTop = el.scrollHeight - preserved.height + preserved.top;
//     preserveScrollRef.current = null;
//   }, [messages]);

//   const scrollToBottom = useCallback(() => {
//     const el = chatScrollRef.current;
//     if (el) el.scrollTop = el.scrollHeight;
//   }, []);

//   const handleMediaLoad = useCallback(() => {
//     if (isNearBottom.current) scrollToBottom();
//   }, [scrollToBottom]);

//   useLayoutEffect(() => {
//     if (!chatId) return;
//     const intent = scrollIntentRef.current;
//     if (!intent) return;
//     if (intent === "initial" || intent === "force" || isNearBottom.current) {
//       scrollToBottom();
//       isNearBottom.current = true;
//       setShowScrollButton(false);
//     }
//     scrollIntentRef.current = null;
//   }, [chatId, messages, pendingMessages, scrollToBottom]);

//   useEffect(() => {
//     document.body.style.overflow = profileOpen || lightboxUrl ? "hidden" : "";
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [profileOpen, lightboxUrl]);

//   useEffect(() => {
//     if (!lightboxUrl) return;
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setLightboxUrl(null);
//     };
//     window.addEventListener("keydown", handleKey);
//     return () => window.removeEventListener("keydown", handleKey);
//   }, [lightboxUrl]);

//   useEffect(() => {
//     if (!pickerOpenId && !msgMenu) return;
//     const handleClick = () => {
//       setPickerOpenId(null);
//       setPickerExpanded(false);
//       setMsgMenu(null);
//     };
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [pickerOpenId, msgMenu]);

//   useEffect(() => {
//     if (!menuOpen) return;
//     const handleClick = (e: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(e.target as Node))
//         setMenuOpen(false);
//     };
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [menuOpen]);

//   function handleDragEnter(e: React.DragEvent) {
//     e.preventDefault();
//     if (e.dataTransfer.types.includes("Files")) {
//       dragCounter.current++;
//       setIsDraggingFile(true);
//     }
//   }
//   function handleDragLeave(e: React.DragEvent) {
//     e.preventDefault();
//     dragCounter.current = Math.max(0, dragCounter.current - 1);
//     if (dragCounter.current === 0) setIsDraggingFile(false);
//   }
//   function handleDragOver(e: React.DragEvent) {
//     e.preventDefault();
//   }
//   function handleDrop(e: React.DragEvent) {
//     e.preventDefault();
//     dragCounter.current = 0;
//     setIsDraggingFile(false);
//     const file = e.dataTransfer.files?.[0];
//     if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
//       composerRef.current?.attachFile(file);
//     }
//   }

//   async function handleSend({ text, file, previewUrl, isVideo: wasVideo }: SendPayload) {
//     if (!chatId || !myUid) return;
//     const currentReply = replyMessage;

//     const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
//     const optimisticMsg = {
//       id: tempId,
//       senderId: myUid,
//       text,
//       imageUrl: previewUrl || undefined,
//       isLocalVideo: wasVideo,
//       replyTo: currentReply
//         ? {
//           id: currentReply.id,
//           text: currentReply.text,
//           imageUrl: currentReply.imageUrl,
//         }
//         : null,
//       createdAt: new Date(),
//       readBy: [],
//       reactions: {},
//       pending: true,
//     };

//     setPendingMessages((prev) => [...prev, optimisticMsg]);
//     setReplyMessage(null);
//     isNearBottom.current = true;
//     scrollIntentRef.current = "force";

//     try {
//       let imageUrl: string | undefined;
//       if (file) imageUrl = await uploadToCloudinary(file);
//       await sendMessage(chatId, myUid, text, currentReply, imageUrl);
//     } catch (err) {
//       console.error("Send failed:", err);
//       setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
//       if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
//       if (text) composerRef.current?.restoreText(text);
//     }
//   }

//   async function handleVoiceSend(r: {
//     audioUrl: string;
//     duration: number;
//     waveform: number[];
//   }) {
//     if (!chatId || !myUid) return;
//     const currentReply = replyMessage;
//     setReplyMessage(null);
//     isNearBottom.current = true;
//     scrollIntentRef.current = "force";
//     try {
//       await sendVoiceMessage(
//         chatId,
//         myUid,
//         currentReply,
//         r.audioUrl,
//         r.duration,
//         r.waveform
//       );
//     } catch (err) {
//       console.error("Voice send failed:", err);
//     }
//   }

//   const handleReply = useCallback((m: any) => {
//     setReplyMessage(m);
//     composerRef.current?.focus();
//   }, []);

//   const handleReact = useCallback(
//     async (messageId: string, token: string) => {
//       if (!chatId || !myUid) return;
//       setPickerOpenId(null);
//       try {
//         await toggleReaction(chatId, messageId, token, myUid);
//       } catch (err) {
//         console.error("Reaction failed:", err);
//       }
//     },
//     [chatId, myUid]
//   );

//   const openPicker = useCallback((e: React.MouseEvent, msgId: string) => {
//     e.stopPropagation();
//     setPickerOpenId((prev) => (prev === msgId ? null : msgId));
//     setPickerExpanded(false);
//     setMsgMenu(null);
//   }, []);

//   const expandPicker = useCallback(() => setPickerExpanded(true), []);

//   const openMsgMenu = useCallback(
//     (e: React.MouseEvent, msgId: string, isMine: boolean) => {
//       e.preventDefault();
//       e.stopPropagation();
//       const rect = (e.currentTarget as HTMLElement).getBoundingClientRect?.() ?? {
//         bottom: e.clientY,
//         top: e.clientY,
//       };
//       const spaceBelow = window.innerHeight - rect.bottom;
//       const openUpward = spaceBelow < 180;
//       setMsgMenu((prev) =>
//         prev?.id === msgId
//           ? null
//           : {
//             id: msgId,
//             x: e.clientX,
//             y: openUpward ? rect.top : rect.bottom,
//             openUpward,
//             isMine,
//           }
//       );
//       setPickerOpenId(null);
//     },
//     []
//   );

//   const scrollToMessage = useCallback((id: string) => {
//     const el = document.getElementById(`msg-${id}`);
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "center" });
//     el.classList.add("highlight-flash");
//     setTimeout(() => el.classList.remove("highlight-flash"), 1500);
//   }, []);

//   const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
//   const cancelEdit = useCallback(() => setEditingId(null), []);
//   const cancelReply = useCallback(() => setReplyMessage(null), []);

//   const submitEdit = useCallback(
//     async (id: string, newText: string) => {
//       if (!chatId) return;
//       try {
//         await editMessage(chatId, id, newText);
//         setEditingId(null);
//       } catch (err) {
//         console.error("Edit failed:", err);
//       }
//     },
//     [chatId]
//   );

//   function startEdit(m: any) {
//     setEditingId(m.id);
//     setMsgMenu(null);
//   }

//   function handleDelete(msgId: string) {
//     setMsgMenu(null);
//     setDeleteConfirmId(msgId);
//   }

//   async function confirmDelete() {
//     if (!chatId || !deleteConfirmId) return;
//     const id = deleteConfirmId;
//     setDeleteConfirmId(null);
//     const el = document.querySelector<HTMLElement>(`[data-msg-anim="${id}"]`);
//     try {
//       if (el) await disintegrate(el);
//       await deleteMessage(chatId, id);
//     } catch (err) {
//       console.error("Delete failed:", err);
//       if (el) el.style.visibility = "";
//     }
//   }

//   async function confirmDeleteChat() {
//     if (!chatId || !myUid) return;
//     try {
//       await updateDoc(doc(db, "chats", chatId), { [`deleted.${myUid}`]: true });
//       useChatStore.getState().setActiveChat(null);
//     } catch (err) {
//       console.error("Delete chat failed:", err);
//     }
//     setDeleteChatConfirm(false);
//   }

//   async function handlePin(m: any) {
//     if (!chatId) return;
//     setMsgMenu(null);
//     const isAlreadyPinned = pinnedMessage?.id === m.id;
//     await pinMessage(
//       chatId,
//       isAlreadyPinned ? null : m.id,
//       isAlreadyPinned
//         ? null
//         : m.text || (m.voiceUrl ? "🎤 Voice message" : "📷 Photo")
//     );
//   }

//   async function handleCopy(m: any) {
//     if (!m.text) return;
//     try {
//       await navigator.clipboard.writeText(m.text);
//     } catch (err) {
//       console.error("Copy failed:", err);
//       return;
//     }
//     setCopiedId(m.id);
//     setMsgMenu(null);
//     setTimeout(() => setCopiedId(null), 1800);
//   }

//   function resolveForwardSenderName(m: any): string {
//     if (!m) return "user";
//     if (m.senderId === myUid) return "You";
//     return otherUser?.username || "user";
//   }

//   function buildForwardPayload() {
//     return {
//       text: forwardData.text,
//       imageUrl: forwardData.imageUrl,
//       voiceUrl: forwardData.voiceUrl,
//       duration: forwardData.duration,
//       waveform: forwardData.waveform,
//       senderId: forwardData.senderId,
//       senderName: resolveForwardSenderName(forwardData),
//       chatId: chatId!,
//       messageId: forwardData.id,
//       forwardedFrom: forwardData.forwardedFrom || null,
//     };
//   }

//   async function handleWallpaperChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     e.target.value = "";
//     if (!file || !chatId) return;
//     try {
//       const url = await uploadToCloudinary(file, "chat_wallpapers");
//       await updateDoc(doc(db, "chats", chatId), {
//         wallpaper: { url, type: "image" },
//       });
//     } catch (err) {
//       console.error("Wallpaper change failed:", err);
//     }
//   }

//   async function removeWallpaper() {
//     if (!chatId) return;
//     setMenuOpen(false);
//     try {
//       await updateDoc(doc(db, "chats", chatId), { wallpaper: null });
//     } catch (err) {
//       console.error("Wallpaper remove failed:", err);
//     }
//   }

//   async function handleStartCall(type: "audio" | "video") {
//     if (!myUid || !chatId || !otherUser?.id || callBusyRef.current) return;
//     callBusyRef.current = true;
//     try {
//       let myName = "User";
//       let myAvatar: string | null = null;
//       try {
//         const mySnap = await getDoc(doc(db, "users", myUid));
//         if (mySnap.exists()) {
//           const data = mySnap.data();
//           myName = data?.username || myName;
//           myAvatar = data?.avatar ?? null;
//         }
//       } catch (err) {
//         console.error("Failed to load own profile for call:", err);
//       }

//       const { callId, roomName } = await createCall({
//         callerId: myUid,
//         callerName: myName,
//         callerAvatar: myAvatar,
//         calleeId: otherUser.id,
//         calleeName: otherUser.username ?? "User",
//         calleeAvatar: otherUser.avatar ?? null,
//         chatId,
//         type,
//       });

//       const token = await fetchLiveKitToken(callId, roomName, myName);

//       setLivekitToken(token);
//       setCallStoreMyUid(myUid);
//       setActiveCall({
//         id: callId,
//         roomName,
//         type,
//         status: "ringing",
//         callerId: myUid,
//         callerName: myName,
//         callerAvatar: myAvatar,
//         calleeId: otherUser.id,
//         calleeName: otherUser.username ?? "User",
//         calleeAvatar: otherUser.avatar ?? null,
//         chatId,
//       } as any);
//     } catch (err) {
//       console.error("Start call failed:", err);
//     } finally {
//       callBusyRef.current = false;
//     }
//   }

//   const rows = useMemo<Row[]>(() => {
//     const consumed = new Set<number>();
//     const visiblePending = pendingMessages.filter((p) => {
//       const idx = messages.findIndex(
//         (m, i) =>
//           !consumed.has(i) &&
//           m.senderId === p.senderId &&
//           (m.text || "") === (p.text || "") &&
//           (m.imageUrl || null) === (p.imageUrl || null)
//       );
//       if (idx === -1) return true;
//       consumed.add(idx);
//       return false;
//     });
//     const all = [...messages, ...visiblePending].filter((m) => !m.deleted);

//     const joins = (a: any, b: any) => {
//       if (!a || !b) return false;
//       if (a.senderId !== b.senderId || b.id === firstUnreadId) return false;
//       const da = toDate(a.createdAt);
//       const db_ = toDate(b.createdAt);
//       return (
//         dayKey(da) === dayKey(db_) &&
//         Math.abs(db_.getTime() - da.getTime()) < GROUP_GAP_MS
//       );
//     };

//     const out: Row[] = [];
//     let prevDay = "";
//     all.forEach((m, i) => {
//       const d = toDate(m.createdAt);
//       const dk = dayKey(d);
//       if (dk !== prevDay) {
//         out.push({ type: "date", key: `date-${dk}`, label: formatDayLabel(d) });
//         prevDay = dk;
//       }
//       out.push({
//         type: "msg",
//         m,
//         isFirstInGroup: !joins(all[i - 1], m),
//         isLastInGroup: !joins(m, all[i + 1]),
//       });
//     });
//     return out;
//   }, [messages, pendingMessages, firstUnreadId]);

//   const currentMsgMenu = msgMenu
//     ? messages.find((m) => m.id === msgMenu.id)
//     : null;

//   if (!chatId) {
//     return (
//       <div
//         className="relative flex w-full h-full items-center justify-center overflow-hidden"
//         style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
//       >
//         <div className="pointer-events-none absolute inset-0 overflow-hidden">
//           <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
//           <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
//         </div>
//         <span className="relative z-10 text-sm font-bold text-zinc-500">
//           Select a conversation in the Nexo
//         </span>
//       </div>
//     );
//   }

//   return (
//     <>
//       {msgMenu && currentMsgMenu && (
//         <div
//           ref={msgMenuRef}
//           className="msg-ctx-menu fixed z-[100] min-w-[168px] rounded-2xl bg-[#0d0b17]/95 border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
//           style={
//             msgMenu.openUpward
//               ? {
//                 bottom: window.innerHeight - msgMenu.y,
//                 right: window.innerWidth - msgMenu.x - 8,
//               }
//               : { top: msgMenu.y, right: window.innerWidth - msgMenu.x - 8 }
//           }
//           onClick={(e) => e.stopPropagation()}
//         >
//           {msgMenu.isMine && currentMsgMenu.text && !currentMsgMenu.imageUrl && (
//             <button
//               className="ctx-item text-zinc-300"
//               onClick={() => startEdit(currentMsgMenu)}
//             >
//               <Pencil size={14} className="text-zinc-500" />
//               Edit message
//             </button>
//           )}
//           <button
//             className="ctx-item text-zinc-300"
//             onClick={() => {
//               handleReply(currentMsgMenu);
//               setMsgMenu(null);
//             }}
//           >
//             <CornerUpLeft size={14} className="text-zinc-500" />
//             Reply
//           </button>
//           {currentMsgMenu.text && (
//             <button
//               className="ctx-item text-zinc-300"
//               onClick={() => handleCopy(currentMsgMenu)}
//             >
//               <Copy size={14} className="text-zinc-500" />
//               {copiedId === currentMsgMenu.id ? "Copied!" : "Copy text"}
//             </button>
//           )}
//           <button
//             className="ctx-item text-zinc-300"
//             onClick={() => handlePin(currentMsgMenu)}
//           >
//             {pinnedMessage?.id === currentMsgMenu.id ? (
//               <PinOff size={14} className="text-zinc-500" />
//             ) : (
//               <Pin size={14} className="text-zinc-500" />
//             )}
//             {pinnedMessage?.id === currentMsgMenu.id ? "Unpin" : "Pin message"}
//           </button>
//           <button
//             className="ctx-item text-zinc-300"
//             onClick={() => {
//               setForwardData(currentMsgMenu);
//               setMsgMenu(null);
//             }}
//           >
//             <Forward size={14} className="text-zinc-500" />
//             Forward
//           </button>
//           {msgMenu.isMine && (
//             <>
//               <div className="ctx-divider" />
//               <button
//                 className="ctx-item text-red-400"
//                 onClick={() => handleDelete(currentMsgMenu.id)}
//               >
//                 <Trash2 size={14} className="text-red-400/60" />
//                 Delete
//               </button>
//             </>
//           )}
//         </div>
//       )}

//       {lightboxUrl && (
//         <div
//           className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
//           onClick={() => setLightboxUrl(null)}
//         >
//           <div className="absolute top-4 right-4 flex items-center gap-2">
//             <a
//               href={lightboxUrl}
//               download
//               target="_blank"
//               rel="noreferrer"
//               aria-label="Download"
//               onClick={(e) => e.stopPropagation()}
//               className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
//             >
//               <Download size={16} />
//             </a>
//             <button
//               onClick={() => setLightboxUrl(null)}
//               aria-label="Close"
//               className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
//             >
//               <X size={16} />
//             </button>
//           </div>
//           {isVideo(lightboxUrl) ? (
//             <video
//               src={lightboxUrl}
//               controls
//               autoPlay
//               className="lightbox-img max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
//               onClick={(e) => e.stopPropagation()}
//             />
//           ) : (
//             <img
//               src={lightboxUrl}
//               alt="photo"
//               className="lightbox-img max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
//               onClick={(e) => e.stopPropagation()}
//             />
//           )}
//         </div>
//       )}

//       {profileOpen && otherUser?.id && (
//         <ProfileModal userId={otherUser.id} onClose={() => setProfileOpen(false)} />
//       )}

//       {deleteConfirmId && (
//         <ConfirmDialog
//           icon={<Trash2 size={18} className="text-red-400" />}
//           title="Delete message?"
//           description="This action cannot be undone. The message will be permanently removed for everyone."
//           onCancel={() => setDeleteConfirmId(null)}
//           onConfirm={confirmDelete}
//         />
//       )}

//       {deleteChatConfirm && (
//         <ConfirmDialog
//           icon={<Trash2 size={18} className="text-red-400" />}
//           title="Delete chat?"
//           description="This will permanently delete the entire conversation. This action cannot be undone."
//           onCancel={() => setDeleteChatConfirm(false)}
//           onConfirm={confirmDeleteChat}
//         />
//       )}

//       {forwardData && myUid && (
//         <ForwardPicker
//           myUid={myUid}
//           onClose={() => setForwardData(null)}
//           onSelectChat={async (targetChatId) => {
//             await forwardMessageToChat(targetChatId, myUid, buildForwardPayload());
//             setForwardData(null);
//           }}
//           onSelectChannel={async (channelId) => {
//             await forwardMessageToChannel(channelId, myUid, buildForwardPayload());
//             setForwardData(null);
//           }}
//           onSelectGroup={async (groupId) => {
//             await forwardMessageToGroup(groupId, myUid, buildForwardPayload());
//             setForwardData(null);
//           }}
//         />
//       )}

//       <div
//         className="relative flex flex-col w-full h-full overflow-hidden"
//         style={{
//           background: wallpaper?.url
//             ? `url(${wallpaper.url}) center/cover no-repeat`
//             : "var(--color-chat-bg)",
//           color: "var(--color-text)",
//         }}
//         onDragEnter={handleDragEnter}
//         onDragLeave={handleDragLeave}
//         onDragOver={handleDragOver}
//         onDrop={handleDrop}
//       >
//         {wallpaper?.url ? (
//           <div className="absolute inset-0 z-0 pointer-events-none bg-black/40" />
//         ) : (
//           <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
//             <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
//             <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
//           </div>
//         )}

//         {isDraggingFile && (
//           <div className="absolute inset-2 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#7c5cff] bg-[#0d0b17]/85 pointer-events-none">
//             <div className="flex flex-col items-center gap-2 text-[#a893ff]">
//               <ImageIcon size={32} />
//               <span className="text-sm font-semibold">
//                 Drop image or video to send
//               </span>
//             </div>
//           </div>
//         )}

//         <div className="flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90 relative z-20">
//           <div className="h-14 flex items-center justify-between px-5">
//             <button
//               onClick={() => setProfileOpen(true)}
//               className="flex items-center gap-3 cursor-pointer group"
//             >
//               <div className="relative shrink-0">
//                 {otherUser?.avatar ? (
//                   <img
//                     src={otherUser.avatar}
//                     alt={otherUser.username ?? "User"}
//                     className="w-9 h-9 rounded-full object-cover ring-1 ring-white/[0.08]"
//                   />
//                 ) : (
//                   <div className="w-9 h-9 rounded-full bg-[#522fb7]/30 flex items-center justify-center text-sm font-semibold text-white/80 ring-1 ring-white/[0.08]">
//                     {(otherUser?.username?.[0] ?? "?").toUpperCase()}
//                   </div>
//                 )}
//                 {otherUser && isOnline(otherUser) && (
//                   <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-[#34D399] border-2 border-[#0d0b17]" />
//                 )}
//               </div>

//               <div className="flex flex-col items-start min-w-0">
//                 <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">
//                   {otherUser?.username ?? "..."}
//                   {otherUser?.featuredGift && GIFTS[otherUser.featuredGift] && (
//                     <img
//                       src={GIFTS[otherUser.featuredGift].imageUrl}
//                       alt={GIFTS[otherUser.featuredGift].name}
//                       title={GIFTS[otherUser.featuredGift].name}
//                       className="shrink-0 w-4 h-4 object-contain"
//                       style={{
//                         filter: `drop-shadow(0 0 3px ${RARITY_COLORS[GIFTS[otherUser.featuredGift].rarity]
//                           }90)`,
//                       }}
//                     />
//                   )}
//                 </span>

//                 {otherUser && (
//                   <span className="text-[11px] leading-tight">
//                     {typingUsers.length > 0 ? (
//                       <span className="flex items-center gap-1 text-[#a893ff]">
//                         typing
//                         <span className="typing-dots">
//                           <span className="typing-dot" />
//                           <span className="typing-dot" />
//                           <span className="typing-dot" />
//                         </span>
//                       </span>
//                     ) : isOnline(otherUser) ? (
//                       <span className="text-[#34D399]">Online</span>
//                     ) : (
//                       <span className="text-zinc-500">
//                         {formatLastSeen(otherUser.lastSeen)}
//                       </span>
//                     )}
//                   </span>
//                 )}
//               </div>
//             </button>

//             <div className="flex items-center gap-1">
//               <button
//                 onClick={() => handleStartCall("audio")}
//                 title="Voice call"
//                 aria-label="Voice call"
//                 className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-colors cursor-pointer"
//               >
//                 <Phone size={16} />
//               </button>
//               <button
//                 onClick={() => handleStartCall("video")}
//                 title="Video call"
//                 aria-label="Video call"
//                 className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-colors cursor-pointer"
//               >
//                 <Video size={16} />
//               </button>

//               <div className="relative" ref={menuRef}>
//                 <button
//                   onClick={() => setMenuOpen((v) => !v)}
//                   aria-label="Chat menu"
//                   className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//                 >
//                   <MoreVertical size={16} />
//                 </button>
//                 {galleryOpen && (
//                   <MediaGallery chatId={chatId} onClose={() => setGalleryOpen(false)} />
//                 )}
//                 {menuOpen && (
//                   <div className="msg-ctx-menu absolute right-0 top-10 w-48 rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
//                     <button
//                       className="ctx-item text-zinc-300"
//                       onClick={() => {
//                         setGalleryOpen(true);
//                         setMenuOpen(false);
//                       }}
//                     >
//                       <ImageIcon size={14} className="text-zinc-500" />
//                       Media gallery
//                     </button>
//                     <button
//                       className="ctx-item text-zinc-300"
//                       onClick={() => {
//                         wallpaperInputRef.current?.click();
//                         setMenuOpen(false);
//                       }}
//                     >
//                       <ImagePlus size={14} className="text-zinc-500" />
//                       Change wallpaper
//                     </button>
//                     {wallpaper?.url && (
//                       <button className="ctx-item text-zinc-300" onClick={removeWallpaper}>
//                         <ImageOff size={14} className="text-zinc-500" />
//                         Remove wallpaper
//                       </button>
//                     )}
//                     <div className="ctx-divider" />
//                     <button
//                       className="ctx-item text-red-400"
//                       onClick={() => {
//                         setDeleteChatConfirm(true);
//                         setMenuOpen(false);
//                       }}
//                     >
//                       <Trash2 size={14} className="text-red-400/60" />
//                       Delete chat
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {pinnedMessage && (
//             <div
//               onClick={() => scrollToMessage(pinnedMessage.id)}
//               className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.05] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
//             >
//               <Pin size={12} className="text-[#a893ff] shrink-0" />
//               <div className="flex-1 min-w-0">
//                 <div className="text-[11px] font-medium text-[#a893ff] leading-none mb-0.5">
//                   Pinned message
//                 </div>
//                 <div className="text-xs text-zinc-400 truncate">
//                   {pinnedMessage.text}
//                 </div>
//               </div>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   pinMessage(chatId, null, null);
//                 }}
//                 aria-label="Unpin message"
//                 className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
//               >
//                 <X size={12} />
//               </button>
//             </div>
//           )}
//         </div>

//         <div
//           ref={chatScrollRef}
//           onScroll={handleScroll}
//           className="chat-scroll relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 min-h-0"
//         >
//           <div ref={topSentinelRef} className="h-px" aria-hidden />
//           {isLoadingOlder && (
//             <div className="flex justify-center py-2 text-xs text-zinc-500">
//               Loading earlier messages…
//             </div>
//           )}

//           {rows.map((row) => {
//             if (row.type === "date") {
//               return (
//                 <div key={row.key} className="flex justify-center pt-3 pb-1">
//                   <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#b9a8ff] bg-[#12111f]/80 border border-[#7c5cff]/20 shadow-sm shadow-black/30">
//                     {row.label}
//                   </span>
//                 </div>
//               );
//             }
//             const { m } = row;
//             const isMine = m.senderId === myUid;
//             const isPickerOpen = pickerOpenId === m.id;
//             return (
//               <MessageRow
//                 key={m.id}
//                 m={m}
//                 myUid={myUid}
//                 isMine={isMine}
//                 isRead={isMine && (m.readBy || []).includes(otherUser?.id)}
//                 isFirstInGroup={row.isFirstInGroup}
//                 isLastInGroup={row.isLastInGroup}
//                 isUnreadStart={firstUnreadId === m.id}
//                 isPickerOpen={isPickerOpen}
//                 pickerExpanded={isPickerOpen && pickerExpanded}
//                 isPinned={pinnedMessage?.id === m.id}
//                 isEditing={editingId === m.id}
//                 animate={!!m.pending || freshIds.has(m.id)}
//                 onReply={handleReply}
//                 onOpenPicker={openPicker}
//                 onExpandPicker={expandPicker}
//                 onOpenMenu={openMsgMenu}
//                 onReact={handleReact}
//                 onScrollToMessage={scrollToMessage}
//                 onOpenLightbox={openLightbox}
//                 onMediaLoad={handleMediaLoad}
//                 onSubmitEdit={submitEdit}
//                 onCancelEdit={cancelEdit}
//               />
//             );
//           })}

//           {showScrollButton && (
//             <button
//               onClick={() => {
//                 const el = chatScrollRef.current;
//                 el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
//                 isNearBottom.current = true;
//                 setShowScrollButton(false);
//               }}
//               title="Scroll to bottom"
//               aria-label="Scroll to bottom"
//               className="sticky float-right z-20 bottom-2 w-10 h-10 flex items-center justify-center rounded-full bg-[#12111f] border border-white/[0.10] shadow-lg shadow-black/40 text-[#a893ff] hover:bg-[#1b1633] hover:scale-105 active:scale-95 transition-all cursor-pointer"
//             >
//               <ChevronDown size={18} />
//             </button>
//           )}
//         </div>

//         <Composer
//           key={chatId}
//           ref={composerRef}
//           chatId={chatId}
//           myUid={myUid}
//           replyMessage={replyMessage}
//           onCancelReply={cancelReply}
//           onSend={handleSend}
//           onSendVoice={handleVoiceSend}
//         />

//         <input
//           type="file"
//           accept="image/*"
//           className="hidden"
//           ref={wallpaperInputRef}
//           onChange={handleWallpaperChange}
//         />
//       </div>
//     </>
//   );
// }


"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatLastSeen, isOnline } from "@/lib/formatLastSeen";
import { useChatStore } from "@/store/chat-store";
import {
  subscribeToMessages,
  loadOlderMessages,
  sendMessage,
  sendVoiceMessage,
  markMessageRead,
  toggleReaction,
  editMessage,
  deleteMessage,
  pinMessage,
  forwardMessageToChat,
} from "@/lib/firestore/chats";
import { forwardMessageToChannel } from "@/lib/firestore/channels";
import { forwardMessageToGroup } from "@/lib/firestore/groups";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import {
  X,
  CornerUpLeft,
  MoreVertical,
  Trash2,
  ImageIcon,
  ImagePlus,
  ImageOff,
  Download,
  Pencil,
  Pin,
  PinOff,
  Copy,
  ChevronDown,
  Forward,
  Phone,
  Video,
} from "lucide-react";
import ProfileModal from "../profile-modal/ProfileModal";
import MediaGallery from "../media-gallery/MediaGallery";
import ForwardPicker from "@/components/molecules/forward-picker/ForwardPicker";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";
import { createCall, fetchLiveKitToken } from "@/lib/calls";
import { useCallStore } from "@/store/call-store";
import { disintegrate } from "@/lib/disintegrate";

import MessageRow from "./MessageRow";
import Composer, { ComposerHandle, SendPayload } from "./Composer";
import GroupWallpaper, {
  getCachedWallpaper,
  cacheWallpaper,
} from "../group/GroupWallpaper";
import {
  ConfirmDialog,
  dayKey,
  formatDayLabel,
  isVideo,
  toDate,
  uploadToCloudinary,
} from "./chat-shared";
import "./chat-window.css";

const NEAR_BOTTOM_THRESHOLD = 120;
const GROUP_GAP_MS = 5 * 60 * 1000;
const PRIORITY_TAIL = 8;

interface MsgMenuState {
  id: string;
  x: number;
  y: number;
  openUpward: boolean;
  isMine: boolean;
}

type Row =
  | { type: "date"; key: string; label: string }
  | {
    type: "msg";
    m: any;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    priority: boolean;
  };

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function ChatWindow() {
  const chatId = useChatStore((s) => s.activeChatId);
  const markOpened = useChatStore((s) => s.markOpened);
  const setActiveCall = useCallStore((s) => s.setActiveCall);
  const setLivekitToken = useCallStore((s) => s.setLivekitToken);
  const setCallStoreMyUid = useCallStore((s) => s.setMyUid);
  const isWindowVisible = useWindowVisibilityStore((s) => s.isVisible);

  const [messages, setMessages] = useState<any[]>([]);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msgMenu, setMsgMenu] = useState<MsgMenuState | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteChatConfirm, setDeleteChatConfirm] = useState(false);
  const [wallpaper, setWallpaper] = useState<any>(null);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [forwardData, setForwardData] = useState<any | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());

  const menuRef = useRef<HTMLDivElement | null>(null);
  const msgMenuRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<ComposerHandle | null>(null);

  const isNearBottom = useRef(true);
  const unreadComputedForChat = useRef<string | null>(null);
  const activeChatIdRef = useRef<string | null>(chatId);
  const confirmedMessageIdsRef = useRef<Set<string>>(new Set());
  const scrollIntentRef = useRef<"initial" | "follow" | "force" | null>(null);
  const dragCounter = useRef(0);
  const isLoadingOlderRef = useRef(false);
  const olderMessageIdsRef = useRef<Set<string>>(new Set());
  const readReceiptIdsRef = useRef<Set<string>>(new Set());
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  const visibleRef = useRef(isWindowVisible);
  const unreadRef = useRef(0);
  const callBusyRef = useRef(false);
  const loadOlderRef = useRef<() => void>(() => { });

  useLayoutEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  useLayoutEffect(() => {
    visibleRef.current = isWindowVisible;
  }, [isWindowVisible]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
  }, []);

  useEffect(() => {
    if (!chatId || !myUid) return;
    const [uid1, uid2] = chatId.split("_");
    const otherUid = uid1 === myUid ? uid2 : uid1;
    const unsub = onSnapshot(doc(db, "users", otherUid), (snap) => {
      if (snap.exists()) setOtherUser({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [chatId, myUid]);

  useLayoutEffect(() => {
    setPendingMessages((previous) => {
      previous.forEach((message) => {
        if (
          typeof message.imageUrl === "string" &&
          message.imageUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(message.imageUrl);
        }
      });
      return [];
    });
    setMessages([]);
    setFirstUnreadId(null);
    setShowScrollButton(false);
    setTypingUsers([]);
    setReplyMessage(null);
    setEditingId(null);
    setPickerOpenId(null);
    setMsgMenu(null);
    setFreshIds(new Set());
    // обои из кэша сразу, без мигания при переключении чата
    setWallpaper(chatId ? getCachedWallpaper(chatId) : null);
    unreadComputedForChat.current = null;
    isNearBottom.current = true;
    confirmedMessageIdsRef.current = new Set();
    scrollIntentRef.current = null;
    setHasMoreMessages(false);
    setIsLoadingOlder(false);
    isLoadingOlderRef.current = false;
    olderMessageIdsRef.current = new Set();
    readReceiptIdsRef.current = new Set();
    preserveScrollRef.current = null;
    unreadRef.current = 0;
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    const unsub = subscribeToMessages(chatId, (msgs, hasMore) => {
      if (activeChatIdRef.current !== chatId) return;
      setHasMoreMessages(hasMore);

      const isFirstLoadForThisChat = unreadComputedForChat.current !== chatId;
      const prevIds = confirmedMessageIdsRef.current;
      const nextIds = new Set<string>(msgs.map((m) => m.id));
      const hasNewConfirmedMessage = [...nextIds].some((id) => !prevIds.has(id));
      confirmedMessageIdsRef.current = nextIds;

      if (isFirstLoadForThisChat) {
        scrollIntentRef.current = "initial";
      } else {
        if (hasNewConfirmedMessage && isNearBottom.current) {
          scrollIntentRef.current = "follow";
        }
        const added = msgs
          .filter((m) => !prevIds.has(m.id) && m.senderId !== myUid)
          .map((m) => m.id);
        if (added.length) {
          setFreshIds((prev) => new Set([...prev, ...added]));
        }
      }

      if (isFirstLoadForThisChat) {
        unreadComputedForChat.current = chatId;
        const firstUnread = msgs.find(
          (m) => m.senderId !== myUid && !(m.readBy || []).includes(myUid)
        );
        setFirstUnreadId(firstUnread ? firstUnread.id : null);
      }

      setMessages((previous) => [
        ...previous.filter(
          (message) =>
            olderMessageIdsRef.current.has(message.id) && !nextIds.has(message.id)
        ),
        ...msgs,
      ]);

      setPendingMessages((previous) => {
        if (!previous.length) return previous;
        const consumed = new Set<number>();
        const next = previous.filter((pending) => {
          const isBlob =
            typeof pending.imageUrl === "string" &&
            pending.imageUrl.startsWith("blob:");
          const matchIndex = msgs.findIndex(
            (message, index) =>
              !consumed.has(index) &&
              message.senderId === pending.senderId &&
              (message.text || "") === (pending.text || "") &&
              (isBlob
                ? Boolean(message.imageUrl)
                : (message.imageUrl || null) === (pending.imageUrl || null))
          );
          if (matchIndex === -1) return true;
          consumed.add(matchIndex);
          if (isBlob) URL.revokeObjectURL(pending.imageUrl);
          return false;
        });
        return next.length === previous.length ? previous : next;
      });
    });
    return () => unsub();
  }, [chatId, myUid]);

  useEffect(() => {
    if (!chatId || !myUid || !isWindowVisible) return;
    const ids = messages
      .filter(
        (m) =>
          m.senderId !== myUid &&
          !(m.readBy || []).includes(myUid) &&
          !readReceiptIdsRef.current.has(m.id)
      )
      .map((m) => m.id);
    ids.forEach((id) => {
      readReceiptIdsRef.current.add(id);
      markMessageRead(chatId, id, myUid).catch(() => {
        readReceiptIdsRef.current.delete(id);
      });
    });
  }, [messages, chatId, myUid, isWindowVisible]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      if (activeChatIdRef.current !== chatId) return;
      const data = snap.data();

      const typingList = data?.typing
        ? Object.entries(data.typing)
          .filter(([uid, val]) => val && uid !== myUid)
          .map(([uid]) => uid)
        : [];
      setTypingUsers((prev) => (sameList(prev, typingList) ? prev : typingList));

      const pin = data?.pinnedMessage || null;
      setPinnedMessage((prev) =>
        prev?.id === pin?.id && prev?.text === pin?.text ? prev : pin
      );

      const wp = data?.wallpaper || null;
      cacheWallpaper(chatId, wp);
      setWallpaper((prev: any) =>
        (prev?.url ?? null) === (wp?.url ?? null) ? prev : wp
      );

      const unread = data?.unreadCount?.[myUid] || 0;
      unreadRef.current = unread;
      if (unread > 0 && visibleRef.current) {
        unreadRef.current = 0;
        updateDoc(doc(db, "chats", chatId), {
          [`unreadCount.${myUid}`]: 0,
        }).catch(() => { });
      }
    });
    return () => unsub();
  }, [chatId, myUid]);

  useEffect(() => {
    if (!isWindowVisible || !chatId || !myUid || unreadRef.current <= 0) return;
    unreadRef.current = 0;
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 }).catch(
      () => { }
    );
  }, [isWindowVisible, chatId, myUid]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    markOpened(chatId);
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 }).catch(
      () => { }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, myUid]);

  useEffect(() => {
    if (typeof window.electronAPI?.onWindowVisibilityChange === "function") {
      window.electronAPI.onWindowVisibilityChange((visible: boolean) => {
        useWindowVisibilityStore.getState().setVisible(visible);
      });
    }
  }, []);

  function handleScroll() {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isNearBottom.current = nearBottom;
    setShowScrollButton((prev) => (prev === !nearBottom ? prev : !nearBottom));
  }

  async function loadOlder() {
    if (!chatId) return;
    if (isLoadingOlderRef.current || !hasMoreMessages) return;
    const oldest = messages[0];
    if (!oldest) return;

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);

    const el = chatScrollRef.current;
    preserveScrollRef.current = el
      ? { height: el.scrollHeight, top: el.scrollTop }
      : null;

    try {
      const { messages: older, hasMore } = await loadOlderMessages(chatId, oldest);
      if (activeChatIdRef.current !== chatId) return;
      setHasMoreMessages(hasMore);
      if (older.length) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const deduped = older.filter((m) => !existingIds.has(m.id));
          deduped.forEach((message) => olderMessageIdsRef.current.add(message.id));
          return [...deduped, ...prev];
        });
      } else {
        preserveScrollRef.current = null;
      }
    } finally {
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }

  useLayoutEffect(() => {
    loadOlderRef.current = loadOlder;
  });

  useEffect(() => {
    const root = chatScrollRef.current;
    const target = topSentinelRef.current;
    if (!root || !target || !hasMoreMessages) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlderRef.current();
      },
      { root, rootMargin: "200px 0px 0px 0px" }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [chatId, hasMoreMessages, messages.length]);

  useLayoutEffect(() => {
    const el = chatScrollRef.current;
    const preserved = preserveScrollRef.current;
    if (!el || !preserved) return;
    el.scrollTop = el.scrollHeight - preserved.height + preserved.top;
    preserveScrollRef.current = null;
  }, [messages]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
  }, []);

  const handleMediaLoad = useCallback(() => {
    if (isNearBottom.current) scrollToBottom();
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    if (!chatId) return;
    const intent = scrollIntentRef.current;
    if (!intent) return;
    if (intent === "initial" || intent === "force" || isNearBottom.current) {
      scrollToBottom();
      isNearBottom.current = true;
      setShowScrollButton(false);
    }
    scrollIntentRef.current = null;
  }, [chatId, messages, pendingMessages, scrollToBottom]);

  useEffect(() => {
    document.body.style.overflow = profileOpen || lightboxUrl ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [profileOpen, lightboxUrl]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  useEffect(() => {
    if (!pickerOpenId && !msgMenu) return;
    const handleClick = () => {
      setPickerOpenId(null);
      setPickerExpanded(false);
      setMsgMenu(null);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [pickerOpenId, msgMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      dragCounter.current++;
      setIsDraggingFile(true);
    }
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDraggingFile(false);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      composerRef.current?.attachFile(file);
    }
  }

  async function handleSend({ text, file, previewUrl, isVideo: wasVideo }: SendPayload) {
    if (!chatId || !myUid) return;
    const currentReply = replyMessage;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg = {
      id: tempId,
      senderId: myUid,
      text,
      imageUrl: previewUrl || undefined,
      isLocalVideo: wasVideo,
      replyTo: currentReply
        ? {
          id: currentReply.id,
          text: currentReply.text,
          imageUrl: currentReply.imageUrl,
        }
        : null,
      createdAt: new Date(),
      readBy: [],
      reactions: {},
      pending: true,
    };

    setPendingMessages((prev) => [...prev, optimisticMsg]);
    setReplyMessage(null);
    isNearBottom.current = true;
    scrollIntentRef.current = "force";

    try {
      let imageUrl: string | undefined;
      if (file) imageUrl = await uploadToCloudinary(file);
      await sendMessage(chatId, myUid, text, currentReply, imageUrl);
    } catch (err) {
      console.error("Send failed:", err);
      setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      if (text) composerRef.current?.restoreText(text);
    }
  }

  async function handleVoiceSend(r: {
    audioUrl: string;
    duration: number;
    waveform: number[];
  }) {
    if (!chatId || !myUid) return;
    const currentReply = replyMessage;
    setReplyMessage(null);
    isNearBottom.current = true;
    scrollIntentRef.current = "force";
    try {
      await sendVoiceMessage(
        chatId,
        myUid,
        currentReply,
        r.audioUrl,
        r.duration,
        r.waveform
      );
    } catch (err) {
      console.error("Voice send failed:", err);
    }
  }

  const handleReply = useCallback((m: any) => {
    setReplyMessage(m);
    composerRef.current?.focus();
  }, []);

  const handleReact = useCallback(
    async (messageId: string, token: string) => {
      if (!chatId || !myUid) return;
      setPickerOpenId(null);
      try {
        await toggleReaction(chatId, messageId, token, myUid);
      } catch (err) {
        console.error("Reaction failed:", err);
      }
    },
    [chatId, myUid]
  );

  const openPicker = useCallback((e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    setPickerOpenId((prev) => (prev === msgId ? null : msgId));
    setPickerExpanded(false);
    setMsgMenu(null);
  }, []);

  const expandPicker = useCallback(() => setPickerExpanded(true), []);

  const openMsgMenu = useCallback(
    (e: React.MouseEvent, msgId: string, isMine: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect?.() ?? {
        bottom: e.clientY,
        top: e.clientY,
      };
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 180;
      setMsgMenu((prev) =>
        prev?.id === msgId
          ? null
          : {
            id: msgId,
            x: e.clientX,
            y: openUpward ? rect.top : rect.bottom,
            openUpward,
            isMine,
          }
      );
      setPickerOpenId(null);
    },
    []
  );

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-flash");
    setTimeout(() => el.classList.remove("highlight-flash"), 1500);
  }, []);

  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const cancelEdit = useCallback(() => setEditingId(null), []);
  const cancelReply = useCallback(() => setReplyMessage(null), []);

  const submitEdit = useCallback(
    async (id: string, newText: string) => {
      if (!chatId) return;
      try {
        await editMessage(chatId, id, newText);
        setEditingId(null);
      } catch (err) {
        console.error("Edit failed:", err);
      }
    },
    [chatId]
  );

  function startEdit(m: any) {
    setEditingId(m.id);
    setMsgMenu(null);
  }

  function handleDelete(msgId: string) {
    setMsgMenu(null);
    setDeleteConfirmId(msgId);
  }

  async function confirmDelete() {
    if (!chatId || !deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    const el = document.querySelector<HTMLElement>(`[data-msg-anim="${id}"]`);
    try {
      if (el) await disintegrate(el);
      await deleteMessage(chatId, id);
    } catch (err) {
      console.error("Delete failed:", err);
      if (el) el.style.visibility = "";
    }
  }

  async function confirmDeleteChat() {
    if (!chatId || !myUid) return;
    try {
      await updateDoc(doc(db, "chats", chatId), { [`deleted.${myUid}`]: true });
      useChatStore.getState().setActiveChat(null);
    } catch (err) {
      console.error("Delete chat failed:", err);
    }
    setDeleteChatConfirm(false);
  }

  async function handlePin(m: any) {
    if (!chatId) return;
    setMsgMenu(null);
    const isAlreadyPinned = pinnedMessage?.id === m.id;
    try {
      await pinMessage(
        chatId,
        isAlreadyPinned ? null : m.id,
        isAlreadyPinned
          ? null
          : m.text || (m.voiceUrl ? "🎤 Voice message" : "📷 Photo")
      );
    } catch (err) {
      console.error("Pin failed:", err);
    }
  }

  async function handleCopy(m: any) {
    if (!m.text) return;
    try {
      await navigator.clipboard.writeText(m.text);
    } catch (err) {
      console.error("Copy failed:", err);
      return;
    }
    setCopiedId(m.id);
    setMsgMenu(null);
    setTimeout(() => setCopiedId(null), 1800);
  }

  function resolveForwardSenderName(m: any): string {
    if (!m) return "user";
    if (m.senderId === myUid) return "You";
    return otherUser?.username || "user";
  }

  function buildForwardPayload() {
    return {
      text: forwardData.text,
      imageUrl: forwardData.imageUrl,
      imageWidth: forwardData.imageWidth ?? null,
      imageHeight: forwardData.imageHeight ?? null,
      voiceUrl: forwardData.voiceUrl,
      duration: forwardData.duration,
      waveform: forwardData.waveform,
      senderId: forwardData.senderId,
      senderName: resolveForwardSenderName(forwardData),
      chatId: chatId!,
      messageId: forwardData.id,
      forwardedFrom: forwardData.forwardedFrom || null,
    };
  }

  async function handleWallpaperChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !chatId) return;
    try {
      const url = await uploadToCloudinary(file, "chat_wallpapers");
      await updateDoc(doc(db, "chats", chatId), {
        wallpaper: { url, type: "image" },
      });
    } catch (err) {
      console.error("Wallpaper change failed:", err);
    }
  }

  async function removeWallpaper() {
    if (!chatId) return;
    setMenuOpen(false);
    try {
      await updateDoc(doc(db, "chats", chatId), { wallpaper: null });
    } catch (err) {
      console.error("Wallpaper remove failed:", err);
    }
  }

  async function handleStartCall(type: "audio" | "video") {
    if (!myUid || !chatId || !otherUser?.id || callBusyRef.current) return;
    callBusyRef.current = true;
    try {
      let myName = "User";
      let myAvatar: string | null = null;
      try {
        const mySnap = await getDoc(doc(db, "users", myUid));
        if (mySnap.exists()) {
          const data = mySnap.data();
          myName = data?.username || myName;
          myAvatar = data?.avatar ?? null;
        }
      } catch (err) {
        console.error("Failed to load own profile for call:", err);
      }

      const { callId, roomName } = await createCall({
        callerId: myUid,
        callerName: myName,
        callerAvatar: myAvatar,
        calleeId: otherUser.id,
        calleeName: otherUser.username ?? "User",
        calleeAvatar: otherUser.avatar ?? null,
        chatId,
        type,
      });

      const token = await fetchLiveKitToken(callId, roomName, myName);

      setLivekitToken(token);
      setCallStoreMyUid(myUid);
      setActiveCall({
        id: callId,
        roomName,
        type,
        status: "ringing",
        callerId: myUid,
        callerName: myName,
        callerAvatar: myAvatar,
        calleeId: otherUser.id,
        calleeName: otherUser.username ?? "User",
        calleeAvatar: otherUser.avatar ?? null,
        chatId,
      } as any);
    } catch (err) {
      console.error("Start call failed:", err);
    } finally {
      callBusyRef.current = false;
    }
  }

  const rows = useMemo<Row[]>(() => {
    const consumed = new Set<number>();
    const visiblePending = pendingMessages.filter((p) => {
      const idx = messages.findIndex(
        (m, i) =>
          !consumed.has(i) &&
          m.senderId === p.senderId &&
          (m.text || "") === (p.text || "") &&
          (m.imageUrl || null) === (p.imageUrl || null)
      );
      if (idx === -1) return true;
      consumed.add(idx);
      return false;
    });
    const all = [...messages, ...visiblePending].filter((m) => !m.deleted);

    const joins = (a: any, b: any) => {
      if (!a || !b) return false;
      if (a.senderId !== b.senderId || b.id === firstUnreadId) return false;
      const da = toDate(a.createdAt);
      const db_ = toDate(b.createdAt);
      return (
        dayKey(da) === dayKey(db_) &&
        Math.abs(db_.getTime() - da.getTime()) < GROUP_GAP_MS
      );
    };

    const out: Row[] = [];
    let prevDay = "";
    all.forEach((m, i) => {
      const d = toDate(m.createdAt);
      const dk = dayKey(d);
      if (dk !== prevDay) {
        out.push({ type: "date", key: `date-${dk}`, label: formatDayLabel(d) });
        prevDay = dk;
      }
      out.push({
        type: "msg",
        m,
        isFirstInGroup: !joins(all[i - 1], m),
        isLastInGroup: !joins(m, all[i + 1]),
        priority: i >= all.length - PRIORITY_TAIL,
      });
    });
    return out;
  }, [messages, pendingMessages, firstUnreadId]);

  const currentMsgMenu = msgMenu
    ? messages.find((m) => m.id === msgMenu.id)
    : null;

  if (!chatId) {
    return (
      <div
        className="relative flex w-full h-full items-center justify-center overflow-hidden"
        style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
        </div>
        <span className="relative z-10 text-sm font-bold text-zinc-500">
          Select a conversation in the Nexo
        </span>
      </div>
    );
  }

  return (
    <>
      {msgMenu && currentMsgMenu && (
        <div
          ref={msgMenuRef}
          className="msg-ctx-menu fixed z-[100] min-w-[168px] rounded-2xl bg-[#0d0b17]/95 border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
          style={
            msgMenu.openUpward
              ? {
                bottom: window.innerHeight - msgMenu.y,
                right: window.innerWidth - msgMenu.x - 8,
              }
              : { top: msgMenu.y, right: window.innerWidth - msgMenu.x - 8 }
          }
          onClick={(e) => e.stopPropagation()}
        >
          {msgMenu.isMine && currentMsgMenu.text && !currentMsgMenu.imageUrl && (
            <button
              className="ctx-item text-zinc-300"
              onClick={() => startEdit(currentMsgMenu)}
            >
              <Pencil size={14} className="text-zinc-500" />
              Edit message
            </button>
          )}
          <button
            className="ctx-item text-zinc-300"
            onClick={() => {
              handleReply(currentMsgMenu);
              setMsgMenu(null);
            }}
          >
            <CornerUpLeft size={14} className="text-zinc-500" />
            Reply
          </button>
          {currentMsgMenu.text && (
            <button
              className="ctx-item text-zinc-300"
              onClick={() => handleCopy(currentMsgMenu)}
            >
              <Copy size={14} className="text-zinc-500" />
              {copiedId === currentMsgMenu.id ? "Copied!" : "Copy text"}
            </button>
          )}
          <button
            className="ctx-item text-zinc-300"
            onClick={() => handlePin(currentMsgMenu)}
          >
            {pinnedMessage?.id === currentMsgMenu.id ? (
              <PinOff size={14} className="text-zinc-500" />
            ) : (
              <Pin size={14} className="text-zinc-500" />
            )}
            {pinnedMessage?.id === currentMsgMenu.id ? "Unpin" : "Pin message"}
          </button>
          <button
            className="ctx-item text-zinc-300"
            onClick={() => {
              setForwardData(currentMsgMenu);
              setMsgMenu(null);
            }}
          >
            <Forward size={14} className="text-zinc-500" />
            Forward
          </button>
          {msgMenu.isMine && (
            <>
              <div className="ctx-divider" />
              <button
                className="ctx-item text-red-400"
                onClick={() => handleDelete(currentMsgMenu.id)}
              >
                <Trash2 size={14} className="text-red-400/60" />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={lightboxUrl}
              download
              target="_blank"
              rel="noreferrer"
              aria-label="Download"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => setLightboxUrl(null)}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          {isVideo(lightboxUrl) ? (
            <video
              src={lightboxUrl}
              controls
              autoPlay
              className="lightbox-img max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxUrl}
              alt="photo"
              className="lightbox-img max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {profileOpen && otherUser?.id && (
        <ProfileModal userId={otherUser.id} onClose={() => setProfileOpen(false)} />
      )}

      {deleteConfirmId && (
        <ConfirmDialog
          icon={<Trash2 size={18} className="text-red-400" />}
          title="Delete message?"
          description="This action cannot be undone. The message will be permanently removed for everyone."
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
        />
      )}

      {deleteChatConfirm && (
        <ConfirmDialog
          icon={<Trash2 size={18} className="text-red-400" />}
          title="Delete chat?"
          description="This will permanently delete the entire conversation. This action cannot be undone."
          onCancel={() => setDeleteChatConfirm(false)}
          onConfirm={confirmDeleteChat}
        />
      )}

      {forwardData && myUid && (
        <ForwardPicker
          myUid={myUid}
          onClose={() => setForwardData(null)}
          onSelectChat={async (targetChatId) => {
            await forwardMessageToChat(targetChatId, myUid, buildForwardPayload());
            setForwardData(null);
          }}
          onSelectChannel={async (channelId) => {
            await forwardMessageToChannel(channelId, myUid, buildForwardPayload());
            setForwardData(null);
          }}
          onSelectGroup={async (groupId) => {
            await forwardMessageToGroup(groupId, myUid, buildForwardPayload());
            setForwardData(null);
          }}
        />
      )}

      <div
        className="relative flex flex-col w-full h-full overflow-hidden"
        style={{
          background: "var(--color-chat-bg)",
          color: "var(--color-text)",
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {wallpaper?.url ? (
          <GroupWallpaper url={wallpaper.url} />
        ) : (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
            <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
          </div>
        )}

        {isDraggingFile && (
          <div className="absolute inset-2 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#7c5cff] bg-[#0d0b17]/85 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-[#a893ff]">
              <ImageIcon size={32} />
              <span className="text-sm font-semibold">
                Drop image or video to send
              </span>
            </div>
          </div>
        )}

        <div className="flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90 relative z-20">
          <div className="h-14 flex items-center justify-between px-5">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative shrink-0">
                {otherUser?.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.username ?? "User"}
                    width={36}
                    height={36}
                    decoding="async"
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-white/[0.08]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#522fb7]/30 flex items-center justify-center text-sm font-semibold text-white/80 ring-1 ring-white/[0.08]">
                    {(otherUser?.username?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                {otherUser && isOnline(otherUser) && (
                  <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-[#34D399] border-2 border-[#0d0b17]" />
                )}
              </div>

              <div className="flex flex-col items-start min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">
                  {otherUser?.username ?? "..."}
                  {otherUser?.featuredGift && GIFTS[otherUser.featuredGift] && (
                    <img
                      src={GIFTS[otherUser.featuredGift].imageUrl}
                      alt={GIFTS[otherUser.featuredGift].name}
                      title={GIFTS[otherUser.featuredGift].name}
                      width={16}
                      height={16}
                      decoding="async"
                      className="shrink-0 w-4 h-4 object-contain"
                      style={{
                        filter: `drop-shadow(0 0 3px ${RARITY_COLORS[GIFTS[otherUser.featuredGift].rarity]
                          }90)`,
                      }}
                    />
                  )}
                </span>

                {otherUser && (
                  <span className="text-[11px] leading-tight">
                    {typingUsers.length > 0 ? (
                      <span className="flex items-center gap-1 text-[#a893ff]">
                        typing
                        <span className="typing-dots">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </span>
                      </span>
                    ) : isOnline(otherUser) ? (
                      <span className="text-[#34D399]">Online</span>
                    ) : (
                      <span className="text-zinc-500">
                        {formatLastSeen(otherUser.lastSeen)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleStartCall("audio")}
                title="Voice call"
                aria-label="Voice call"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-colors cursor-pointer"
              >
                <Phone size={16} />
              </button>
              <button
                onClick={() => handleStartCall("video")}
                title="Video call"
                aria-label="Video call"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-colors cursor-pointer"
              >
                <Video size={16} />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Chat menu"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <MoreVertical size={16} />
                </button>
                {galleryOpen && (
                  <MediaGallery chatId={chatId} onClose={() => setGalleryOpen(false)} />
                )}
                {menuOpen && (
                  <div className="msg-ctx-menu absolute right-0 top-10 w-48 rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                    <button
                      className="ctx-item text-zinc-300"
                      onClick={() => {
                        setGalleryOpen(true);
                        setMenuOpen(false);
                      }}
                    >
                      <ImageIcon size={14} className="text-zinc-500" />
                      Media gallery
                    </button>
                    <button
                      className="ctx-item text-zinc-300"
                      onClick={() => {
                        wallpaperInputRef.current?.click();
                        setMenuOpen(false);
                      }}
                    >
                      <ImagePlus size={14} className="text-zinc-500" />
                      Change wallpaper
                    </button>
                    {wallpaper?.url && (
                      <button className="ctx-item text-zinc-300" onClick={removeWallpaper}>
                        <ImageOff size={14} className="text-zinc-500" />
                        Remove wallpaper
                      </button>
                    )}
                    <div className="ctx-divider" />
                    <button
                      className="ctx-item text-red-400"
                      onClick={() => {
                        setDeleteChatConfirm(true);
                        setMenuOpen(false);
                      }}
                    >
                      <Trash2 size={14} className="text-red-400/60" />
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {pinnedMessage && (
            <div
              onClick={() => scrollToMessage(pinnedMessage.id)}
              className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.05] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
            >
              <Pin size={12} className="text-[#a893ff] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[#a893ff] leading-none mb-0.5">
                  Pinned message
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {pinnedMessage.text}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinMessage(chatId, null, null);
                }}
                aria-label="Unpin message"
                className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={chatScrollRef}
          onScroll={handleScroll}
          className="chat-scroll relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 min-h-0"
        >
          <div ref={topSentinelRef} className="h-px" aria-hidden />
          {isLoadingOlder && (
            <div className="flex justify-center py-2 text-xs text-zinc-500">
              Loading earlier messages…
            </div>
          )}

          {rows.map((row) => {
            if (row.type === "date") {
              return (
                <div key={row.key} className="flex justify-center pt-3 pb-1">
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#b9a8ff] bg-[#12111f]/80 border border-[#7c5cff]/20 shadow-sm shadow-black/30">
                    {row.label}
                  </span>
                </div>
              );
            }
            const { m } = row;
            const isMine = m.senderId === myUid;
            const isPickerOpen = pickerOpenId === m.id;
            return (
              <MessageRow
                key={m.id}
                m={m}
                myUid={myUid}
                isMine={isMine}
                isRead={isMine && (m.readBy || []).includes(otherUser?.id)}
                isFirstInGroup={row.isFirstInGroup}
                isLastInGroup={row.isLastInGroup}
                isUnreadStart={firstUnreadId === m.id}
                isPickerOpen={isPickerOpen}
                pickerExpanded={isPickerOpen && pickerExpanded}
                isPinned={pinnedMessage?.id === m.id}
                isEditing={editingId === m.id}
                animate={!!m.pending || freshIds.has(m.id)}
                priority={row.priority}
                onReply={handleReply}
                onOpenPicker={openPicker}
                onExpandPicker={expandPicker}
                onOpenMenu={openMsgMenu}
                onReact={handleReact}
                onScrollToMessage={scrollToMessage}
                onOpenLightbox={openLightbox}
                onMediaLoad={handleMediaLoad}
                onSubmitEdit={submitEdit}
                onCancelEdit={cancelEdit}
              />
            );
          })}

          {showScrollButton && (
            <button
              onClick={() => {
                scrollToBottom(true);
                isNearBottom.current = true;
                setShowScrollButton(false);
              }}
              title="Scroll to bottom"
              aria-label="Scroll to bottom"
              className="sticky float-right z-20 bottom-2 w-10 h-10 flex items-center justify-center rounded-full bg-[#12111f] border border-white/[0.10] shadow-lg shadow-black/40 text-[#a893ff] hover:bg-[#1b1633] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>

        <Composer
          key={chatId}
          ref={composerRef}
          chatId={chatId}
          myUid={myUid}
          replyMessage={replyMessage}
          onCancelReply={cancelReply}
          onSend={handleSend}
          onSendVoice={handleVoiceSend}
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={wallpaperInputRef}
          onChange={handleWallpaperChange}
        />
      </div>
    </>
  );
}