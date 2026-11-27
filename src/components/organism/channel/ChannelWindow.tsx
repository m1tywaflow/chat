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
// import { Channel, ChannelPost, ChannelPinnedItem } from "@/types/channel";
// import {
//   subscribeToChannelDoc,
//   subscribeToChannelPosts,
//   createChannelPost,
//   togglePostReaction,
//   checkIsSubscribed,
//   subscribeToChannel,
//   unsubscribeFromChannel,
//   deleteChannelPost,
//   deleteChannelPosts,
//   updateChannelPostText,
//   addPinnedPost,
//   removePinnedPost,
//   markPostViewed,
//   markChannelAsRead,
//   forwardMessageToChannel,
// } from "@/lib/firestore/channels";
// import { createChannelPoll } from "@/lib/firestore/channelPolls";
// import { forwardMessageToChat } from "@/lib/firestore/chats";
// import { forwardMessageToGroup } from "@/lib/firestore/groups";
// import {
//   Megaphone,
//   MoreVertical,
//   Trash2,
//   Pin,
//   PinOff,
//   Pencil,
//   Forward,
//   ListChecks,
//   ChevronDown,
//   Search,
//   CheckSquare,
// } from "lucide-react";
// import { useChannelStore } from "@/store/channel-store";
// import { useWindowVisibilityStore } from "@/store/window-visibility-store";
// import { isCustomEmojiUrl, CUSTOM_EMOJIS } from "@/lib/customEmoji";
// import { votePoll } from "@/lib/polls";
// import { disintegrate } from "@/lib/disintegrate";
// import { useMessageSearch } from "@/hooks/useMessageSearch";
// import { usePinnedBanner } from "@/hooks/usePinnedBanner";
// import { useMessageSelection } from "@/hooks/useMessageSelection";
// import { doc, updateDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import ChannelInfoModal from "./ChannelInfoModal";
// import ForwardPicker from "@/components/molecules/forward-picker/ForwardPicker";
// import PinnedBanner from "@/components/molecules/pinned-banner/PinnedBanner";
// import SelectionBar from "@/components/molecules/selection-picker/SelectionBar";
// import ChannelPostCard from "./Channelpostcard";
// import ChannelComposer from "./Channelcomposer";
// import GroupSearchBar from "../group/GroupSearchBar";
// import SelectableShell from "../group/SelectableShell";
// import PollCard from "../polls/PollCard";
// import CreatePollModal from "../polls/CreatePollModal";
// import {
//   ConfirmDialog,
//   ImageLightbox,
//   dayKey,
//   formatDayLabel,
//   toDate,
//   uploadPostImage,
// } from "./ChannelShared";
// import "./ChannelWindow.css";

// const NEAR_BOTTOM_THRESHOLD = 150;
// const VIEW_DWELL_MS = 1000;
// const MENU_MARGIN = 8;
// const MAX_ANIMATED_DELETES = 4;
// const EMPTY_POSTS: ChannelPost[] = [];
// const EMPTY_PINS: ChannelPinnedItem[] = [];

// type Row =
//   | { type: "date"; key: string; label: string }
//   | { type: "post"; post: ChannelPost; priority: boolean };

// interface MenuPos {
//   left: number;
//   top: number;
// }

// interface PollPostRowProps {
//   post: ChannelPost;
//   myUid: string;
//   channelId: string;
//   onObserve: (el: HTMLElement | null, postId: string) => void;
//   onContextMenu: (e: React.MouseEvent, postId: string) => void;
// }

// const PollPostRow = memo(function PollPostRow({
//   post,
//   myUid,
//   channelId,
//   onObserve,
//   onContextMenu,
// }: PollPostRowProps) {
//   const setRef = useCallback(
//     (el: HTMLDivElement | null) => onObserve(el, post.id),
//     [onObserve, post.id]
//   );
//   const poll = post.poll;
//   if (!poll) return null;
//   const votes = post.pollVotes ?? {};
//   return (
//     <div
//       id={`channel-post-${post.id}`}
//       ref={setRef}
//       onContextMenu={(e) => onContextMenu(e, post.id)}
//       className="flex justify-start"
//     >
//       <PollCard
//         poll={poll}
//         votes={votes}
//         myUid={myUid}
//         onVote={(optionId) =>
//           votePoll(
//             doc(db, "channels", channelId, "posts", post.id),
//             myUid,
//             optionId,
//             poll,
//             votes
//           )
//         }
//       />
//     </div>
//   );
// });

// function buildPinPreview(post: ChannelPost): string {
//   if (post.type === "poll" && post.poll) return `📊 ${post.poll.question}`;
//   if (post.text) return post.text;
//   if (post.imageUrl) {
//     const sticker = CUSTOM_EMOJIS.find((e) => e.url === post.imageUrl);
//     if (sticker) return `::${sticker.id}::`;
//   }
//   return "📷 Photo";
// }

// function clamp(value: number, min: number, max: number) {
//   return Math.max(min, Math.min(value, max));
// }

// export default function ChannelWindow({
//   channelId,
//   myUid,
// }: {
//   channelId: string;
//   myUid: string;
// }) {
//   const openPostComments = useChannelStore((s) => s.openPostComments);
//   const isWindowVisible = useWindowVisibilityStore((s) => s.isVisible);

//   const [channel, setChannel] = useState<Channel | null>(null);
//   const [posts, setPosts] = useState<ChannelPost[]>([]);
//   const [postsChannelId, setPostsChannelId] = useState<string | null>(null);
//   const [isSub, setIsSub] = useState(false);
//   const [subscriptionChannelId, setSubscriptionChannelId] = useState<
//     string | null
//   >(null);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [pollModalOpen, setPollModalOpen] = useState(false);
//   const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
//   const [reactionPickerOpenId, setReactionPickerOpenId] = useState<
//     string | null
//   >(null);
//   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
//   const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
//   const [deleteChannelConfirm, setDeleteChannelConfirm] = useState(false);
//   const [infoModalOpen, setInfoModalOpen] = useState(false);
//   const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
//   const [postMenu, setPostMenu] = useState<{
//     postId: string;
//     x: number;
//     y: number;
//   } | null>(null);
//   const [postMenuPos, setPostMenuPos] = useState<MenuPos | null>(null);
//   const [editingPostId, setEditingPostId] = useState<string | null>(null);
//   const [forwardData, setForwardData] = useState<ChannelPost | null>(null);
//   const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
//   const [showScrollButton, setShowScrollButton] = useState(false);

//   const { store, selectionMode } = useMessageSelection();

//   const postMenuRef = useRef<HTMLDivElement | null>(null);
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);
//   const isNearBottomRef = useRef(true);
//   const knownPostIdsRef = useRef<Set<string>>(new Set());
//   const hasReceivedPostsSnapshotRef = useRef(false);
//   const scrollIntentRef = useRef<"initial" | "follow" | "force" | null>(null);
//   const viewObserverRef = useRef<IntersectionObserver | null>(null);
//   const postElsRef = useRef<Map<string, HTMLElement>>(new Map());
//   const viewTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
//     new Map()
//   );
//   const viewedIdsRef = useRef<Set<string>>(new Set());
//   const channelIdRef = useRef(channelId);
//   const myUidRef = useRef(myUid);
//   const visibleRef = useRef(isWindowVisible);
//   const isLoadingOlderRef = useRef(false);
//   const loadOlderRef = useRef<() => Promise<void>>(async () => { });

//   useLayoutEffect(() => {
//     channelIdRef.current = channelId;
//     myUidRef.current = myUid;
//   }, [channelId, myUid]);

//   useLayoutEffect(() => {
//     visibleRef.current = isWindowVisible;
//   }, [isWindowVisible]);

//   const isOwner = channel?.ownerId === myUid;

//   useLayoutEffect(() => {
//     isNearBottomRef.current = true;
//     knownPostIdsRef.current = new Set();
//     hasReceivedPostsSnapshotRef.current = false;
//     scrollIntentRef.current = null;
//     setFreshIds(new Set());
//     setEditingPostId(null);
//     setPickerOpenId(null);
//     setReactionPickerOpenId(null);
//     setPostMenu(null);
//     setPollModalOpen(false);
//     setShowScrollButton(false);
//     setBulkDeleteIds(null);
//     store.clear();
//   }, [channelId, store]);

//   function handleScroll() {
//     const el = scrollContainerRef.current;
//     if (!el) return;
//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
//     isNearBottomRef.current = nearBottom;
//     setShowScrollButton((prev) => (prev === !nearBottom ? prev : !nearBottom));
//   }

//   useLayoutEffect(() => {
//     const intent = scrollIntentRef.current;
//     const el = scrollContainerRef.current;
//     if (!intent || !el) return;
//     if (intent === "initial" || intent === "force" || isNearBottomRef.current) {
//       el.scrollTop = el.scrollHeight;
//       isNearBottomRef.current = true;
//       setShowScrollButton(false);
//     }
//     scrollIntentRef.current = null;
//   }, [channelId, posts]);

