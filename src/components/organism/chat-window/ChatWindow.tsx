// "use client";

// import {
//   memo,
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import dynamic from "next/dynamic";
// import { createPortal } from "react-dom";
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
//   addPinnedMessage,
//   removePinnedMessage,
//   readPins,
//   forwardMessageToChat,
//   type PinnedItem,
// } from "@/lib/firestore/chats";
// import { forwardMessageToChannel } from "@/lib/firestore/channels";
// import { forwardMessageToGroup } from "@/lib/firestore/groups";
// import { getCustomEmoji, CUSTOM_EMOJIS } from "@/lib/customEmoji";
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
//   Bookmark,
//   List,
//   Search,
// } from "lucide-react";
// import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
// import { useWindowVisibilityStore } from "@/store/window-visibility-store";
// import { createCall, fetchLiveKitToken } from "@/lib/calls";
// import { useCallStore } from "@/store/call-store";
// import { disintegrate } from "@/lib/disintegrate";
// import { getSavedChatId, SAVED_CHAT_TITLE } from "@/lib/savedChat";
// import { useMessageSearch } from "@/hooks/useMessageSearch";

// import MessageRow from "./MessageRow";
// import CallLogMessage from "./CallLogMessage";
// import Composer, { ComposerHandle, SendPayload } from "./Composer";
// import GroupSearchBar from "../group/GroupSearchBar";
// import GroupWallpaper, {
//   getCachedWallpaper,
//   cacheWallpaper,
// } from "../group/GroupWallpaper";
// import {
//   ConfirmDialog,
//   dayKey,
//   formatDayLabel,
//   isVideo,
//   toDate,
//   uploadToCloudinary,
// } from "./chat-shared";
// import "./chat-window.css";

// const ProfileModal = dynamic(() => import("../profile-modal/ProfileModal"));
// const MediaGallery = dynamic(() => import("../media-gallery/MediaGallery"));
// const ForwardPicker = dynamic(
//   () => import("@/components/molecules/forward-picker/ForwardPicker")
// );

// const NEAR_BOTTOM_THRESHOLD = 120;
// const GROUP_GAP_MS = 5 * 60 * 1000;
// const PRIORITY_TAIL = 8;
// const MENU_MARGIN = 8;
// const SCROLL_KEYS = [
//   "ArrowUp",
//   "ArrowDown",
//   "PageUp",
//   "PageDown",
//   "Home",
//   "End",
//   " ",
// ];

// const PIN_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
// const PIN_TOKEN_MATCH_RE = /^::([\w-]+)::$/;

// interface MsgMenuState {
//   id: string;
//   x: number;
//   y: number;
//   isMine: boolean;
// }

// interface MenuPos {
//   left: number;
//   top: number;
// }

// interface PendingMessageMatch {
//   senderId?: string;
//   text?: string;
//   imageUrl?: string | null;
// }

// type Row =
//   | { type: "date"; key: string; label: string }
//   | {
//     type: "msg";
//     m: any;
//     isFirstInGroup: boolean;
//     isLastInGroup: boolean;
//     priority: boolean;
//   };

// const PinText = memo(function PinText({ text }: { text: string }) {
//   const parts = text.split(PIN_TOKEN_SPLIT_RE);
//   return (
//     <>
//       {parts.map((part, i) => {
//         const match = part.match(PIN_TOKEN_MATCH_RE);
//         if (match) {
//           const custom = getCustomEmoji(match[1]);
//           if (custom) {
//             return (
//               <img
//                 key={i}
//                 src={custom.url}
//                 alt={custom.id}
//                 className="inline-block align-text-bottom w-4 h-4 object-contain mx-0.5"
//               />
//             );
//           }
//         }
//         return part ? <span key={i}>{part}</span> : null;
//       })}
//     </>
//   );
// });

// function sameList(a: string[], b: string[]) {
//   return a.length === b.length && a.every((v, i) => v === b[i]);
// }

// function samePins(a: PinnedItem[], b: PinnedItem[]) {
//   return (
//     a.length === b.length &&
//     a.every((p, i) => p.id === b[i].id && p.text === b[i].text)
//   );
// }

// function clamp(value: number, min: number, max: number) {
//   return Math.max(min, Math.min(value, max));
// }

// function isTypingTarget(target: EventTarget | null) {
//   const el = target as HTMLElement | null;
//   if (!el) return false;
//   const tag = el.tagName;
//   return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
// }

// function buildPinText(m: any): string {
//   if (m.text) return m.text;
//   if (m.voiceUrl) return "🎤 Voice message";
//   if (m.imageUrl) {
//     const sticker = CUSTOM_EMOJIS.find((e) => e.url === m.imageUrl);
//     if (sticker) return `::${sticker.id}::`;
//   }
//   return "📷 Photo";
// }

// function matchesPendingMessage(
//   pending: PendingMessageMatch,
//   message: PendingMessageMatch
// ) {
//   if (
//     pending.senderId !== message.senderId ||
//     (pending.text || "") !== (message.text || "")
//   ) {
//     return false;
//   }
//   return typeof pending.imageUrl === "string" && pending.imageUrl.startsWith("blob:")
//     ? Boolean(message.imageUrl)
//     : (pending.imageUrl || null) === (message.imageUrl || null);
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
//   const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
//   const [pinnedMessages, setPinnedMessages] = useState<PinnedItem[]>([]);
//   const [pinIndex, setPinIndex] = useState(0);
//   const [pinListOpen, setPinListOpen] = useState(false);
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

//   const messagesRef = useRef<any[]>([]);
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
//   const scrollLockedRef = useRef(false);
//   const pinsLenRef = useRef(0);
//   const loadOlderRef = useRef<() => Promise<void>>(async () => { });

//   const scrollLocked = Boolean(msgMenu) || Boolean(pickerOpenId);
//   const isSaved = !!chatId && !!myUid && chatId === getSavedChatId(myUid);

//   useLayoutEffect(() => {
//     activeChatIdRef.current = chatId;
//   }, [chatId]);

//   useLayoutEffect(() => {
//     visibleRef.current = isWindowVisible;
//   }, [isWindowVisible]);

//   useLayoutEffect(() => {
//     messagesRef.current = messages;
//   }, [messages]);

//   useLayoutEffect(() => {
//     scrollLockedRef.current = scrollLocked;
//   }, [scrollLocked]);

//   useEffect(() => {
//     return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
//   }, []);

