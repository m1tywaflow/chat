"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  updateChannelPostText,
  pinChannelPost,
  unpinChannelPost,
  markPostViewed,
  markChannelAsRead,
  forwardMessageToChannel,
} from "@/lib/firestore/channels";
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
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { isCustomEmojiUrl } from "@/lib/customEmoji";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChannelInfoModal from "./ChannelInfoModal";
import ForwardPicker from "@/components/molecules/forward-picker/ForwardPicker";
import ChannelPostCard from "./Channelpostcard";
import ChannelComposer from "./Channelcomposer";
import {
  ConfirmDialog,
  ImageLightbox,
  dayKey,
  formatDayLabel,
  toDate,
  uploadPostImage,
} from "./ChannelShared";
import "./ChannelWindow.css";

const NEAR_BOTTOM_THRESHOLD = 150;
const VIEW_DWELL_MS = 1000;
const EMPTY_POSTS: ChannelPost[] = [];

type Row =
  | { type: "date"; key: string; label: string }
  | { type: "post"; post: ChannelPost; priority: boolean };

export default function ChannelWindow({
  channelId,
  myUid,
}: {
  channelId: string;
  myUid: string;
}) {
  const openPostComments = useChannelStore((s) => s.openPostComments);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [postsChannelId, setPostsChannelId] = useState<string | null>(null);
  const [isSub, setIsSub] = useState(false);
  const [subscriptionChannelId, setSubscriptionChannelId] = useState<
    string | null
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [reactionPickerOpenId, setReactionPickerOpenId] = useState<
    string | null
  >(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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

  const postMenuRef = useRef<HTMLDivElement | null>(null);
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

  useLayoutEffect(() => {
    channelIdRef.current = channelId;
    myUidRef.current = myUid;
  }, [channelId, myUid]);

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
  }, [channelId]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
  }

  useLayoutEffect(() => {
    const intent = scrollIntentRef.current;
    const el = scrollContainerRef.current;
    if (!intent || !el) return;
    if (intent === "initial" || intent === "force" || isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      isNearBottomRef.current = true;
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
      const hasNewPost = [...nextIds].some((id) => !prevIds.has(id));
      const isInitialSnapshot = !hasReceivedPostsSnapshotRef.current;
      knownPostIdsRef.current = nextIds;
      hasReceivedPostsSnapshotRef.current = true;

      if (isInitialSnapshot) {
        scrollIntentRef.current = "initial";
      } else {
        if (hasNewPost && isNearBottomRef.current) {
          scrollIntentRef.current = "follow";
        }
        const added = [...nextIds].filter((id) => !prevIds.has(id));
        if (added.length) {
          setFreshIds((prev) => new Set([...prev, ...added]));
        }
      }

      setPosts(p.slice().reverse());
      setPostsChannelId(channelId);
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    let cancelled = false;
    checkIsSubscribed(channelId, myUid).then((subscribed) => {
      if (!cancelled && channelIdRef.current === channelId) {
        setIsSub(subscribed);
        setSubscriptionChannelId(channelId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [channelId, myUid]);

  useEffect(() => {
    if (!channelId || !myUid) return;
    markChannelAsRead(channelId, myUid).catch(() => { });
  }, [channelId, myUid, posts.length]);

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

  useEffect(() => {
    if (!postMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        postMenuRef.current &&
        !postMenuRef.current.contains(e.target as Node)
      ) {
        setPostMenu(null);
      }
    };
    const handleScrollClose = () => setPostMenu(null);
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScrollClose, true);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScrollClose, true);
    };
  }, [postMenu]);

  const handleReact = useCallback(
    (postId: string, token: string) => {
      setPickerOpenId(null);
      setReactionPickerOpenId(null);
      Promise.resolve(togglePostReaction(channelId, postId, token, myUid)).catch(
        (err) => console.error("Reaction failed:", err)
      );
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

  const handlePost = useCallback(
    async (text: string, file: File | null) => {
      try {
        let imageUrl: string | undefined;
        if (file) imageUrl = (await uploadPostImage(file)).url;
        scrollIntentRef.current = "force";
        await createChannelPost(channelId, myUid, text, imageUrl);
      } catch (err) {
        console.error("Post failed:", err);
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

  async function togglePin(post: ChannelPost) {
    setPostMenu(null);
    try {
      if (channel?.pinnedPostId === post.id) await unpinChannelPost(channelId);
      else await pinChannelPost(channelId, post.id);
    } catch (err) {
      console.error("Pin failed:", err);
    }
  }

  async function confirmDelete() {
    if (!channelId || !deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await deleteChannelPost(channelId, id);
    } catch (err) {
      console.error("Delete failed:", err);
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

  function scrollToPost(postId: string) {
    document
      .getElementById(`channel-post-${postId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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

  const displayPosts = useMemo(
    () => (postsChannelId === channelId ? posts : EMPTY_POSTS),
    [postsChannelId, channelId, posts]
  );

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let prevDay = "";
    displayPosts.forEach((p, i) => {
      const d = toDate(p.createdAt);
      const dk = dayKey(d);
      if (dk !== prevDay) {
        out.push({ type: "date", key: `date-${dk}`, label: formatDayLabel(d) });
        prevDay = dk;
      }
      out.push({
        type: "post",
        post: p,
        priority: i >= displayPosts.length - 8,
      });
    });
    return out;
  }, [displayPosts]);

  if (!channel || channel.id !== channelId) {
    return null;
  }

  const pinnedPost = channel.pinnedPostId
    ? displayPosts.find((p) => p.id === channel.pinnedPostId)
    : undefined;

  const menuPost = postMenu
    ? displayPosts.find((p) => p.id === postMenu.postId)
    : undefined;
  const isSubscribed = subscriptionChannelId === channelId && isSub;

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
      </div>

      <div className="relative z-10 flex-none flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#0d0b17]/90">
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
          {!isOwner && (
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
            </div>
          )}
        </div>
      </div>

      {pinnedPost && (
        <div
          onClick={() => scrollToPost(pinnedPost.id)}
          className="relative z-10 flex-none flex items-center gap-2.5 px-5 h-10 border-b border-white/[0.06] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
        >
          <Pin size={13} className="text-[#a893ff] shrink-0" />
          <div className="text-[12px] text-zinc-400 truncate flex-1">
            {pinnedPost.text || "Photo"}
          </div>
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                unpinChannelPost(channelId).catch((err) =>
                  console.error("Unpin failed:", err)
                );
              }}
              className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
              title="Unpin"
              aria-label="Unpin post"
            >
              <PinOff size={13} />
            </button>
          )}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-scroll relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        <div className="flex flex-col gap-3">
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
            return (
              <ChannelPostCard
                key={p.id}
                post={p}
                channelName={channel.name}
                myUid={myUid}
                isOwner={isOwner}
                isPinned={channel.pinnedPostId === p.id}
                isEditing={editingPostId === p.id}
                isPickerOpen={pickerOpenId === p.id}
                isCustomPickerOpen={reactionPickerOpenId === p.id}
                priority={row.priority}
                animate={freshIds.has(p.id)}
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
              />
            );
          })}

          {displayPosts.length === 0 && (
            <div className="text-center text-zinc-600 text-sm py-10">
              No posts yet
            </div>
          )}
        </div>
      </div>

      {postMenu && menuPost && (
        <div
          ref={postMenuRef}
          style={{
            position: "fixed",
            top: Math.min(postMenu.y, window.innerHeight - 190),
            left: Math.min(postMenu.x, window.innerWidth - 190),
            zIndex: 250,
          }}
          className="w-44 rounded-xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 overflow-hidden py-1"
        >
          {isOwner &&
            !(
              !menuPost.text &&
              menuPost.imageUrl &&
              isCustomEmojiUrl(menuPost.imageUrl)
            ) && (
              <button
                onClick={() => startEdit(menuPost.id)}
                className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <Pencil size={14} className="text-zinc-400" />
                Edit
              </button>
            )}

          {isOwner && (
            <button
              onClick={() => togglePin(menuPost)}
              className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
            >
              {channel.pinnedPostId === menuPost.id ? (
                <PinOff size={14} className="text-zinc-400" />
              ) : (
                <Pin size={14} className="text-zinc-400" />
              )}
              {channel.pinnedPostId === menuPost.id ? "Unpin" : "Pin"}
            </button>
          )}

          <button
            onClick={() => {
              setForwardData(menuPost);
              setPostMenu(null);
            }}
            className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <Forward size={14} className="text-zinc-400" />
            Forward
          </button>

          {isOwner && (
            <>
              <div className="h-px bg-white/[0.06] my-1" />
              <button
                onClick={() => {
                  setDeleteConfirmId(menuPost.id);
                  setPostMenu(null);
                }}
                className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 hover:bg-red-500/[0.08] transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {isOwner && <ChannelComposer key={channelId} onPost={handlePost} />}

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