//   useEffect(() => {
//     viewedIdsRef.current = new Set();
//     viewTimersRef.current.forEach(clearTimeout);
//     viewTimersRef.current.clear();

//     const observedChannelId = channelId;
//     const observer = new IntersectionObserver(
//       (entries) => {
//         for (const entry of entries) {
//           const postId = entry.target.getAttribute("data-post-id");
//           if (!postId) continue;

//           if (entry.isIntersecting) {
//             if (viewedIdsRef.current.has(postId)) continue;
//             if (viewTimersRef.current.has(postId)) continue;

//             const timer = setTimeout(() => {
//               viewTimersRef.current.delete(postId);
//               if (viewedIdsRef.current.has(postId)) return;
//               if (!visibleRef.current) return;
//               viewedIdsRef.current.add(postId);

//               const uid = myUidRef.current;
//               if (!uid || channelIdRef.current !== observedChannelId) return;
//               markPostViewed(observedChannelId, postId, uid).catch((err) =>
//                 console.error("View tracking failed:", err)
//               );
//             }, VIEW_DWELL_MS);
//             viewTimersRef.current.set(postId, timer);
//           } else {
//             const timer = viewTimersRef.current.get(postId);
//             if (timer) {
//               clearTimeout(timer);
//               viewTimersRef.current.delete(postId);
//             }
//           }
//         }
//       },
//       { threshold: 0.6 }
//     );

//     viewObserverRef.current = observer;
//     postElsRef.current.forEach((el) => observer.observe(el));

//     return () => {
//       observer.disconnect();
//       viewTimersRef.current.forEach(clearTimeout);
//       viewTimersRef.current.clear();
//     };
//   }, [channelId]);

//   const observePost = useCallback((el: HTMLElement | null, postId: string) => {
//     const prev = postElsRef.current.get(postId);
//     if (!el) {
//       if (prev) {
//         viewObserverRef.current?.unobserve(prev);
//         postElsRef.current.delete(postId);
//       }
//       return;
//     }
//     el.setAttribute("data-post-id", postId);
//     postElsRef.current.set(postId, el);
//     viewObserverRef.current?.observe(el);
//   }, []);

//   useEffect(() => {
//     const unsub = subscribeToChannelDoc(channelId, (nextChannel) => {
//       if (channelIdRef.current === channelId) setChannel(nextChannel);
//     });
//     return () => unsub();
//   }, [channelId]);

//   useEffect(() => {
//     const unsub = subscribeToChannelPosts(channelId, (p) => {
//       if (channelIdRef.current !== channelId) return;

//       const prevIds = knownPostIdsRef.current;
//       const nextIds = new Set(p.map((post) => post.id));
//       const hasNewPost = [...nextIds].some((id) => !prevIds.has(id));
//       const isInitialSnapshot = !hasReceivedPostsSnapshotRef.current;
//       knownPostIdsRef.current = nextIds;
//       hasReceivedPostsSnapshotRef.current = true;

//       if (isInitialSnapshot) {
//         scrollIntentRef.current = "initial";
//       } else {
//         if (hasNewPost && isNearBottomRef.current) {
//           scrollIntentRef.current = "follow";
//         }
//         const added = [...nextIds].filter((id) => !prevIds.has(id));
//         if (added.length) {
//           setFreshIds((prev) => new Set([...prev, ...added]));
//         }
//       }

//       setPosts(p.slice().reverse());
//       setPostsChannelId(channelId);
//     });
//     return () => unsub();
//   }, [channelId]);

//   useEffect(() => {
//     let cancelled = false;
//     checkIsSubscribed(channelId, myUid)
//       .then((subscribed) => {
//         if (!cancelled && channelIdRef.current === channelId) {
//           setIsSub(subscribed);
//           setSubscriptionChannelId(channelId);
//         }
//       })
//       .catch(() => {
//         if (!cancelled && channelIdRef.current === channelId) {
//           setIsSub(false);
//           setSubscriptionChannelId(channelId);
//         }
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, [channelId, myUid]);

//   useEffect(() => {
//     if (
//       !channelId ||
//       !myUid ||
//       !isWindowVisible ||
//       postsChannelId !== channelId
//     )
//       return;
//     markChannelAsRead(channelId, myUid).catch(() => { });
//   }, [channelId, myUid, isWindowVisible, postsChannelId, posts.length]);

//   useEffect(() => {
//     if (!pickerOpenId && !reactionPickerOpenId) return;
//     const handleClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       if (!target.closest(".reaction-picker-wrapper")) {
//         setPickerOpenId(null);
//         setReactionPickerOpenId(null);
//       }
//     };
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, [pickerOpenId, reactionPickerOpenId]);

//   useEffect(() => {
//     if (!postMenu) return;
//     const handleClick = (e: MouseEvent) => {
//       if (
//         postMenuRef.current &&
//         !postMenuRef.current.contains(e.target as Node)
//       ) {
//         setPostMenu(null);
//       }
//     };
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setPostMenu(null);
//     };
//     const handleScrollClose = () => setPostMenu(null);
//     window.addEventListener("click", handleClick);
//     window.addEventListener("keydown", handleKey);
//     window.addEventListener("resize", handleScrollClose);
//     window.addEventListener("scroll", handleScrollClose, true);
//     return () => {
//       window.removeEventListener("click", handleClick);
//       window.removeEventListener("keydown", handleKey);
//       window.removeEventListener("resize", handleScrollClose);
//       window.removeEventListener("scroll", handleScrollClose, true);
//     };
//   }, [postMenu]);

//   useLayoutEffect(() => {
//     if (!postMenu) {
//       setPostMenuPos(null);
//       return;
//     }
//     const el = postMenuRef.current;
//     if (!el) return;
//     const { width, height } = el.getBoundingClientRect();
//     const vw = window.innerWidth;
//     const vh = window.innerHeight;

//     let left = postMenu.x;
//     if (left + width > vw - MENU_MARGIN) left = postMenu.x - width;
//     left = clamp(
//       left,
//       MENU_MARGIN,
//       Math.max(MENU_MARGIN, vw - width - MENU_MARGIN)
//     );

//     let top = postMenu.y;
//     if (top + height > vh - MENU_MARGIN) top = postMenu.y - height;
//     top = clamp(
//       top,
//       MENU_MARGIN,
//       Math.max(MENU_MARGIN, vh - height - MENU_MARGIN)
//     );

//     setPostMenuPos((prev) =>
//       prev && prev.left === left && prev.top === top ? prev : { left, top }
//     );
//   }, [postMenu]);

//   const rawPins = useMemo<ChannelPinnedItem[]>(() => {
//     if (!channel || channel.id !== channelId) return EMPTY_PINS;
//     if (channel.pins && channel.pins.length) return channel.pins;
//     if (channel.pinnedPostId) return [{ id: channel.pinnedPostId, text: "" }];
//     return EMPTY_PINS;
//   }, [channel, channelId]);

//   const displayPosts = useMemo(
//     () => (postsChannelId === channelId ? posts : EMPTY_POSTS),
//     [postsChannelId, channelId, posts]
//   );

//   const selectableIds = useMemo(
//     () => (isOwner ? displayPosts.map((p) => p.id) : []),
//     [isOwner, displayPosts]
//   );

//   useEffect(() => {
//     if (store.size() === 0) return;
//     store.retain(new Set(selectableIds));
//   }, [store, selectableIds]);

//   const pinnedMessages = useMemo<ChannelPinnedItem[]>(() => {
//     if (!rawPins.length) return EMPTY_PINS;
//     const byId = new Map(displayPosts.map((p) => [p.id, p]));
//     return rawPins.map((p) => {
//       if (p.text) return p;
//       const post = byId.get(p.id);
//       return { id: p.id, text: post ? buildPinPreview(post) : "📷 Photo" };
//     });
//   }, [rawPins, displayPosts]);

//   const pinnedIds = useMemo(
//     () => new Set(rawPins.map((p) => p.id)),
//     [rawPins]
//   );

//   const handleReact = useCallback(
//     (postId: string, token: string) => {
//       setPickerOpenId(null);
//       setReactionPickerOpenId(null);
//       Promise.resolve(togglePostReaction(channelId, postId, token, myUid)).catch(
//         (err) => console.error("Reaction failed:", err)
//       );
//     },
//     [channelId, myUid]
//   );

//   const togglePicker = useCallback((postId: string) => {
//     setPickerOpenId((prev) => (prev === postId ? null : postId));
//     setReactionPickerOpenId(null);
//   }, []);

//   const toggleCustomPicker = useCallback((postId: string) => {
//     setReactionPickerOpenId((prev) => (prev === postId ? null : postId));
//   }, []);

//   const openPostMenu = useCallback((e: React.MouseEvent, postId: string) => {
//     e.preventDefault();
//     setPostMenuPos(null);
//     setPostMenu({ postId, x: e.clientX, y: e.clientY });
//   }, []);

//   const startEdit = useCallback((postId: string) => {
//     setEditingPostId(postId);
//     setPostMenu(null);
//   }, []);