//   useEffect(() => {
//     if (!chatId || !myUid || chatId === getSavedChatId(myUid)) return;
//     const [uid1, uid2] = chatId.split("_");
//     const otherUid = uid1 === myUid ? uid2 : uid1;
//     const unsub = onSnapshot(doc(db, "users", otherUid), (snap) => {
//       if (activeChatIdRef.current !== chatId) return;
//       setOtherUser(snap.exists() ? { id: snap.id, ...snap.data() } : null);
//     }, () => {
//       if (activeChatIdRef.current === chatId) setOtherUser(null);
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
//     setOtherUser(null);
//     setProfileOpen(false);
//     setFirstUnreadId(null);
//     setShowScrollButton(false);
//     setTypingUsers([]);
//     setReplyMessage(null);
//     setEditingId(null);
//     setPickerOpenId(null);
//     setMsgMenu(null);
//     setPinnedMessages([]);
//     setPinIndex(0);
//     setPinListOpen(false);
//     pinsLenRef.current = 0;
//     setFreshIds(new Set());
//     setWallpaper(chatId ? getCachedWallpaper(chatId) : null);
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
//               matchesPendingMessage(pending, message)
//           );
//           if (matchIndex === -1) return true;
//           consumed.add(matchIndex);
//           if (isBlob) URL.revokeObjectURL(pending.imageUrl);
//           return false;
//         });
//         return next.length === previous.length ? previous : next;
//       });
//     }, undefined, (error) => {
//       if (activeChatIdRef.current === chatId) console.error("Message listener failed:", error);
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

//       const pins = readPins(data);
//       const prevLen = pinsLenRef.current;
//       pinsLenRef.current = pins.length;
//       setPinnedMessages((prev) => (samePins(prev, pins) ? prev : pins));
//       if (pins.length > prevLen) {
//         setPinIndex(pins.length - 1);
//       } else {
//         setPinIndex((i) => Math.min(i, Math.max(0, pins.length - 1)));
//       }

//       const wp = data?.wallpaper || null;
//       cacheWallpaper(chatId, wp);
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
//   }, [chatId, myUid, markOpened]);

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

//   const loadOlder = useCallback(async () => {
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
//       if (activeChatIdRef.current === chatId) {
//         isLoadingOlderRef.current = false;
//         setIsLoadingOlder(false);
//       }
//     }
//   }, [chatId, hasMoreMessages, messages]);

//   useLayoutEffect(() => {
//     loadOlderRef.current = loadOlder;
//   });

//   useEffect(() => {
//     const root = chatScrollRef.current;
//     const target = topSentinelRef.current;
//     if (!root || !target || !hasMoreMessages) return;
//     const io = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting && !scrollLockedRef.current) loadOlderRef.current();
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

//   const scrollToBottom = useCallback((smooth = false) => {
//     if (scrollLockedRef.current) return;
//     const el = chatScrollRef.current;
//     if (!el) return;
//     if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
//     else el.scrollTop = el.scrollHeight;
//   }, []);

//   const handleMediaLoad = useCallback(() => {
//     if (isNearBottom.current) scrollToBottom();
//   }, [scrollToBottom]);

//   useLayoutEffect(() => {
//     if (!chatId) return;
//     const intent = scrollIntentRef.current;
//     if (!intent) return;
//     if (scrollLockedRef.current && intent !== "initial") {
//       scrollIntentRef.current = null;
//       return;
//     }
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
//     if (!pickerOpenId) return;
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setPickerOpenId(null);
//         setPickerExpanded(false);
//       }
//     };
//     window.addEventListener("keydown", handleKey);
//     return () => window.removeEventListener("keydown", handleKey);
//   }, [pickerOpenId]);

//   useEffect(() => {
//     if (!msgMenu) return;
//     const close = () => setMsgMenu(null);
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setMsgMenu(null);
//     };
//     window.addEventListener("resize", close);
//     window.addEventListener("keydown", handleKey);
//     return () => {
//       window.removeEventListener("resize", close);
//       window.removeEventListener("keydown", handleKey);
//     };
//   }, [msgMenu]);

//   useEffect(() => {
//     if (!pinListOpen) return;
//     const close = () => setPinListOpen(false);
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setPinListOpen(false);
//     };
//     window.addEventListener("click", close);
//     window.addEventListener("keydown", handleKey);
//     return () => {
//       window.removeEventListener("click", close);
//       window.removeEventListener("keydown", handleKey);
//     };
//   }, [pinListOpen]);

//   useEffect(() => {
//     if (pinnedMessages.length < 2) setPinListOpen(false);
//   }, [pinnedMessages.length]);

//   useEffect(() => {
//     const el = chatScrollRef.current;
//     if (!scrollLocked || !el) return;

//     const lockedTop = el.scrollTop;

//     const isAllowed = (target: EventTarget | null) => {
//       const node = target as HTMLElement | null;
//       if (!node || !(node instanceof Node)) return true;
//       if (!el.contains(node)) return true;
//       return Boolean(node.closest?.("[data-allow-scroll]"));
//     };

//     const blockScroll = (e: Event) => {
//       if (isAllowed(e.target)) return;
//       e.preventDefault();
//     };
//     const blockKeys = (e: KeyboardEvent) => {
//       if (isTypingTarget(e.target)) return;
//       if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
//     };
//     const blockScrollbar = (e: MouseEvent) => {
//       const rect = el.getBoundingClientRect();
//       if (e.clientX > rect.left + el.clientWidth) e.preventDefault();
//     };
//     const restore = () => {
//       if (el.scrollTop !== lockedTop) el.scrollTop = lockedTop;
//     };

//     window.addEventListener("wheel", blockScroll, { passive: false, capture: true });
//     window.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
//     el.addEventListener("mousedown", blockScrollbar, true);
//     el.addEventListener("scroll", restore);
//     window.addEventListener("keydown", blockKeys, true);
//     return () => {
//       window.removeEventListener("wheel", blockScroll, true);
//       window.removeEventListener("touchmove", blockScroll, true);
//       el.removeEventListener("mousedown", blockScrollbar, true);
//       el.removeEventListener("scroll", restore);
//       window.removeEventListener("keydown", blockKeys, true);
//     };
//   }, [scrollLocked]);

//   useLayoutEffect(() => {
//     if (!msgMenu) {
//       setMenuPos(null);
//       return;
//     }
//     const el = msgMenuRef.current;
//     if (!el) return;
//     const { width, height } = el.getBoundingClientRect();
//     const vw = window.innerWidth;
//     const vh = window.innerHeight;

//     let left = msgMenu.x;
//     if (left + width > vw - MENU_MARGIN) left = msgMenu.x - width;
//     left = clamp(left, MENU_MARGIN, Math.max(MENU_MARGIN, vw - width - MENU_MARGIN));

//     let top = msgMenu.y;
//     if (top + height > vh - MENU_MARGIN) top = msgMenu.y - height;
//     top = clamp(top, MENU_MARGIN, Math.max(MENU_MARGIN, vh - height - MENU_MARGIN));

//     setMenuPos((prev) =>
//       prev && prev.left === left && prev.top === top ? prev : { left, top }
//     );
//   }, [msgMenu, copiedId, pinnedMessages]);

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

//   const handleSend = useCallback(async ({ text, file, previewUrl, isVideo: wasVideo }: SendPayload) => {
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
//       let upload: Awaited<ReturnType<typeof uploadToCloudinary>> | undefined;
//       if (file) upload = await uploadToCloudinary(file);
//       await sendMessage(
//         chatId,
//         myUid,
//         text,
//         currentReply,
//         upload?.url,
//         upload?.width,
//         upload?.height
//       );
//     } catch (err) {
//       console.error("Send failed:", err);
//       if (activeChatIdRef.current === chatId) {
//         setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
//       }
//       if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
//       if (text && activeChatIdRef.current === chatId) composerRef.current?.restoreText(text);
//     }
//   }, [chatId, myUid, replyMessage]);