//   const cancelEdit = useCallback(() => setEditingPostId(null), []);

//   const saveEdit = useCallback(
//     async (postId: string, text: string) => {
//       try {
//         await updateChannelPostText(channelId, postId, text);
//       } catch (err) {
//         console.error("Edit failed:", err);
//       } finally {
//         setEditingPostId(null);
//       }
//     },
//     [channelId]
//   );

//   const requestDelete = useCallback(
//     (postId: string) => setDeleteConfirmId(postId),
//     []
//   );
//   const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
//   const openComments = useCallback(
//     (postId: string) => openPostComments(postId),
//     [openPostComments]
//   );

//   const handleMediaLoad = useCallback(() => {
//     const el = scrollContainerRef.current;
//     if (el && isNearBottomRef.current) el.scrollTop = el.scrollHeight;
//   }, []);

//   const handlePost = useCallback(
//     async (text: string, file: File | null) => {
//       try {
//         let imageUrl: string | undefined;
//         if (file) imageUrl = (await uploadPostImage(file)).url;
//         scrollIntentRef.current = "force";
//         await createChannelPost(channelId, myUid, text, imageUrl);
//       } catch (err) {
//         console.error("Post failed:", err);
//         scrollIntentRef.current = null;
//         throw err;
//       }
//     },
//     [channelId, myUid]
//   );

//   const handleCreatePoll = useCallback(
//     async (
//       question: string,
//       options: string[],
//       multiple: boolean,
//       correctIndex: number | null = null
//     ) => {
//       try {
//         scrollIntentRef.current = "force";
//         await createChannelPoll(
//           channelId,
//           myUid,
//           question,
//           options,
//           multiple,
//           correctIndex
//         );
//       } catch (err) {
//         console.error("Poll failed:", err);
//         scrollIntentRef.current = null;
//         throw err;
//       }
//     },
//     [channelId, myUid]
//   );

//   async function toggleSub() {
//     const wasSub = subscriptionChannelId === channelId && isSub;
//     setIsSub(!wasSub);
//     setSubscriptionChannelId(channelId);
//     try {
//       if (wasSub) await unsubscribeFromChannel(channelId, myUid);
//       else await subscribeToChannel(channelId, myUid);
//     } catch (err) {
//       console.error("Subscription change failed:", err);
//       setIsSub(wasSub);
//     }
//   }

//   async function togglePin(post: ChannelPost) {
//     setPostMenu(null);
//     try {
//       if (pinnedIds.has(post.id)) {
//         await removePinnedPost(channelId, post.id);
//       } else {
//         await addPinnedPost(channelId, post.id, buildPinPreview(post));
//       }
//     } catch (err) {
//       console.error("Pin failed:", err);
//     }
//   }

//   async function handleUnpin(postId: string) {
//     try {
//       await removePinnedPost(channelId, postId);
//     } catch (err) {
//       console.error("Unpin failed:", err);
//     }
//   }

//   async function confirmDelete() {
//     if (!channelId || !deleteConfirmId) return;
//     const id = deleteConfirmId;
//     setDeleteConfirmId(null);
//     const el = document.getElementById(`channel-post-${id}`);
//     try {
//       if (el) await disintegrate(el);
//       await deleteChannelPost(channelId, id);
//     } catch (err) {
//       console.error("Delete failed:", err);
//       if (el) el.style.visibility = "";
//     }
//   }

//   function openBulkDelete() {
//     const ids = selectableIds.filter((id) => store.has(id));
//     if (ids.length) setBulkDeleteIds(ids);
//   }

//   async function confirmBulkDelete() {
//     const ids = bulkDeleteIds;
//     setBulkDeleteIds(null);
//     if (!channelId || !ids || !ids.length) return;
//     store.clear();

//     const rootRect = scrollContainerRef.current?.getBoundingClientRect();
//     let animatedCount = 0;
//     const items = ids.map((id) => {
//       const el = document.getElementById(`channel-post-${id}`);
//       let animate = false;
//       if (el && rootRect && animatedCount < MAX_ANIMATED_DELETES) {
//         const rect = el.getBoundingClientRect();
//         if (rect.bottom > rootRect.top && rect.top < rootRect.bottom) {
//           animate = true;
//           animatedCount++;
//         }
//       }
//       if (el && !animate) el.style.visibility = "hidden";
//       return { id, el, animate };
//     });

//     const animatedItems = items.filter((item) => item.animate);
//     if (animatedItems.length) {
//       await Promise.all(
//         animatedItems.map(async (item) => {
//           try {
//             await disintegrate(item.el as HTMLElement);
//           } catch {
//             if (item.el) item.el.style.visibility = "";
//           }
//         })
//       );
//     }

//     try {
//       await deleteChannelPosts(channelId, ids);
//     } catch (err) {
//       console.error("Bulk delete failed:", err);
//       items.forEach((item) => {
//         if (item.el) item.el.style.visibility = "";
//       });
//     }
//   }

//   async function confirmDeleteChannel() {
//     if (!channelId) return;
//     try {
//       await updateDoc(doc(db, "channels", channelId), {
//         [`deleted.${myUid}`]: true,
//       });
//       useChannelStore.getState().setActiveChannel(null);
//     } catch (err) {
//       console.error("Delete channel failed:", err);
//     }
//     setDeleteChannelConfirm(false);
//   }

//   const scrollToPost = useCallback((postId: string) => {
//     const el = document.getElementById(`channel-post-${postId}`);
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "center" });
//     el.classList.remove("highlight-flash");
//     void el.offsetWidth;
//     el.classList.add("highlight-flash");
//     setTimeout(() => el.classList.remove("highlight-flash"), 1500);
//   }, []);

//   function buildForwardPayload(post: ChannelPost) {
//     return {
//       text: post.text || "",
//       imageUrl: post.imageUrl,
//       senderId: post.authorId,
//       senderName: channel?.ownerUsername || "Channel author",
//       channelId,
//       sourceName: channel?.name || "Channel",
//       postId: post.id,
//       forwardedFrom: post.forwardedFrom || null,
//     };
//   }

//   const rows = useMemo<Row[]>(() => {
//     const out: Row[] = [];
//     let prevDay = "";
//     displayPosts.forEach((p, i) => {
//       const d = toDate(p.createdAt);
//       const dk = dayKey(d);
//       if (dk !== prevDay) {
//         out.push({ type: "date", key: `date-${dk}`, label: formatDayLabel(d) });
//         prevDay = dk;
//       }
//       out.push({
//         type: "post",
//         post: p,
//         priority: i >= displayPosts.length - 8,
//       });
//     });
//     return out;
//   }, [displayPosts]);

//   const searchablePosts = useMemo(
//     () =>
//       displayPosts.map((p) =>
//         p.type === "poll" && p.poll ? { ...p, text: p.poll.question } : p
//       ),
//     [displayPosts]
//   );

//   const pinBanner = usePinnedBanner(pinnedMessages, scrollToPost, channelId);

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
//     messages: searchablePosts,
//     hasMore: false,
//     isLoadingOlderRef,
//     loadOlderRef,
//     scrollToMessage: scrollToPost,
//     idPrefix: "channel-post-",
//     resetKey: channelId,
//     enabled: !!channelId,
//     renderToken: rows,
//   });

//   useEffect(() => {
//     if (searchOpen) setMenuOpen(false);
//   }, [searchOpen]);

//   function handleOpenSearch() {
//     setMenuOpen(false);
//     openSearch();
//   }

//   if (!channel || channel.id !== channelId) {
//     return (
//       <div
//         className="relative flex flex-col w-full h-full overflow-hidden"
//         style={{ background: "var(--color-chat-bg)" }}
//       >
//         <div className="flex-none flex items-center gap-3 h-14 px-5 border-b border-white/[0.06] bg-[#0d0b17]/90">
//           <div className="w-9 h-9 rounded-full bg-white/[0.06] animate-pulse" />
//           <div className="flex flex-col gap-1.5">
//             <div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
//             <div className="h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const menuPost = postMenu
//     ? displayPosts.find((p) => p.id === postMenu.postId)
//     : undefined;
//   const isMenuPostPinned = menuPost ? pinnedIds.has(menuPost.id) : false;
//   const subscriptionKnown = subscriptionChannelId === channelId;
//   const isSubscribed = subscriptionKnown && isSub;

//   return (
//     <div
//       className="relative flex flex-col w-full h-full overflow-hidden"
//       style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
//     >
//       <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
//         <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
//         <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
//       </div>

//       {selectionMode ? (
//         <div className="relative z-30 flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90">
//           <SelectionBar
//             store={store}
//             total={selectableIds.length}
//             onCancel={store.clear}
//             onSelectAll={() => store.selectMany(selectableIds)}
//             onDelete={openBulkDelete}
//           />
//         </div>
//       ) : searchOpen ? (
//         <div className="relative z-30 flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90">
//           <GroupSearchBar
//             query={searchQuery}
//             onQueryChange={setSearchQuery}
//             total={matchCount}
//             activeIndex={activeIndex}
//             hasMore={false}
//             loading={searching}
//             onPrev={goOlder}
//             onNext={goNewer}
//             onClose={closeSearch}
//           />
//         </div>
//       ) : (
//         <div className="relative z-30 flex-none flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#0d0b17]/90">
//           <div
//             onClick={() => setInfoModalOpen(true)}
//             className="flex items-center gap-3 min-w-0 cursor-pointer rounded-lg -mx-2 px-2 py-1 hover:bg-white/[0.04] transition-colors"
//           >
//             <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-[#7c5cff] to-[#4028b0]">
//               {channel.avatarUrl ? (
//                 <img
//                   src={channel.avatarUrl}
//                   alt={channel.name}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 channel.name.charAt(0).toUpperCase()
//               )}
//             </div>
//             <div className="min-w-0">
//               <div className="flex items-center gap-1.5 text-sm font-semibold text-white truncate">
//                 {channel.name}
//                 <Megaphone size={12} className="text-[#a893ff] shrink-0" />
//               </div>
//               <div className="text-[11px] text-zinc-500">
//                 {channel.subscriberCount} subscribers
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             {!isOwner && subscriptionKnown && (
//               <button
//                 onClick={toggleSub}
//                 className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${isSubscribed
//                   ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-red-400/30 hover:text-red-400"
//                   : "bg-[#7c5cff]/15 text-[#a893ff] border border-[#7c5cff]/30 hover:bg-[#7c5cff]/25"
//                   }`}
//               >
//                 {isSubscribed ? "Unsubscribe" : "Subscribe"}
//               </button>
//             )}

//             <button
//               onClick={handleOpenSearch}
//               title="Search posts"
//               aria-label="Search posts"
//               className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//             >
//               <Search size={16} />
//             </button>

//             {isOwner && (
//               <div className="relative">
//                 <button
//                   onClick={() => setMenuOpen((v) => !v)}
//                   aria-label="Channel menu"
//                   className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//                 >
//                   <MoreVertical size={16} />
//                 </button>
//                 {menuOpen && (
//                   <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
//                     <button
//                       onClick={handleOpenSearch}
//                       className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.05] transition-colors"
//                     >
//                       <Search size={14} className="text-zinc-400" />
//                       Search posts
//                     </button>
//                     <button
//                       onClick={() => {
//                         setMenuOpen(false);
//                         setPollModalOpen(true);
//                       }}
//                       className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.05] transition-colors"
//                     >
//                       <ListChecks size={14} className="text-zinc-400" />
//                       Create poll
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       <PinnedBanner
//         banner={pinBanner}
//         noun="post"
//         placement="inline"
//         canUnpin={isOwner}
//         onUnpin={handleUnpin}
//       />

//       <div
//         ref={scrollContainerRef}
//         onScroll={handleScroll}
//         className="chat-scroll relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4"
//       >
//         <div className="flex flex-col gap-3">
//           {rows.map((row) => {
//             if (row.type === "date") {
//               return (
//                 <div key={row.key} className="self-center pt-1">
//                   <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#b9a8ff] bg-[#12111f]/80 border border-[#7c5cff]/20 shadow-sm shadow-black/30">
//                     {row.label}
//                   </span>
//                 </div>
//               );
//             }
//             const p = row.post;

//             if (p.type === "poll" && p.poll) {
//               return (
//                 <SelectableShell
//                   key={p.id}
//                   store={store}
//                   id={p.id}
//                   selectable={isOwner}
//                   inset
//                 >
//                   <PollPostRow
//                     post={p}
//                     myUid={myUid}
//                     channelId={channelId}
//                     onObserve={observePost}
//                     onContextMenu={openPostMenu}
//                   />
//                 </SelectableShell>
//               );
//             }

//             return (
//               <SelectableShell
//                 key={p.id}
//                 store={store}
//                 id={p.id}
//                 selectable={isOwner}
//                 inset
//               >
//                 <ChannelPostCard
//                   post={p}
//                   channelName={channel.name}
//                   myUid={myUid}
//                   isOwner={isOwner}
//                   isPinned={pinnedIds.has(p.id)}
//                   isEditing={editingPostId === p.id}
//                   isPickerOpen={pickerOpenId === p.id}
//                   isCustomPickerOpen={reactionPickerOpenId === p.id}
//                   priority={row.priority}
//                   animate={freshIds.has(p.id)}
//                   onObserve={observePost}
//                   onContextMenu={openPostMenu}
//                   onStartEdit={startEdit}
//                   onSaveEdit={saveEdit}
//                   onCancelEdit={cancelEdit}
//                   onDelete={requestDelete}
//                   onOpenLightbox={openLightbox}
//                   onReact={handleReact}
//                   onOpenComments={openComments}
//                   onTogglePicker={togglePicker}
//                   onToggleCustomPicker={toggleCustomPicker}
//                   onMediaLoad={handleMediaLoad}
//                 />
//               </SelectableShell>
//             );
//           })}

//           {displayPosts.length === 0 && (
//             <div className="text-center text-zinc-600 text-sm py-10">
//               No posts yet
//             </div>
//           )}
//         </div>

//         {showScrollButton && (
//           <button
//             onClick={() => {
//               const el = scrollContainerRef.current;
//               if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
//               isNearBottomRef.current = true;
//               setShowScrollButton(false);
//             }}
//             title="Scroll to bottom"
//             aria-label="Scroll to bottom"
//             className="sticky float-right z-20 bottom-2 w-10 h-10 flex items-center justify-center rounded-full bg-[#12111f] border border-white/[0.10] shadow-lg shadow-black/40 text-[#a893ff] hover:bg-[#1b1633] hover:scale-105 active:scale-95 transition-all cursor-pointer"
//           >
//             <ChevronDown size={18} />
//           </button>
//         )}
//       </div>

//       {postMenu && menuPost && (
//         <div
//           ref={postMenuRef}
//           style={{
//             position: "fixed",
//             top: postMenuPos?.top ?? postMenu.y,
//             left: postMenuPos?.left ?? postMenu.x,
//             visibility: postMenuPos ? "visible" : "hidden",
//             zIndex: 250,
//           }}
//           className="w-44 rounded-xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 overflow-hidden py-1"
//           onClick={(e) => e.stopPropagation()}
//           onContextMenu={(e) => e.preventDefault()}
//         >
//           {isOwner &&
//             menuPost.type !== "poll" &&
//             !(
//               !menuPost.text &&
//               menuPost.imageUrl &&
//               isCustomEmojiUrl(menuPost.imageUrl)
//             ) && (
//               <button
//                 onClick={() => startEdit(menuPost.id)}
//                 className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
//               >
//                 <Pencil size={14} className="text-zinc-400" />
//                 Edit
//               </button>
//             )}

//           {isOwner && (
//             <button
//               onClick={() => togglePin(menuPost)}
//               className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
//             >
//               {isMenuPostPinned ? (
//                 <PinOff size={14} className="text-zinc-400" />
//               ) : (
//                 <Pin size={14} className="text-zinc-400" />
//               )}
//               {isMenuPostPinned ? "Unpin" : "Pin"}
//             </button>
//           )}

//           <button
//             onClick={() => {
//               setForwardData(menuPost);
//               setPostMenu(null);
//             }}
//             className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
//           >
//             <Forward size={14} className="text-zinc-400" />
//             Forward
//           </button>

//           {isOwner && (
//             <button
//               onClick={() => {
//                 store.start(menuPost.id);
//                 setPostMenu(null);
//               }}
//               className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
//             >
//               <CheckSquare size={14} className="text-zinc-400" />
//               Select
//             </button>
//           )}

//           {isOwner && (
//             <>
//               <div className="h-px bg-white/[0.06] my-1" />
//               <button
//                 onClick={() => {
//                   setDeleteConfirmId(menuPost.id);
//                   setPostMenu(null);
//                 }}
//                 className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 hover:bg-red-500/[0.08] transition-colors"
//               >
//                 <Trash2 size={14} />
//                 Delete
//               </button>
//             </>
//           )}
//         </div>
//       )}

//       {isOwner && (
//         <ChannelComposer
//           key={channelId}
//           channelId={channelId}
//           myUid={myUid}
//           onPost={handlePost}
//         />
//       )}

//       {isOwner && (
//         <CreatePollModal
//           open={pollModalOpen}
//           onClose={() => setPollModalOpen(false)}
//           onCreate={handleCreatePoll}
//         />
//       )}

//       {infoModalOpen && (
//         <ChannelInfoModal
//           channel={channel}
//           isOwner={isOwner}
//           isSub={isSub}
//           onClose={() => setInfoModalOpen(false)}
//           onToggleSub={() => {
//             toggleSub();
//             setInfoModalOpen(false);
//           }}
//           onRequestDelete={() => {
//             setInfoModalOpen(false);
//             setDeleteChannelConfirm(true);
//           }}
//         />
//       )}

//       {lightboxUrl && (
//         <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
//       )}

//       {deleteConfirmId && (
//         <ConfirmDialog
//           icon={<Trash2 size={18} className="text-red-400" />}
//           title="Delete post?"
//           description="This action cannot be undone. The post will be permanently removed for everyone."
//           onCancel={() => setDeleteConfirmId(null)}
//           onConfirm={confirmDelete}
//         />
//       )}

//       {bulkDeleteIds && (
//         <ConfirmDialog
//           icon={<Trash2 size={18} className="text-red-400" />}
//           title={`Delete ${bulkDeleteIds.length} ${bulkDeleteIds.length === 1 ? "post" : "posts"}?`}
//           description="This action cannot be undone. The selected posts will be permanently removed for everyone."
//           onCancel={() => setBulkDeleteIds(null)}
//           onConfirm={confirmBulkDelete}
//         />
//       )}

//       {deleteChannelConfirm && (
//         <ConfirmDialog
//           icon={<Trash2 size={18} className="text-red-400" />}
//           title="Delete channel?"
//           description="This will permanently delete the channel and all its posts. This action cannot be undone."
//           onCancel={() => setDeleteChannelConfirm(false)}
//           onConfirm={confirmDeleteChannel}
//         />
//       )}

//       {forwardData && (
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
//           onSelectGroup={async (targetGroupId) => {
//             await forwardMessageToGroup(
//               targetGroupId,
//               myUid,
//               buildForwardPayload(forwardData)
//             );
//             setForwardData(null);
//           }}
//           onSelectChannel={async (targetChannelId) => {
//             await forwardMessageToChannel(
//               targetChannelId,
//               myUid,
//               buildForwardPayload(forwardData)
//             );
//             setForwardData(null);
//           }}
//         />
//       )}
//     </div>
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
import { Channel, ChannelPost, ChannelPinnedItem } from "@/types/channel";
import {
  subscribeToChannelDoc,
  subscribeToChannelPosts,
  createChannelPost,
  togglePostReaction,
  checkIsSubscribed,
  subscribeToChannel,
  unsubscribeFromChannel,
  deleteChannelPost,
  deleteChannelPosts,
  updateChannelPostText,
  addPinnedPost,
  removePinnedPost,
  markPostViewed,
  markChannelAsRead,
  forwardMessageToChannel,
} from "@/lib/firestore/channels";
import { createChannelPoll } from "@/lib/firestore/channelPolls";
import { forwardMessageToChat } from "@/lib/firestore/chats";
import { forwardMessageToGroup } from "@/lib/firestore/groups";
import {
  Megaphone,
  MoreVertical,
  Trash2,
  Pin,
  PinOff,
  Pencil,
  Forward,
  ListChecks,
  ChevronDown,
  Search,
  CheckSquare,
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";
import { isCustomEmojiUrl, CUSTOM_EMOJIS } from "@/lib/customEmoji";
import { votePoll } from "@/lib/polls";
import { disintegrate } from "@/lib/disintegrate";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { usePinnedBanner } from "@/hooks/usePinnedBanner";
import { useMessageSelection } from "@/hooks/useMessageSelection";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PinnedBanner from "@/components/molecules/pinned-banner/PinnedBanner";
import SelectionBar from "@/components/molecules/selection-picker/SelectionBar";
import ChannelPostCard from "./Channelpostcard";
import ChannelComposer from "./Channelcomposer";
import GroupSearchBar from "../group/GroupSearchBar";
import SelectableShell from "../group/SelectableShell";
import PollCard from "../polls/PollCard";
import {
  ConfirmDialog,
  ImageLightbox,
  dayKey,
  formatDayLabel,
  toDate,
  uploadPostImage,
} from "./ChannelShared";
import "./ChannelWindow.css";

const ChannelInfoModal = dynamic(() => import("./ChannelInfoModal"));
const ForwardPicker = dynamic(
  () => import("@/components/molecules/forward-picker/ForwardPicker")
);
const CreatePollModal = dynamic(() => import("../polls/CreatePollModal"));

const NEAR_BOTTOM_THRESHOLD = 150;
const VIEW_DWELL_MS = 1000;
const MENU_MARGIN = 8;
const MAX_ANIMATED_DELETES = 4;
const PRIORITY_TAIL = 8;
const EMPTY_POSTS: ChannelPost[] = [];
const EMPTY_PINS: ChannelPinnedItem[] = [];
const EMPTY_VOTES: NonNullable<ChannelPost["pollVotes"]> = {};
const MENU_ITEM_CLASS =
  "w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors";

type Row =
  | { type: "date"; key: string; label: string }
  | { type: "post"; post: ChannelPost; priority: boolean };

type SelectionStore = ReturnType<typeof useMessageSelection>["store"];

interface MenuPos {
  left: number;
  top: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function isEqual(a: unknown, b: unknown, depth = 0): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (depth > 8) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const keys = Object.keys(ra);
  if (keys.length !== Object.keys(rb).length) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(rb, key)) return false;
    if (!isEqual(ra[key], rb[key], depth + 1)) return false;
  }
  return true;
}

function reusePosts(prev: ChannelPost[], next: ChannelPost[]): ChannelPost[] {
  if (!prev.length) return next;
  const byId = new Map(prev.map((p) => [p.id, p] as const));
  let changed = prev.length !== next.length;
  const merged = next.map((p, i) => {
    const old = byId.get(p.id);
    const stable = old && isEqual(old, p) ? old : p;
    if (stable !== prev[i]) changed = true;
    return stable;
  });
  return changed ? merged : prev;
}

function buildPinPreview(post: ChannelPost): string {
  if (post.type === "poll" && post.poll) return `📊 ${post.poll.question}`;
  if (post.text) return post.text;
  if (post.imageUrl) {
    const sticker = CUSTOM_EMOJIS.find((e) => e.url === post.imageUrl);
    if (sticker) return `::${sticker.id}::`;
  }
  return "📷 Photo";
}

interface PollPostRowProps {
  post: ChannelPost;
  myUid: string;
  channelId: string;
  onObserve: (el: HTMLElement | null, postId: string) => void;
  onContextMenu: (e: React.MouseEvent, postId: string) => void;
}

const PollPostRow = memo(function PollPostRow({
  post,
  myUid,
  channelId,
  onObserve,
  onContextMenu,
}: PollPostRowProps) {
  const postId = post.id;
  const poll = post.poll;
  const votes = post.pollVotes ?? EMPTY_VOTES;

  const setRef = useCallback(
    (el: HTMLDivElement | null) => onObserve(el, postId),
    [onObserve, postId]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => onContextMenu(e, postId),
    [onContextMenu, postId]
  );

  const handleVote = useCallback(
    (optionId: Parameters<typeof votePoll>[2]) => {
      if (!poll) return;
      return votePoll(
        doc(db, "channels", channelId, "posts", postId),
        myUid,
        optionId,
        poll,
        votes
      );
    },
    [channelId, postId, myUid, poll, votes]
  );

  if (!poll) return null;

  return (
    <div
      id={`channel-post-${postId}`}
      ref={setRef}
      onContextMenu={handleContextMenu}
      className="flex justify-start"
    >
      <PollCard
        poll={poll}
        votes={votes}
        myUid={myUid}
        onVote={handleVote}
      />
    </div>
  );
});

interface PostContextMenuProps {
  post: ChannelPost;
  x: number;
  y: number;
  isOwner: boolean;
  isPinned: boolean;
  onClose: () => void;
  onEdit: (postId: string) => void;
  onTogglePin: (post: ChannelPost) => void;
  onForward: (post: ChannelPost) => void;
  onSelect: (postId: string) => void;
  onDelete: (postId: string) => void;
}

const PostContextMenu = memo(function PostContextMenu({
  post,
  x,
  y,
  isOwner,
  isPinned,
  onClose,
  onEdit,
  onTogglePin,
  onForward,
  onSelect,
  onDelete,
}: PostContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<MenuPos | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleDismiss = () => onClose();
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("scroll", handleDismiss, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x;
    if (left + width > vw - MENU_MARGIN) left = x - width;
    left = clamp(
      left,
      MENU_MARGIN,
      Math.max(MENU_MARGIN, vw - width - MENU_MARGIN)
    );

    let top = y;
    if (top + height > vh - MENU_MARGIN) top = y - height;
    top = clamp(
      top,
      MENU_MARGIN,
      Math.max(MENU_MARGIN, vh - height - MENU_MARGIN)
    );

    setPos({ left, top });
  }, [x, y]);

  const canEdit =
    isOwner &&
    post.type !== "poll" &&
    !(!post.text && post.imageUrl && isCustomEmojiUrl(post.imageUrl));

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos?.top ?? y,
        left: pos?.left ?? x,
        visibility: pos ? "visible" : "hidden",
        zIndex: 250,
      }}
      className="w-44 rounded-xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 overflow-hidden py-1"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {canEdit && (
        <button onClick={() => onEdit(post.id)} className={MENU_ITEM_CLASS}>
          <Pencil size={14} className="text-zinc-400" />
          Edit
        </button>
      )}

      {isOwner && (
        <button onClick={() => onTogglePin(post)} className={MENU_ITEM_CLASS}>
          {isPinned ? (
            <PinOff size={14} className="text-zinc-400" />
          ) : (
            <Pin size={14} className="text-zinc-400" />
          )}
          {isPinned ? "Unpin" : "Pin"}
        </button>
      )}

      <button onClick={() => onForward(post)} className={MENU_ITEM_CLASS}>
        <Forward size={14} className="text-zinc-400" />
        Forward
      </button>

      {isOwner && (
        <button onClick={() => onSelect(post.id)} className={MENU_ITEM_CLASS}>
          <CheckSquare size={14} className="text-zinc-400" />
          Select
        </button>
      )}

      {isOwner && (
        <>
          <div className="h-px bg-white/[0.06] my-1" />
          <button
            onClick={() => onDelete(post.id)}
            className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 hover:bg-red-500/[0.08] transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
    </div>
  );
});