//   const handleVoiceSend = useCallback(async (r: {
//     audioUrl: string;
//     duration: number;
//     waveform: number[];
//   }) => {
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
//   }, [chatId, myUid, replyMessage]);

//   const handleReply = useCallback((m: any) => {
//     setReplyMessage(m);
//     composerRef.current?.focus();
//   }, []);

//   const handleReact = useCallback(
//     async (messageId: string, token: string) => {
//       if (!chatId || !myUid) return;
//       setPickerOpenId(null);
//       setPickerExpanded(false);

//       const target = messagesRef.current.find((m) => m.id === messageId);
//       if (!target) return;

//       const previous: Record<string, string[]> = target.reactions || {};
//       const hadThis = (previous[token] ?? []).includes(myUid);

//       const next: Record<string, string[]> = {};
//       for (const [key, uids] of Object.entries(previous)) {
//         next[key] = uids.filter((uid) => uid !== myUid);
//       }
//       if (!hadThis) next[token] = [...(next[token] ?? []), myUid];

//       const applyLocal = (reactions: Record<string, string[]>) => {
//         const list = messagesRef.current.map((m) =>
//           m.id === messageId ? { ...m, reactions } : m
//         );
//         messagesRef.current = list;
//         setMessages(list);
//       };

//       applyLocal(next);

//       try {
//         await toggleReaction(chatId, messageId, token, myUid, previous);
//       } catch (err) {
//         console.error("Reaction failed:", err);
//         applyLocal(previous);
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
//       setMenuPos(null);
//       setMsgMenu({ id: msgId, x: e.clientX, y: e.clientY, isMine });
//       setPickerOpenId(null);
//       setPickerExpanded(false);
//     },
//     []
//   );

//   const scrollToMessage = useCallback((id: string) => {
//     const el = document.getElementById(`msg-${id}`);
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "center" });
//     el.classList.remove("highlight-flash");
//     void el.offsetWidth;
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
//     if (!chatId || !myUid || isSaved) return;
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
//     const isAlreadyPinned = pinnedMessages.some((p) => p.id === m.id);
//     try {
//       if (isAlreadyPinned) {
//         await removePinnedMessage(chatId, m.id);
//       } else {
//         await addPinnedMessage(chatId, m.id, buildPinText(m));
//       }
//     } catch (err) {
//       console.error("Pin failed:", err);
//     }
//   }

//   async function handleUnpin(messageId: string) {
//     if (!chatId) return;
//     try {
//       await removePinnedMessage(chatId, messageId);
//     } catch (err) {
//       console.error("Unpin failed:", err);
//     }
//   }

//   function handlePinBannerClick() {
//     const total = pinnedMessages.length;
//     if (!total) return;
//     const index = Math.min(pinIndex, total - 1);
//     scrollToMessage(pinnedMessages[index].id);
//     setPinListOpen(false);
//     if (total > 1) setPinIndex((index - 1 + total) % total);
//   }

//   function handlePinListSelect(index: number) {
//     const target = pinnedMessages[index];
//     if (!target) return;
//     setPinIndex(index);
//     setPinListOpen(false);
//     scrollToMessage(target.id);
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

//   function buildForwardPayload(source: any) {
//     return {
//       text: source.text,
//       imageUrl: source.imageUrl,
//       imageWidth: source.imageWidth ?? null,
//       imageHeight: source.imageHeight ?? null,
//       voiceUrl: source.voiceUrl,
//       duration: source.duration,
//       waveform: source.waveform,
//       senderId: source.senderId,
//       senderName: resolveForwardSenderName(source),
//       chatId: chatId!,
//       messageId: source.id,
//       forwardedFrom: source.forwardedFrom || null,
//     };
//   }

//   async function handleSaveToSaved(m: any) {
//     if (!myUid) return;
//     setMsgMenu(null);
//     try {
//       await forwardMessageToChat(
//         getSavedChatId(myUid),
//         myUid,
//         buildForwardPayload(m)
//       );
//     } catch (err) {
//       console.error("Save to saved messages failed:", err);
//     }
//   }

//   async function handleWallpaperChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     e.target.value = "";
//     if (!file || !chatId) return;
//     try {
//       const { url } = await uploadToCloudinary(file, "chat_wallpapers");
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
//     if (isSaved) return;
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
//           matchesPendingMessage(p, m)
//       );
//       if (idx === -1) return true;
//       consumed.add(idx);
//       return false;
//     });
//     const all = [...messages, ...visiblePending].filter((m) => !m.deleted);

//     const joins = (a: any, b: any) => {
//       if (!a || !b) return false;
//       if (a.type === "call" || b.type === "call") return false;
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
//         priority: i >= all.length - PRIORITY_TAIL,
//       });
//     });
//     return out;
//   }, [messages, pendingMessages, firstUnreadId]);

//   const pinnedIds = useMemo(
//     () => new Set(pinnedMessages.map((p) => p.id)),
//     [pinnedMessages]
//   );

//   const {
//     searchOpen,
//     searchQuery,
//     setSearchQuery,
//     openSearch,
//     closeSearch,
//     matchCount,
//     activeIndex,
//     searching,
//     goOlder,
//     goNewer,
//   } = useMessageSearch({
//     messages,
//     hasMore: hasMoreMessages,
//     isLoadingOlderRef,
//     loadOlderRef,
//     scrollToMessage,
//     idPrefix: "msg-",
//     resetKey: chatId,
//     enabled: !!chatId,
//     renderToken: rows,
//   });

//   useEffect(() => {
//     if (searchOpen) setMenuOpen(false);
//   }, [searchOpen]);

//   function handleOpenSearch() {
//     setMenuOpen(false);
//     openSearch();
//   }

//   const safePinIndex = Math.min(pinIndex, Math.max(0, pinnedMessages.length - 1));
//   const currentPin = pinnedMessages[safePinIndex] ?? null;
//   const hasManyPins = pinnedMessages.length > 1;

//   const currentMsgMenu = msgMenu
//     ? messages.find((m) => m.id === msgMenu.id)
//     : null;
//   const isCurrentMenuPinned = currentMsgMenu
//     ? pinnedIds.has(currentMsgMenu.id)
//     : false;

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

//   const showSavedHint =
//     isSaved && rows.length === 0 && unreadComputedForChat.current === chatId;