interface PostRowsProps {
  rows: Row[];
  store: SelectionStore;
  isOwner: boolean;
  myUid: string;
  channelId: string;
  channelName: string;
  pinnedIds: Set<string>;
  editingPostId: string | null;
  pickerOpenId: string | null;
  reactionPickerOpenId: string | null;
  freshIds: Set<string>;
  onObserve: (el: HTMLElement | null, postId: string) => void;
  onContextMenu: (e: React.MouseEvent, postId: string) => void;
  onStartEdit: (postId: string) => void;
  onSaveEdit: (postId: string, text: string) => Promise<void>;
  onCancelEdit: () => void;
  onDelete: (postId: string) => void;
  onOpenLightbox: (url: string) => void;
  onReact: (postId: string, token: string) => void;
  onOpenComments: (postId: string) => void;
  onTogglePicker: (postId: string) => void;
  onToggleCustomPicker: (postId: string) => void;
  onMediaLoad: () => void;
}

const PostRows = memo(function PostRows({
  rows,
  store,
  isOwner,
  myUid,
  channelId,
  channelName,
  pinnedIds,
  editingPostId,
  pickerOpenId,
  reactionPickerOpenId,
  freshIds,
  onObserve,
  onContextMenu,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onOpenLightbox,
  onReact,
  onOpenComments,
  onTogglePicker,
  onToggleCustomPicker,
  onMediaLoad,
}: PostRowsProps) {
  return (
    <>
      {rows.map((row) => {
        if (row.type === "date") {
          return (
            <div key={row.key} className="self-center pt-1">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#b9a8ff] bg-[#12111f]/80 border border-[#7c5cff]/20 shadow-sm shadow-black/30">
                {row.label}
              </span>
            </div>
          );
        }
        const p = row.post;

        if (p.type === "poll" && p.poll) {
          return (
            <SelectableShell
              key={p.id}
              store={store}
              id={p.id}
              selectable={isOwner}
              inset
            >
              <PollPostRow
                post={p}
                myUid={myUid}
                channelId={channelId}
                onObserve={onObserve}
                onContextMenu={onContextMenu}
              />
            </SelectableShell>
          );
        }

        return (
          <SelectableShell
            key={p.id}
            store={store}
            id={p.id}
            selectable={isOwner}
            inset
          >
            <ChannelPostCard
              post={p}
              channelName={channelName}
              myUid={myUid}
              isOwner={isOwner}
              isPinned={pinnedIds.has(p.id)}
              isEditing={editingPostId === p.id}
              isPickerOpen={pickerOpenId === p.id}
              isCustomPickerOpen={reactionPickerOpenId === p.id}
              priority={row.priority}
              animate={freshIds.has(p.id)}
              onObserve={onObserve}
              onContextMenu={onContextMenu}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              onOpenLightbox={onOpenLightbox}
              onReact={onReact}
              onOpenComments={onOpenComments}
              onTogglePicker={onTogglePicker}
              onToggleCustomPicker={onToggleCustomPicker}
              onMediaLoad={onMediaLoad}
            />
          </SelectableShell>
        );
      })}
    </>
  );
});