//   return (
//     <>
//       {msgMenu &&
//         currentMsgMenu &&
//         typeof document !== "undefined" &&
//         createPortal(
//           <div
//             ref={msgMenuRef}
//             className="msg-ctx-menu fixed z-[1000] min-w-[168px] rounded-2xl bg-[#0d0b17]/95 border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
//             style={{
//               left: menuPos?.left ?? msgMenu.x,
//               top: menuPos?.top ?? msgMenu.y,
//               visibility: menuPos ? "visible" : "hidden",
//             }}
//             onClick={(e) => e.stopPropagation()}
//             onContextMenu={(e) => e.preventDefault()}
//           >
//             {msgMenu.isMine && currentMsgMenu.text && !currentMsgMenu.imageUrl && (
//               <button
//                 className="ctx-item text-zinc-300"
//                 onClick={() => startEdit(currentMsgMenu)}
//               >
//                 <Pencil size={14} className="text-zinc-500" />
//                 Edit message
//               </button>
//             )}
//             <button
//               className="ctx-item text-zinc-300"
//               onClick={() => {
//                 handleReply(currentMsgMenu);
//                 setMsgMenu(null);
//               }}
//             >
//               <CornerUpLeft size={14} className="text-zinc-500" />
//               Reply
//             </button>
//             {currentMsgMenu.text && (
//               <button
//                 className="ctx-item text-zinc-300"
//                 onClick={() => handleCopy(currentMsgMenu)}
//               >
//                 <Copy size={14} className="text-zinc-500" />
//                 {copiedId === currentMsgMenu.id ? "Copied!" : "Copy text"}
//               </button>
//             )}
//             <button
//               className="ctx-item text-zinc-300"
//               onClick={() => handlePin(currentMsgMenu)}
//             >
//               {isCurrentMenuPinned ? (
//                 <PinOff size={14} className="text-zinc-500" />
//               ) : (
//                 <Pin size={14} className="text-zinc-500" />
//               )}
//               {isCurrentMenuPinned ? "Unpin" : "Pin message"}
//             </button>
//             <button
//               className="ctx-item text-zinc-300"
//               onClick={() => {
//                 setForwardData(currentMsgMenu);
//                 setMsgMenu(null);
//               }}
//             >
//               <Forward size={14} className="text-zinc-500" />
//               Forward
//             </button>
//             {!isSaved && (
//               <button
//                 className="ctx-item text-zinc-300"
//                 onClick={() => handleSaveToSaved(currentMsgMenu)}
//               >
//                 <Bookmark size={14} className="text-zinc-500" />
//                 Save to {SAVED_CHAT_TITLE}
//               </button>
//             )}
//             {msgMenu.isMine && (
//               <>
//                 <div className="ctx-divider" />
//                 <button
//                   className="ctx-item text-red-400"
//                   onClick={() => handleDelete(currentMsgMenu.id)}
//                 >
//                   <Trash2 size={14} className="text-red-400/60" />
//                   Delete
//                 </button>
//               </>
//             )}
//           </div>,
//           document.body
//         )}

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

//       {profileOpen && !isSaved && otherUser?.id && (
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

//       {deleteChatConfirm && !isSaved && (
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
//             await forwardMessageToChat(
//               targetChatId,
//               myUid,
//               buildForwardPayload(forwardData)
//             );
//             setForwardData(null);
//           }}
//           onSelectChannel={async (channelId) => {
//             await forwardMessageToChannel(
//               channelId,
//               myUid,
//               buildForwardPayload(forwardData)
//             );
//             setForwardData(null);
//           }}
//           onSelectGroup={async (groupId) => {
//             await forwardMessageToGroup(
//               groupId,
//               myUid,
//               buildForwardPayload(forwardData)
//             );
//             setForwardData(null);
//           }}
//         />
//       )}

//       <div
//         className="relative flex flex-col w-full h-full overflow-hidden"
//         style={{
//           background: "var(--color-chat-bg)",
//           color: "var(--color-text)",
//         }}
//         onDragEnter={handleDragEnter}
//         onDragLeave={handleDragLeave}
//         onDragOver={handleDragOver}
//         onDrop={handleDrop}
//       >
//         {wallpaper?.url ? (
//           <GroupWallpaper url={wallpaper.url} />
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
//           {searchOpen ? (
//             <GroupSearchBar
//               query={searchQuery}
//               onQueryChange={setSearchQuery}
//               total={matchCount}
//               activeIndex={activeIndex}
//               hasMore={hasMoreMessages}
//               loading={searching}
//               onPrev={goOlder}
//               onNext={goNewer}
//               onClose={closeSearch}
//             />
//           ) : (
//             <div className="h-14 flex items-center justify-between px-5">
//               {isSaved ? (
//                 <div className="flex items-center gap-3">
//                   <div
//                     className="w-9 h-9 rounded-full flex items-center justify-center text-white ring-1 ring-white/[0.08] shrink-0"
//                     style={{
//                       background:
//                         "linear-gradient(135deg, #7c5cff 0%, #5b3df0 100%)",
//                     }}
//                   >
//                     <Bookmark size={17} strokeWidth={2.2} />
//                   </div>
//                   <div className="flex flex-col items-start min-w-0">
//                     <span className="text-sm font-semibold text-white/80 leading-tight">
//                       {SAVED_CHAT_TITLE}
//                     </span>
//                     <span className="text-[11px] leading-tight text-zinc-500">
//                       Only you can see this chat
//                     </span>
//                   </div>
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => setProfileOpen(true)}
//                   className="flex items-center gap-3 cursor-pointer group"
//                 >
//                   <div className="relative shrink-0">
//                     {otherUser?.avatar ? (
//                       <img
//                         src={otherUser.avatar}
//                         alt={otherUser.username ?? "User"}
//                         width={36}
//                         height={36}
//                         decoding="async"
//                         className="w-9 h-9 rounded-full object-cover ring-1 ring-white/[0.08]"
//                       />
//                     ) : (
//                       <div className="w-9 h-9 rounded-full bg-[#522fb7]/30 flex items-center justify-center text-sm font-semibold text-white/80 ring-1 ring-white/[0.08]">
//                         {(otherUser?.username?.[0] ?? "?").toUpperCase()}
//                       </div>
//                     )}
//                     {otherUser && isOnline(otherUser) && (
//                       <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-[#34D399] border-2 border-[#0d0b17]" />
//                     )}
//                   </div>

//                   <div className="flex flex-col items-start min-w-0">
//                     <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">
//                       {otherUser?.username ?? "..."}
//                       {otherUser?.featuredGift && GIFTS[otherUser.featuredGift] && (
//                         <img
//                           src={GIFTS[otherUser.featuredGift].imageUrl}
//                           alt={GIFTS[otherUser.featuredGift].name}
//                           title={GIFTS[otherUser.featuredGift].name}
//                           width={16}
//                           height={16}
//                           decoding="async"
//                           className="shrink-0 w-4 h-4 object-contain"
//                           style={{
//                             filter: `drop-shadow(0 0 3px ${RARITY_COLORS[GIFTS[otherUser.featuredGift].rarity]
//                               }90)`,
//                           }}
//                         />
//                       )}
//                     </span>

//                     {otherUser && (
//                       <span className="text-[11px] leading-tight">
//                         {typingUsers.length > 0 ? (
//                           <span className="flex items-center gap-1 text-[#a893ff]">
//                             typing
//                             <span className="typing-dots">
//                               <span className="typing-dot" />
//                               <span className="typing-dot" />
//                               <span className="typing-dot" />
//                             </span>
//                           </span>
//                         ) : isOnline(otherUser) ? (
//                           <span className="text-[#34D399]">Online</span>
//                         ) : (
//                           <span className="text-zinc-500">
//                             {formatLastSeen(otherUser.lastSeen)}
//                           </span>
//                         )}
//                       </span>
//                     )}
//                   </div>
//                 </button>
//               )}

//               <div className="flex items-center gap-1">
//                 <button
//                   onClick={handleOpenSearch}
//                   title="Search messages"
//                   aria-label="Search messages"
//                   className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//                 >
//                   <Search size={16} />
//                 </button>
//                 {!isSaved && (
//                   <>
//                     <button
//                       onClick={() => handleStartCall("audio")}
//                       title="Voice call"
//                       aria-label="Voice call"
//                       className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-colors cursor-pointer"
//                     >
//                       <Phone size={16} />
//                     </button>
//                     <button
//                       onClick={() => handleStartCall("video")}
//                       title="Video call"
//                       aria-label="Video call"
//                       className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-colors cursor-pointer"
//                     >
//                       <Video size={16} />
//                     </button>
//                   </>
//                 )}

//                 <div className="relative" ref={menuRef}>
//                   <button
//                     onClick={() => setMenuOpen((v) => !v)}
//                     aria-label="Chat menu"
//                     className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//                   >
//                     <MoreVertical size={16} />
//                   </button>
//                   {galleryOpen && (
//                     <MediaGallery chatId={chatId} onClose={() => setGalleryOpen(false)} />
//                   )}
//                   {menuOpen && (
//                     <div className="msg-ctx-menu absolute right-0 top-10 w-48 rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
//                       <button
//                         className="ctx-item text-zinc-300"
//                         onClick={handleOpenSearch}
//                       >
//                         <Search size={14} className="text-zinc-500" />
//                         Search messages
//                       </button>
//                       <button
//                         className="ctx-item text-zinc-300"
//                         onClick={() => {
//                           setGalleryOpen(true);
//                           setMenuOpen(false);
//                         }}
//                       >
//                         <ImageIcon size={14} className="text-zinc-500" />
//                         Media gallery
//                       </button>
//                       <button
//                         className="ctx-item text-zinc-300"
//                         onClick={() => {
//                           wallpaperInputRef.current?.click();
//                           setMenuOpen(false);
//                         }}
//                       >
//                         <ImagePlus size={14} className="text-zinc-500" />
//                         Change wallpaper
//                       </button>
//                       {wallpaper?.url && (
//                         <button className="ctx-item text-zinc-300" onClick={removeWallpaper}>
//                           <ImageOff size={14} className="text-zinc-500" />
//                           Remove wallpaper
//                         </button>
//                       )}
//                       {!isSaved && (
//                         <>
//                           <div className="ctx-divider" />
//                           <button
//                             className="ctx-item text-red-400"
//                             onClick={() => {
//                               setDeleteChatConfirm(true);
//                               setMenuOpen(false);
//                             }}
//                           >
//                             <Trash2 size={14} className="text-red-400/60" />
//                             Delete chat
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {currentPin && (
//             <div className="absolute left-0 right-0 top-full z-30 border-b border-white/[0.06] bg-[#0d0b17]/90 backdrop-blur-md">
//               <div
//                 onClick={handlePinBannerClick}
//                 className="flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-white/[0.04] transition-colors"
//               >
//                 {hasManyPins ? (
//                   <div className="flex flex-col gap-[2px] w-[3px] h-8 shrink-0">
//                     {pinnedMessages.map((p, i) => (
//                       <span
//                         key={p.id}
//                         className={`flex-1 min-h-[2px] rounded-[1px] transition-colors ${i === safePinIndex ? "bg-[#a893ff]" : "bg-white/15"
//                           }`}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <Pin size={12} className="text-[#a893ff] shrink-0" />
//                 )}
//                 <div className="flex-1 min-w-0">
//                   <div className="text-[11px] font-medium text-[#a893ff] leading-none mb-0.5">
//                     {hasManyPins
//                       ? `Pinned message #${safePinIndex + 1}`
//                       : "Pinned message"}
//                   </div>
//                   <div className="text-xs text-zinc-400 truncate">
//                     <PinText text={currentPin.text} />
//                   </div>
//                 </div>
//                 {hasManyPins ? (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setPinListOpen((v) => !v);
//                     }}
//                     aria-label="All pinned messages"
//                     title="All pinned messages"
//                     className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer ${pinListOpen
//                       ? "text-[#a893ff] bg-[#7c5cff]/15"
//                       : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
//                       }`}
//                   >
//                     <List size={14} />
//                   </button>
//                 ) : (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleUnpin(currentPin.id);
//                     }}
//                     aria-label="Unpin message"
//                     className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
//                   >
//                     <X size={12} />
//                   </button>
//                 )}
//               </div>

//               {hasManyPins && pinListOpen && (
//                 <div
//                   onClick={(e) => e.stopPropagation()}
//                   className="msg-ctx-menu absolute left-3 right-3 top-full mt-1 z-30 max-h-64 overflow-y-auto rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/50"
//                 >
//                   <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-zinc-500">
//                     {pinnedMessages.length} pinned messages
//                   </div>
//                   {pinnedMessages.map((p, i) => (
//                     <div
//                       key={p.id}
//                       onClick={() => handlePinListSelect(i)}
//                       className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-white/[0.05] ${i === safePinIndex ? "bg-[#7c5cff]/10" : ""
//                         }`}
//                     >
//                       <span
//                         className={`shrink-0 w-5 text-[11px] font-semibold ${i === safePinIndex ? "text-[#a893ff]" : "text-zinc-600"
//                           }`}
//                       >
//                         {i + 1}
//                       </span>
//                       <span className="flex-1 min-w-0 text-xs text-zinc-300 truncate">
//                         <PinText text={p.text} />
//                       </span>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleUnpin(p.id);
//                         }}
//                         aria-label="Unpin message"
//                         className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
//                       >
//                         <X size={12} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
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

//           {showSavedHint && (
//             <div className="flex flex-col items-center justify-center gap-3 text-center px-8 py-24">
//               <div
//                 className="w-12 h-12 rounded-full flex items-center justify-center text-white"
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #7c5cff 0%, #5b3df0 100%)",
//                 }}
//               >
//                 <Bookmark size={20} strokeWidth={2.2} />
//               </div>
//               <div className="flex flex-col gap-1">
//                 <p className="text-sm font-semibold text-white/80">
//                   Nothing saved yet
//                 </p>
//                 <p className="text-[12.5px] leading-relaxed text-zinc-500">
//                   Forward messages here or write a note to yourself.
//                 </p>
//               </div>
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

//             if (m.type === "call") {
//               return (
//                 <CallLogMessage
//                   key={m.id}
//                   m={m}
//                   isMine={isMine}
//                   isFirstInGroup={row.isFirstInGroup}
//                   onCallBack={handleStartCall}
//                 />
//               );
//             }

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
//                 isPinned={pinnedIds.has(m.id)}
//                 isEditing={editingId === m.id}
//                 animate={!!m.pending || freshIds.has(m.id)}
//                 priority={row.priority}
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
//                 scrollToBottom(true);
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
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
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
  addPinnedMessage,
  removePinnedMessage,
  readPins,
  forwardMessageToChat,
  type PinnedItem,
} from "@/lib/firestore/chats";
import { forwardMessageToChannel } from "@/lib/firestore/channels";
import { forwardMessageToGroup } from "@/lib/firestore/groups";
import { getCustomEmoji, CUSTOM_EMOJIS } from "@/lib/customEmoji";
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
  Bookmark,
  List,
  Search,
} from "lucide-react";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";
import { createCall, fetchLiveKitToken } from "@/lib/calls";
import { useCallStore } from "@/store/call-store";
import { disintegrate } from "@/lib/disintegrate";
import { getSavedChatId, SAVED_CHAT_TITLE } from "@/lib/savedChat";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { useUser } from "@/hooks/useUser";