export default function ChannelWindow({
  channelId,
  myUid,
}: {
  channelId: string;
  myUid: string;
}) {
  const openPostComments = useChannelStore((s) => s.openPostComments);
  const isWindowVisible = useWindowVisibilityStore((s) => s.isVisible);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [postsChannelId, setPostsChannelId] = useState<string | null>(null);
  const [isSub, setIsSub] = useState(false);
  const [subscriptionChannelId, setSubscriptionChannelId] = useState<
    string | null
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [reactionPickerOpenId, setReactionPickerOpenId] = useState<
    string | null
  >(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [deleteChannelConfirm, setDeleteChannelConfirm] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [postMenu, setPostMenu] = useState<{
    postId: string;
    x: number;
    y: number;
  } | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [forwardData, setForwardData] = useState<ChannelPost | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { store, selectionMode } = useMessageSelection();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const knownPostIdsRef = useRef<Set<string>>(new Set());
  const hasReceivedPostsSnapshotRef = useRef(false);
  const scrollIntentRef = useRef<"initial" | "follow" | "force" | null>(null);
  const viewObserverRef = useRef<IntersectionObserver | null>(null);
  const postElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const viewTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const channelIdRef = useRef(channelId);
  const myUidRef = useRef(myUid);
  const visibleRef = useRef(isWindowVisible);
  const isLoadingOlderRef = useRef(false);
  const loadOlderRef = useRef<() => Promise<void>>(async () => { });
  const postsRef = useRef<ChannelPost[]>(EMPTY_POSTS);

  useLayoutEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useLayoutEffect(() => {
    channelIdRef.current = channelId;
    myUidRef.current = myUid;
  }, [channelId, myUid]);

  useLayoutEffect(() => {
    visibleRef.current = isWindowVisible;
  }, [isWindowVisible]);

  const isOwner = channel?.ownerId === myUid;

  useLayoutEffect(() => {
    isNearBottomRef.current = true;
    knownPostIdsRef.current = new Set();
    hasReceivedPostsSnapshotRef.current = false;
    scrollIntentRef.current = null;
    setFreshIds(new Set());
    setEditingPostId(null);
    setPickerOpenId(null);
    setReactionPickerOpenId(null);
    setPostMenu(null);
    setPollModalOpen(false);
    setShowScrollButton(false);
    setBulkDeleteIds(null);
    store.clear();
  }, [channelId, store]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton((prev) => (prev === !nearBottom ? prev : !nearBottom));
  }, []);

  useLayoutEffect(() => {
    const intent = scrollIntentRef.current;
    const el = scrollContainerRef.current;
    if (!intent || !el) return;
    if (intent === "initial" || intent === "force" || isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      isNearBottomRef.current = true;
      setShowScrollButton(false);
    }
    scrollIntentRef.current = null;
  }, [channelId, posts]);

  useEffect(() => {
    viewedIdsRef.current = new Set();
    viewTimersRef.current.forEach(clearTimeout);
    viewTimersRef.current.clear();

    const observedChannelId = channelId;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) continue;

          if (entry.isIntersecting) {
            if (viewedIdsRef.current.has(postId)) continue;
            if (viewTimersRef.current.has(postId)) continue;

            const timer = setTimeout(() => {
              viewTimersRef.current.delete(postId);
              if (viewedIdsRef.current.has(postId)) return;
              if (!visibleRef.current) return;
              viewedIdsRef.current.add(postId);

              const uid = myUidRef.current;
              if (!uid || channelIdRef.current !== observedChannelId) return;
              markPostViewed(observedChannelId, postId, uid).catch((err) =>
                console.error("View tracking failed:", err)
              );
            }, VIEW_DWELL_MS);
            viewTimersRef.current.set(postId, timer);
          } else {
            const timer = viewTimersRef.current.get(postId);
            if (timer) {
              clearTimeout(timer);
              viewTimersRef.current.delete(postId);
            }
          }
        }
      },
      { threshold: 0.6 }
    );

    viewObserverRef.current = observer;
    postElsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      viewTimersRef.current.forEach(clearTimeout);
      viewTimersRef.current.clear();
    };
  }, [channelId]);

  useEffect(() => {
    if (!isWindowVisible) return;
    const observer = viewObserverRef.current;
    if (!observer) return;
    postElsRef.current.forEach((el) => {
      observer.unobserve(el);
      observer.observe(el);
    });
  }, [isWindowVisible]);

  const observePost = useCallback((el: HTMLElement | null, postId: string) => {
    const prev = postElsRef.current.get(postId);
    if (!el) {
      if (prev) {
        viewObserverRef.current?.unobserve(prev);
        postElsRef.current.delete(postId);
      }
      return;
    }
    el.setAttribute("data-post-id", postId);
    postElsRef.current.set(postId, el);
    viewObserverRef.current?.observe(el);
  }, []);

  useEffect(() => {
    const unsub = subscribeToChannelDoc(channelId, (nextChannel) => {
      if (channelIdRef.current === channelId) setChannel(nextChannel);
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = subscribeToChannelPosts(channelId, (p) => {
      if (channelIdRef.current !== channelId) return;

      const prevIds = knownPostIdsRef.current;
      const nextIds = new Set(p.map((post) => post.id));
      const added = [...nextIds].filter((id) => !prevIds.has(id));
      const isInitialSnapshot = !hasReceivedPostsSnapshotRef.current;
      knownPostIdsRef.current = nextIds;
      hasReceivedPostsSnapshotRef.current = true;

      if (isInitialSnapshot) {
        scrollIntentRef.current = "initial";
      } else {
        if (added.length && isNearBottomRef.current) {
          scrollIntentRef.current = "follow";
        }
        if (added.length) {
          setFreshIds((prev) => new Set([...prev, ...added]));
        }
      }

      setPosts((prev) => reusePosts(prev, p.slice().reverse()));
      setPostsChannelId(channelId);
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    let cancelled = false;
    checkIsSubscribed(channelId, myUid)
      .then((subscribed) => {
        if (!cancelled && channelIdRef.current === channelId) {
          setIsSub(subscribed);
          setSubscriptionChannelId(channelId);
        }
      })
      .catch(() => {
        if (!cancelled && channelIdRef.current === channelId) {
          setIsSub(false);
          setSubscriptionChannelId(channelId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [channelId, myUid]);

  const unreadCount =
    channel && channel.id === channelId
      ? (channel as Channel & { unreadCounts?: Record<string, number> })
        .unreadCounts?.[myUid] ?? 0
      : 0;

  useEffect(() => {
    if (
      !channelId ||
      !myUid ||
      !isWindowVisible ||
      postsChannelId !== channelId ||
      unreadCount <= 0
    )
      return;
    markChannelAsRead(channelId, myUid).catch(() => { });
  }, [channelId, myUid, isWindowVisible, postsChannelId, unreadCount]);

  useEffect(() => {
    if (!pickerOpenId && !reactionPickerOpenId) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".reaction-picker-wrapper")) {
        setPickerOpenId(null);
        setReactionPickerOpenId(null);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [pickerOpenId, reactionPickerOpenId]);

  const rawPins = useMemo<ChannelPinnedItem[]>(() => {
    if (!channel || channel.id !== channelId) return EMPTY_PINS;
    if (channel.pins && channel.pins.length) return channel.pins;
    if (channel.pinnedPostId) return [{ id: channel.pinnedPostId, text: "" }];
    return EMPTY_PINS;
  }, [channel, channelId]);

  const displayPosts = postsChannelId === channelId ? posts : EMPTY_POSTS;

  const selectableIds = useMemo(
    () => (isOwner ? displayPosts.map((p) => p.id) : []),
    [isOwner, displayPosts]
  );

  useEffect(() => {
    if (store.size() === 0) return;
    store.retain(new Set(selectableIds));
  }, [store, selectableIds]);

  const pinnedMessages = useMemo<ChannelPinnedItem[]>(() => {
    if (!rawPins.length) return EMPTY_PINS;
    const byId = new Map(displayPosts.map((p) => [p.id, p]));
    return rawPins.map((p) => {
      if (p.text) return p;
      const post = byId.get(p.id);
      return { id: p.id, text: post ? buildPinPreview(post) : "📷 Photo" };
    });
  }, [rawPins, displayPosts]);

  const pinnedIds = useMemo(
    () => new Set(rawPins.map((p) => p.id)),
    [rawPins]
  );

  const handleReact = useCallback(
    (postId: string, token: string) => {
      setPickerOpenId(null);
      setReactionPickerOpenId(null);
      const known = postsRef.current.find((p) => p.id === postId)?.reactions;
      Promise.resolve(
        togglePostReaction(channelId, postId, token, myUid, known)
      ).catch((err) => console.error("Reaction failed:", err));
    },
    [channelId, myUid]
  );

  const togglePicker = useCallback((postId: string) => {
    setPickerOpenId((prev) => (prev === postId ? null : postId));
    setReactionPickerOpenId(null);
  }, []);

  const toggleCustomPicker = useCallback((postId: string) => {
    setReactionPickerOpenId((prev) => (prev === postId ? null : postId));
  }, []);

  const openPostMenu = useCallback((e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    setPostMenu({ postId, x: e.clientX, y: e.clientY });
  }, []);

  const closePostMenu = useCallback(() => setPostMenu(null), []);

  const startEdit = useCallback((postId: string) => {
    setEditingPostId(postId);
    setPostMenu(null);
  }, []);

  const cancelEdit = useCallback(() => setEditingPostId(null), []);

  const saveEdit = useCallback(
    async (postId: string, text: string) => {
      try {
        await updateChannelPostText(channelId, postId, text);
      } catch (err) {
        console.error("Edit failed:", err);
      } finally {
        setEditingPostId(null);
      }
    },
    [channelId]
  );

  const requestDelete = useCallback(
    (postId: string) => setDeleteConfirmId(postId),
    []
  );
  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const openComments = useCallback(
    (postId: string) => openPostComments(postId),
    [openPostComments]
  );

  const handleMediaLoad = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el && isNearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, []);

  const handlePost = useCallback(
    async (text: string, file: File | null) => {
      try {
        let imageUrl: string | undefined;
        let media: { width: number; height: number } | undefined;
        if (file) {
          const uploaded = await uploadPostImage(file);
          imageUrl = uploaded.url;
          media = { width: uploaded.width, height: uploaded.height };
        }
        scrollIntentRef.current = "force";
        await createChannelPost(channelId, myUid, text, imageUrl, media);
      } catch (err) {
        console.error("Post failed:", err);
        scrollIntentRef.current = null;
        throw err;
      }
    },
    [channelId, myUid]
  );

  const handleCreatePoll = useCallback(
    async (
      question: string,
      options: string[],
      multiple: boolean,
      correctIndex: number | null = null
    ) => {
      try {
        scrollIntentRef.current = "force";
        await createChannelPoll(
          channelId,
          myUid,
          question,
          options,
          multiple,
          correctIndex
        );
      } catch (err) {
        console.error("Poll failed:", err);
        scrollIntentRef.current = null;
        throw err;
      }
    },
    [channelId, myUid]
  );

  async function toggleSub() {
    const wasSub = subscriptionChannelId === channelId && isSub;
    setIsSub(!wasSub);
    setSubscriptionChannelId(channelId);
    try {
      if (wasSub) await unsubscribeFromChannel(channelId, myUid);
      else await subscribeToChannel(channelId, myUid);
    } catch (err) {
      console.error("Subscription change failed:", err);
      setIsSub(wasSub);
    }
  }

  const togglePin = useCallback(
    async (post: ChannelPost) => {
      setPostMenu(null);
      try {
        if (pinnedIds.has(post.id)) {
          await removePinnedPost(channelId, post.id);
        } else {
          await addPinnedPost(channelId, post.id, buildPinPreview(post));
        }
      } catch (err) {
        console.error("Pin failed:", err);
      }
    },
    [channelId, pinnedIds]
  );

  const handleUnpin = useCallback(
    async (postId: string) => {
      try {
        await removePinnedPost(channelId, postId);
      } catch (err) {
        console.error("Unpin failed:", err);
      }
    },
    [channelId]
  );

  const menuForward = useCallback((post: ChannelPost) => {
    setForwardData(post);
    setPostMenu(null);
  }, []);

  const menuSelect = useCallback(
    (postId: string) => {
      store.start(postId);
      setPostMenu(null);
    },
    [store]
  );

  const menuDelete = useCallback((postId: string) => {
    setDeleteConfirmId(postId);
    setPostMenu(null);
  }, []);

  async function confirmDelete() {
    if (!channelId || !deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    const el = document.getElementById(`channel-post-${id}`);
    try {
      if (el) await disintegrate(el);
      await deleteChannelPost(channelId, id);
    } catch (err) {
      console.error("Delete failed:", err);
      if (el) el.style.visibility = "";
    }
  }

  function openBulkDelete() {
    const ids = selectableIds.filter((id) => store.has(id));
    if (ids.length) setBulkDeleteIds(ids);
  }

  async function confirmBulkDelete() {
    const ids = bulkDeleteIds;
    setBulkDeleteIds(null);
    if (!channelId || !ids || !ids.length) return;
    store.clear();

    const rootRect = scrollContainerRef.current?.getBoundingClientRect();
    let animatedCount = 0;
    const items = ids.map((id) => {
      const el = document.getElementById(`channel-post-${id}`);
      let animate = false;
      if (el && rootRect && animatedCount < MAX_ANIMATED_DELETES) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > rootRect.top && rect.top < rootRect.bottom) {
          animate = true;
          animatedCount++;
        }
      }
      if (el && !animate) el.style.visibility = "hidden";
      return { id, el, animate };
    });

    const animatedItems = items.filter((item) => item.animate);
    if (animatedItems.length) {
      await Promise.all(
        animatedItems.map(async (item) => {
          try {
            await disintegrate(item.el as HTMLElement);
          } catch {
            if (item.el) item.el.style.visibility = "";
          }
        })
      );
    }

    try {
      await deleteChannelPosts(channelId, ids);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      items.forEach((item) => {
        if (item.el) item.el.style.visibility = "";
      });
    }
  }

  async function confirmDeleteChannel() {
    if (!channelId) return;
    try {
      await updateDoc(doc(db, "channels", channelId), {
        [`deleted.${myUid}`]: true,
      });
      useChannelStore.getState().setActiveChannel(null);
    } catch (err) {
      console.error("Delete channel failed:", err);
    }
    setDeleteChannelConfirm(false);
  }

  const scrollToPost = useCallback((postId: string) => {
    const el = document.getElementById(`channel-post-${postId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("highlight-flash");
    void el.offsetWidth;
    el.classList.add("highlight-flash");
    setTimeout(() => el.classList.remove("highlight-flash"), 1500);
  }, []);

  function buildForwardPayload(post: ChannelPost) {
    return {
      text: post.text || "",
      imageUrl: post.imageUrl,
      senderId: post.authorId,
      senderName: channel?.ownerUsername || "Channel author",
      channelId,
      sourceName: channel?.name || "Channel",
      postId: post.id,
      forwardedFrom: post.forwardedFrom || null,
    };
  }

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const priorityFrom = displayPosts.length - PRIORITY_TAIL;
    let prevDay = "";
    displayPosts.forEach((p, i) => {
      const d = toDate(p.createdAt);
      const dk = dayKey(d);
      if (dk !== prevDay) {
        out.push({ type: "date", key: `date-${dk}`, label: formatDayLabel(d) });
        prevDay = dk;
      }
      out.push({ type: "post", post: p, priority: i >= priorityFrom });
    });
    return out;
  }, [displayPosts]);

  const searchablePosts = useMemo(
    () =>
      displayPosts.map((p) =>
        p.type === "poll" && p.poll ? { ...p, text: p.poll.question } : p
      ),
    [displayPosts]
  );

  const pinBanner = usePinnedBanner(pinnedMessages, scrollToPost, channelId);

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
    messages: searchablePosts,
    hasMore: false,
    isLoadingOlderRef,
    loadOlderRef,
    scrollToMessage: scrollToPost,
    idPrefix: "channel-post-",
    resetKey: channelId,
    enabled: !!channelId,
    renderToken: rows,
  });

  useEffect(() => {
    if (searchOpen) setMenuOpen(false);
  }, [searchOpen]);

  function handleOpenSearch() {
    setMenuOpen(false);
    openSearch();
  }

  if (!channel || channel.id !== channelId) {
    return (
      <div
        className="relative flex flex-col w-full h-full overflow-hidden"
        style={{ background: "var(--color-chat-bg)" }}
      >
        <div className="flex-none flex items-center gap-3 h-14 px-5 border-b border-white/[0.06] bg-[#0d0b17]/90">
          <div className="w-9 h-9 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const menuPost = postMenu
    ? displayPosts.find((p) => p.id === postMenu.postId)
    : undefined;
  const subscriptionKnown = subscriptionChannelId === channelId;
  const isSubscribed = subscriptionKnown && isSub;

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
      </div>

      {selectionMode ? (
        <div className="relative z-30 flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90">
          <SelectionBar
            store={store}
            total={selectableIds.length}
            onCancel={store.clear}
            onSelectAll={() => store.selectMany(selectableIds)}
            onDelete={openBulkDelete}
          />
        </div>
      ) : searchOpen ? (
        <div className="relative z-30 flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90">
          <GroupSearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            total={matchCount}
            activeIndex={activeIndex}
            hasMore={false}
            loading={searching}
            onPrev={goOlder}
            onNext={goNewer}
            onClose={closeSearch}
          />
        </div>
      ) : (
        <div className="relative z-30 flex-none flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#0d0b17]/90">
          <div
            onClick={() => setInfoModalOpen(true)}
            className="flex items-center gap-3 min-w-0 cursor-pointer rounded-lg -mx-2 px-2 py-1 hover:bg-white/[0.04] transition-colors"
          >
            <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-[#7c5cff] to-[#4028b0]">
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
                <Megaphone size={12} className="text-[#a893ff] shrink-0" />
              </div>
              <div className="text-[11px] text-zinc-500">
                {channel.subscriberCount} subscribers
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOwner && subscriptionKnown && (
              <button
                onClick={toggleSub}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${isSubscribed
                    ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-red-400/30 hover:text-red-400"
                    : "bg-[#7c5cff]/15 text-[#a893ff] border border-[#7c5cff]/30 hover:bg-[#7c5cff]/25"
                  }`}
              >
                {isSubscribed ? "Unsubscribe" : "Subscribe"}
              </button>
            )}

            <button
              onClick={handleOpenSearch}
              title="Search posts"
              aria-label="Search posts"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Search size={16} />
            </button>

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Channel menu"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                    <button
                      onClick={handleOpenSearch}
                      className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.05] transition-colors"
                    >
                      <Search size={14} className="text-zinc-400" />
                      Search posts
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setPollModalOpen(true);
                      }}
                      className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.05] transition-colors"
                    >
                      <ListChecks size={14} className="text-zinc-400" />
                      Create poll
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <PinnedBanner
        banner={pinBanner}
        noun="post"
        placement="inline"
        canUnpin={isOwner}
        onUnpin={handleUnpin}
      />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-scroll relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        <div className="flex flex-col gap-3">
          <PostRows
            rows={rows}
            store={store}
            isOwner={isOwner}
            myUid={myUid}
            channelId={channelId}
            channelName={channel.name}
            pinnedIds={pinnedIds}
            editingPostId={editingPostId}
            pickerOpenId={pickerOpenId}
            reactionPickerOpenId={reactionPickerOpenId}
            freshIds={freshIds}
            onObserve={observePost}
            onContextMenu={openPostMenu}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDelete={requestDelete}
            onOpenLightbox={openLightbox}
            onReact={handleReact}
            onOpenComments={openComments}
            onTogglePicker={togglePicker}
            onToggleCustomPicker={toggleCustomPicker}
            onMediaLoad={handleMediaLoad}
          />

          {displayPosts.length === 0 && (
            <div className="text-center text-zinc-600 text-sm py-10">
              No posts yet
            </div>
          )}
        </div>

        {showScrollButton && (
          <button
            onClick={() => {
              const el = scrollContainerRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              isNearBottomRef.current = true;
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

      {postMenu && menuPost && (
        <PostContextMenu
          key={`${postMenu.postId}:${postMenu.x}:${postMenu.y}`}
          post={menuPost}
          x={postMenu.x}
          y={postMenu.y}
          isOwner={isOwner}
          isPinned={pinnedIds.has(menuPost.id)}
          onClose={closePostMenu}
          onEdit={startEdit}
          onTogglePin={togglePin}
          onForward={menuForward}
          onSelect={menuSelect}
          onDelete={menuDelete}
        />
      )}

      {isOwner && (
        <ChannelComposer
          key={channelId}
          channelId={channelId}
          myUid={myUid}
          onPost={handlePost}
        />
      )}

      {isOwner && (
        <CreatePollModal
          open={pollModalOpen}
          onClose={() => setPollModalOpen(false)}
          onCreate={handleCreatePoll}
        />
      )}

      {infoModalOpen && (
        <ChannelInfoModal
          channel={channel}
          isOwner={isOwner}
          isSub={isSubscribed}
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

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {deleteConfirmId && (
        <ConfirmDialog
          icon={<Trash2 size={18} className="text-red-400" />}
          title="Delete post?"
          description="This action cannot be undone. The post will be permanently removed for everyone."
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
        />
      )}

      {bulkDeleteIds && (
        <ConfirmDialog
          icon={<Trash2 size={18} className="text-red-400" />}
          title={`Delete ${bulkDeleteIds.length} ${bulkDeleteIds.length === 1 ? "post" : "posts"}?`}
          description="This action cannot be undone. The selected posts will be permanently removed for everyone."
          onCancel={() => setBulkDeleteIds(null)}
          onConfirm={confirmBulkDelete}
        />
      )}

      {deleteChannelConfirm && (
        <ConfirmDialog
          icon={<Trash2 size={18} className="text-red-400" />}
          title="Delete channel?"
          description="This will permanently delete the channel and all its posts. This action cannot be undone."
          onCancel={() => setDeleteChannelConfirm(false)}
          onConfirm={confirmDeleteChannel}
        />
      )}

      {forwardData && (
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
          onSelectGroup={async (targetGroupId) => {
            await forwardMessageToGroup(
              targetGroupId,
              myUid,
              buildForwardPayload(forwardData)
            );
            setForwardData(null);
          }}
          onSelectChannel={async (targetChannelId) => {
            await forwardMessageToChannel(
              targetChannelId,
              myUid,
              buildForwardPayload(forwardData)
            );
            setForwardData(null);
          }}
        />
      )}
    </div>
  );
}