import MessageRow from "./MessageRow";
import CallLogMessage from "./CallLogMessage";
import Composer, { ComposerHandle, SendPayload } from "./Composer";
import GroupSearchBar from "../group/GroupSearchBar";
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

const ProfileModal = dynamic(() => import("../profile-modal/ProfileModal"));
const MediaGallery = dynamic(() => import("../media-gallery/MediaGallery"));
const ForwardPicker = dynamic(
  () => import("@/components/molecules/forward-picker/ForwardPicker")
);

const NEAR_BOTTOM_THRESHOLD = 120;
const GROUP_GAP_MS = 5 * 60 * 1000;
const PRIORITY_TAIL = 8;
const MENU_MARGIN = 8;
const SCROLL_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
];

const PIN_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
const PIN_TOKEN_MATCH_RE = /^::([\w-]+)::$/;

interface MsgMenuState {
  id: string;
  x: number;
  y: number;
  isMine: boolean;
}

interface MenuPos {
  left: number;
  top: number;
}

interface PendingMessageMatch {
  senderId?: string;
  text?: string;
  imageUrl?: string | null;
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

const PinText = memo(function PinText({ text }: { text: string }) {
  const parts = text.split(PIN_TOKEN_SPLIT_RE);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(PIN_TOKEN_MATCH_RE);
        if (match) {
          const custom = getCustomEmoji(match[1]);
          if (custom) {
            return (
              <img
                key={i}
                src={custom.url}
                alt={custom.id}
                className="inline-block align-text-bottom w-4 h-4 object-contain mx-0.5"
              />
            );
          }
        }
        return part ? <span key={i}>{part}</span> : null;
      })}
    </>
  );
});

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function samePins(a: PinnedItem[], b: PinnedItem[]) {
  return (
    a.length === b.length &&
    a.every((p, i) => p.id === b[i].id && p.text === b[i].text)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

function buildPinText(m: any): string {
  if (m.text) return m.text;
  if (m.voiceUrl) return "🎤 Voice message";
  if (m.imageUrl) {
    const sticker = CUSTOM_EMOJIS.find((e) => e.url === m.imageUrl);
    if (sticker) return `::${sticker.id}::`;
  }
  return "📷 Photo";
}

function matchesPendingMessage(
  pending: PendingMessageMatch,
  message: PendingMessageMatch
) {
  if (
    pending.senderId !== message.senderId ||
    (pending.text || "") !== (message.text || "")
  ) {
    return false;
  }
  return typeof pending.imageUrl === "string" && pending.imageUrl.startsWith("blob:")
    ? Boolean(message.imageUrl)
    : (pending.imageUrl || null) === (message.imageUrl || null);
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msgMenu, setMsgMenu] = useState<MsgMenuState | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedItem[]>([]);
  const [pinIndex, setPinIndex] = useState(0);
  const [pinListOpen, setPinListOpen] = useState(false);
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

  const otherUid = useMemo(() => {
    if (!chatId || !myUid || chatId === getSavedChatId(myUid)) return null;
    const [uid1, uid2] = chatId.split("_");
    return uid1 === myUid ? uid2 : uid1;
  }, [chatId, myUid]);

  const otherUser = useUser(otherUid);
  const myProfile = useUser(myUid);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const msgMenuRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<ComposerHandle | null>(null);

  const messagesRef = useRef<any[]>([]);
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
  const scrollLockedRef = useRef(false);
  const pinsLenRef = useRef(0);
  const loadOlderRef = useRef<() => Promise<void>>(async () => { });

  const scrollLocked = Boolean(msgMenu) || Boolean(pickerOpenId);
  const isSaved = !!chatId && !!myUid && chatId === getSavedChatId(myUid);

  useLayoutEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  useLayoutEffect(() => {
    visibleRef.current = isWindowVisible;
  }, [isWindowVisible]);

  useLayoutEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useLayoutEffect(() => {
    scrollLockedRef.current = scrollLocked;
  }, [scrollLocked]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
  }, []);

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
    setProfileOpen(false);
    setFirstUnreadId(null);
    setShowScrollButton(false);
    setTypingUsers([]);
    setReplyMessage(null);
    setEditingId(null);
    setPickerOpenId(null);
    setMsgMenu(null);
    setPinnedMessages([]);
    setPinIndex(0);
    setPinListOpen(false);
    pinsLenRef.current = 0;
    setFreshIds(new Set());
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
              matchesPendingMessage(pending, message)
          );
          if (matchIndex === -1) return true;
          consumed.add(matchIndex);
          if (isBlob) URL.revokeObjectURL(pending.imageUrl);
          return false;
        });
        return next.length === previous.length ? previous : next;
      });
    }, undefined, (error) => {
      if (activeChatIdRef.current === chatId) console.error("Message listener failed:", error);
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

      const pins = readPins(data);
      const prevLen = pinsLenRef.current;
      pinsLenRef.current = pins.length;
      setPinnedMessages((prev) => (samePins(prev, pins) ? prev : pins));
      if (pins.length > prevLen) {
        setPinIndex(pins.length - 1);
      } else {
        setPinIndex((i) => Math.min(i, Math.max(0, pins.length - 1)));
      }

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
  }, [chatId, myUid, markOpened]);

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

  const loadOlder = useCallback(async () => {
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
      if (activeChatIdRef.current === chatId) {
        isLoadingOlderRef.current = false;
        setIsLoadingOlder(false);
      }
    }
  }, [chatId, hasMoreMessages, messages]);

  useLayoutEffect(() => {
    loadOlderRef.current = loadOlder;
  });

  useEffect(() => {
    const root = chatScrollRef.current;
    const target = topSentinelRef.current;
    if (!root || !target || !hasMoreMessages) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !scrollLockedRef.current) loadOlderRef.current();
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
    if (scrollLockedRef.current) return;
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
    if (scrollLockedRef.current && intent !== "initial") {
      scrollIntentRef.current = null;
      return;
    }
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
    if (!pickerOpenId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPickerOpenId(null);
        setPickerExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pickerOpenId]);

  useEffect(() => {
    if (!msgMenu) return;
    const close = () => setMsgMenu(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMsgMenu(null);
    };
    window.addEventListener("resize", close);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", handleKey);
    };
  }, [msgMenu]);

  useEffect(() => {
    if (!pinListOpen) return;
    const close = () => setPinListOpen(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinListOpen(false);
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", handleKey);
    };
  }, [pinListOpen]);

  useEffect(() => {
    if (pinnedMessages.length < 2) setPinListOpen(false);
  }, [pinnedMessages.length]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!scrollLocked || !el) return;

    const lockedTop = el.scrollTop;

    const isAllowed = (target: EventTarget | null) => {
      const node = target as HTMLElement | null;
      if (!node || !(node instanceof Node)) return true;
      if (!el.contains(node)) return true;
      return Boolean(node.closest?.("[data-allow-scroll]"));
    };

    const blockScroll = (e: Event) => {
      if (isAllowed(e.target)) return;
      e.preventDefault();
    };
    const blockKeys = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
    };
    const blockScrollbar = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.clientX > rect.left + el.clientWidth) e.preventDefault();
    };
    const restore = () => {
      if (el.scrollTop !== lockedTop) el.scrollTop = lockedTop;
    };

    window.addEventListener("wheel", blockScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
    el.addEventListener("mousedown", blockScrollbar, true);
    el.addEventListener("scroll", restore);
    window.addEventListener("keydown", blockKeys, true);
    return () => {
      window.removeEventListener("wheel", blockScroll, true);
      window.removeEventListener("touchmove", blockScroll, true);
      el.removeEventListener("mousedown", blockScrollbar, true);
      el.removeEventListener("scroll", restore);
      window.removeEventListener("keydown", blockKeys, true);
    };
  }, [scrollLocked]);

  useLayoutEffect(() => {
    if (!msgMenu) {
      setMenuPos(null);
      return;
    }
    const el = msgMenuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = msgMenu.x;
    if (left + width > vw - MENU_MARGIN) left = msgMenu.x - width;
    left = clamp(left, MENU_MARGIN, Math.max(MENU_MARGIN, vw - width - MENU_MARGIN));

    let top = msgMenu.y;
    if (top + height > vh - MENU_MARGIN) top = msgMenu.y - height;
    top = clamp(top, MENU_MARGIN, Math.max(MENU_MARGIN, vh - height - MENU_MARGIN));

    setMenuPos((prev) =>
      prev && prev.left === left && prev.top === top ? prev : { left, top }
    );
  }, [msgMenu, copiedId, pinnedMessages]);

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

  const handleSend = useCallback(async ({ text, file, previewUrl, isVideo: wasVideo }: SendPayload) => {
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
      let upload: Awaited<ReturnType<typeof uploadToCloudinary>> | undefined;
      if (file) upload = await uploadToCloudinary(file);
      await sendMessage(
        chatId,
        myUid,
        text,
        currentReply,
        upload?.url,
        upload?.width,
        upload?.height
      );
    } catch (err) {
      console.error("Send failed:", err);
      if (activeChatIdRef.current === chatId) {
        setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
      }
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      if (text && activeChatIdRef.current === chatId) composerRef.current?.restoreText(text);
    }
  }, [chatId, myUid, replyMessage]);

  const handleVoiceSend = useCallback(async (r: {
    audioUrl: string;
    duration: number;
    waveform: number[];
  }) => {
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
  }, [chatId, myUid, replyMessage]);

  const handleReply = useCallback((m: any) => {
    setReplyMessage(m);
    composerRef.current?.focus();
  }, []);

  const handleReact = useCallback(
    async (messageId: string, token: string) => {
      if (!chatId || !myUid) return;
      setPickerOpenId(null);
      setPickerExpanded(false);

      const target = messagesRef.current.find((m) => m.id === messageId);
      if (!target) return;

      const previous: Record<string, string[]> = target.reactions || {};
      const hadThis = (previous[token] ?? []).includes(myUid);

      const next: Record<string, string[]> = {};
      for (const [key, uids] of Object.entries(previous)) {
        next[key] = uids.filter((uid) => uid !== myUid);
      }
      if (!hadThis) next[token] = [...(next[token] ?? []), myUid];

      const applyLocal = (reactions: Record<string, string[]>) => {
        const list = messagesRef.current.map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        );
        messagesRef.current = list;
        setMessages(list);
      };

      applyLocal(next);

      try {
        await toggleReaction(chatId, messageId, token, myUid, previous);
      } catch (err) {
        console.error("Reaction failed:", err);
        applyLocal(previous);
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
      setMenuPos(null);
      setMsgMenu({ id: msgId, x: e.clientX, y: e.clientY, isMine });
      setPickerOpenId(null);
      setPickerExpanded(false);
    },
    []
  );

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("highlight-flash");
    void el.offsetWidth;
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
    if (!chatId || !myUid || isSaved) return;
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
    const isAlreadyPinned = pinnedMessages.some((p) => p.id === m.id);
    try {
      if (isAlreadyPinned) {
        await removePinnedMessage(chatId, m.id);
      } else {
        await addPinnedMessage(chatId, m.id, buildPinText(m));
      }
    } catch (err) {
      console.error("Pin failed:", err);
    }
  }

  async function handleUnpin(messageId: string) {
    if (!chatId) return;
    try {
      await removePinnedMessage(chatId, messageId);
    } catch (err) {
      console.error("Unpin failed:", err);
    }
  }

  function handlePinBannerClick() {
    const total = pinnedMessages.length;
    if (!total) return;
    const index = Math.min(pinIndex, total - 1);
    scrollToMessage(pinnedMessages[index].id);
    setPinListOpen(false);
    if (total > 1) setPinIndex((index - 1 + total) % total);
  }

  function handlePinListSelect(index: number) {
    const target = pinnedMessages[index];
    if (!target) return;
    setPinIndex(index);
    setPinListOpen(false);
    scrollToMessage(target.id);
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

  function buildForwardPayload(source: any) {
    return {
      text: source.text,
      imageUrl: source.imageUrl,
      imageWidth: source.imageWidth ?? null,
      imageHeight: source.imageHeight ?? null,
      voiceUrl: source.voiceUrl,
      duration: source.duration,
      waveform: source.waveform,
      senderId: source.senderId,
      senderName: resolveForwardSenderName(source),
      chatId: chatId!,
      messageId: source.id,
      forwardedFrom: source.forwardedFrom || null,
    };
  }

  async function handleSaveToSaved(m: any) {
    if (!myUid) return;
    setMsgMenu(null);
    try {
      await forwardMessageToChat(
        getSavedChatId(myUid),
        myUid,
        buildForwardPayload(m)
      );
    } catch (err) {
      console.error("Save to saved messages failed:", err);
    }
  }

  async function handleWallpaperChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !chatId) return;
    try {
      const { url } = await uploadToCloudinary(file, "chat_wallpapers");
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
    if (isSaved) return;
    if (!myUid || !chatId || !otherUser?.id || callBusyRef.current) return;
    callBusyRef.current = true;
    try {
      let myName = myProfile?.username || "User";
      let myAvatar: string | null = myProfile?.avatar ?? null;
      if (!myProfile) {
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
          matchesPendingMessage(p, m)
      );
      if (idx === -1) return true;
      consumed.add(idx);
      return false;
    });
    const all = [...messages, ...visiblePending].filter((m) => !m.deleted);

    const joins = (a: any, b: any) => {
      if (!a || !b) return false;
      if (a.type === "call" || b.type === "call") return false;
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

  const pinnedIds = useMemo(
    () => new Set(pinnedMessages.map((p) => p.id)),
    [pinnedMessages]
  );

  const {
    searchOpen,
    searchQuery,
    setSearchQuery,
    openSearch,
    closeSearch,
    matchCount,
    activeIndex,
    searching,
    goOlder,
    goNewer,
  } = useMessageSearch({
    messages,
    hasMore: hasMoreMessages,
    isLoadingOlderRef,
    loadOlderRef,
    scrollToMessage,
    idPrefix: "msg-",
    resetKey: chatId,
    enabled: !!chatId,
    renderToken: rows,
  });

  useEffect(() => {
    if (searchOpen) setMenuOpen(false);
  }, [searchOpen]);

  function handleOpenSearch() {
    setMenuOpen(false);
    openSearch();
  }

  const safePinIndex = Math.min(pinIndex, Math.max(0, pinnedMessages.length - 1));
  const currentPin = pinnedMessages[safePinIndex] ?? null;
  const hasManyPins = pinnedMessages.length > 1;

  const currentMsgMenu = msgMenu
    ? messages.find((m) => m.id === msgMenu.id)
    : null;
  const isCurrentMenuPinned = currentMsgMenu
    ? pinnedIds.has(currentMsgMenu.id)
    : false;

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

  const showSavedHint =
    isSaved && rows.length === 0 && unreadComputedForChat.current === chatId;

  return (
    <>
      {msgMenu &&
        currentMsgMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={msgMenuRef}
            className="msg-ctx-menu fixed z-[1000] min-w-[168px] rounded-2xl bg-[#0d0b17]/95 border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
            style={{
              left: menuPos?.left ?? msgMenu.x,
              top: menuPos?.top ?? msgMenu.y,
              visibility: menuPos ? "visible" : "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
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
              {isCurrentMenuPinned ? (
                <PinOff size={14} className="text-zinc-500" />
              ) : (
                <Pin size={14} className="text-zinc-500" />
              )}
              {isCurrentMenuPinned ? "Unpin" : "Pin message"}
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
            {!isSaved && (
              <button
                className="ctx-item text-zinc-300"
                onClick={() => handleSaveToSaved(currentMsgMenu)}
              >
                <Bookmark size={14} className="text-zinc-500" />
                Save to {SAVED_CHAT_TITLE}
              </button>
            )}
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
          </div>,
          document.body
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

      {profileOpen && !isSaved && otherUser?.id && (
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

      {deleteChatConfirm && !isSaved && (
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
            await forwardMessageToChat(
              targetChatId,
              myUid,
              buildForwardPayload(forwardData)
            );
            setForwardData(null);
          }}
          onSelectChannel={async (channelId) => {
            await forwardMessageToChannel(
              channelId,
              myUid,
              buildForwardPayload(forwardData)
            );
            setForwardData(null);
          }}
          onSelectGroup={async (groupId) => {
            await forwardMessageToGroup(
              groupId,
              myUid,
              buildForwardPayload(forwardData)
            );
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
          {searchOpen ? (
            <GroupSearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              total={matchCount}
              activeIndex={activeIndex}
              hasMore={hasMoreMessages}
              loading={searching}
              onPrev={goOlder}
              onNext={goNewer}
              onClose={closeSearch}
            />
          ) : (
            <div className="h-14 flex items-center justify-between px-5">
              {isSaved ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white ring-1 ring-white/[0.08] shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #7c5cff 0%, #5b3df0 100%)",
                    }}
                  >
                    <Bookmark size={17} strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-white/80 leading-tight">
                      {SAVED_CHAT_TITLE}
                    </span>
                    <span className="text-[11px] leading-tight text-zinc-500">
                      Only you can see this chat
                    </span>
                  </div>
                </div>
              ) : (
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
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={handleOpenSearch}
                  title="Search messages"
                  aria-label="Search messages"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Search size={16} />
                </button>
                {!isSaved && (
                  <>
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
                  </>
                )}

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
                        onClick={handleOpenSearch}
                      >
                        <Search size={14} className="text-zinc-500" />
                        Search messages
                      </button>
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
                      {!isSaved && (
                        <>
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
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentPin && (
            <div className="absolute left-0 right-0 top-full z-30 border-b border-white/[0.06] bg-[#0d0b17]/90 backdrop-blur-md">
              <div
                onClick={handlePinBannerClick}
                className="flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                {hasManyPins ? (
                  <div className="flex flex-col gap-[2px] w-[3px] h-8 shrink-0">
                    {pinnedMessages.map((p, i) => (
                      <span
                        key={p.id}
                        className={`flex-1 min-h-[2px] rounded-[1px] transition-colors ${i === safePinIndex ? "bg-[#a893ff]" : "bg-white/15"
                          }`}
                      />
                    ))}
                  </div>
                ) : (
                  <Pin size={12} className="text-[#a893ff] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-[#a893ff] leading-none mb-0.5">
                    {hasManyPins
                      ? `Pinned message #${safePinIndex + 1}`
                      : "Pinned message"}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    <PinText text={currentPin.text} />
                  </div>
                </div>
                {hasManyPins ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinListOpen((v) => !v);
                    }}
                    aria-label="All pinned messages"
                    title="All pinned messages"
                    className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer ${pinListOpen
                      ? "text-[#a893ff] bg-[#7c5cff]/15"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                      }`}
                  >
                    <List size={14} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpin(currentPin.id);
                    }}
                    aria-label="Unpin message"
                    className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {hasManyPins && pinListOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="msg-ctx-menu absolute left-3 right-3 top-full mt-1 z-30 max-h-64 overflow-y-auto rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/50"
                >
                  <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-zinc-500">
                    {pinnedMessages.length} pinned messages
                  </div>
                  {pinnedMessages.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => handlePinListSelect(i)}
                      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-white/[0.05] ${i === safePinIndex ? "bg-[#7c5cff]/10" : ""
                        }`}
                    >
                      <span
                        className={`shrink-0 w-5 text-[11px] font-semibold ${i === safePinIndex ? "text-[#a893ff]" : "text-zinc-600"
                          }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 text-xs text-zinc-300 truncate">
                        <PinText text={p.text} />
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnpin(p.id);
                        }}
                        aria-label="Unpin message"
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

          {showSavedHint && (
            <div className="flex flex-col items-center justify-center gap-3 text-center px-8 py-24">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #7c5cff 0%, #5b3df0 100%)",
                }}
              >
                <Bookmark size={20} strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-white/80">
                  Nothing saved yet
                </p>
                <p className="text-[12.5px] leading-relaxed text-zinc-500">
                  Forward messages here or write a note to yourself.
                </p>
              </div>
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

            if (m.type === "call") {
              return (
                <CallLogMessage
                  key={m.id}
                  m={m}
                  isMine={isMine}
                  isFirstInGroup={row.isFirstInGroup}
                  onCallBack={handleStartCall}
                />
              );
            }

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
                isPinned={pinnedIds.has(m.id)}
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