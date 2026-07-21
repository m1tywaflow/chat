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
  updateChannelPostText,
  pinChannelPost,
  unpinChannelPost,
  markPostViewed,
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
  Pin,
  PinOff,
  Pencil,
  Check,
  Eye,
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { CUSTOM_EMOJIS, isCustomEmojiUrl } from "@/lib/customEmoji";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChannelInfoModal from "./ChannelInfoModal";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "👍", "🔥"];
const NEAR_BOTTOM_THRESHOLD = 150;

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Telegram-style compact number: 999, 1.2K, 3.4M
function formatViews(n: number | undefined): string {
  const v = n ?? 0;
  if (v < 1000) return String(v);
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  const m = v / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
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
          ? "bg-[#7c5cff]/20 border-[#7c5cff]/50 text-[#a893ff]"
          : "bg-black/20 border-white/15 text-zinc-400 hover:border-white/25"
      }`}
    >
      <span className="leading-none">{token}</span>
      <span className="font-medium leading-none">{count}</span>
    </button>
  );
}

/**
 * Telegram-style "time · views" meta row. Single source of truth so the
 * pin dot, timestamp, and view counter line up identically everywhere a
 * post's meta is rendered (text posts, media posts, stickers).
 */
function PostMeta({
  time,
  views,
  isPinned,
}: {
  time: string;
  views?: number;
  isPinned?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 select-none">
      {isPinned && <Pin size={10} className="text-[#a893ff] shrink-0" />}
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-0.5 opacity-80">
        <Eye size={11} className="shrink-0" strokeWidth={2.25} />
        <span className="tabular-nums">{formatViews(views)}</span>
      </span>
    </div>
  );
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.08] text-white hover:bg-white/[0.15] transition-colors cursor-pointer"
      >
        <X size={20} />
      </button>
      <img
        src={url}
        alt="full"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [postMenu, setPostMenu] = useState<{
    postId: string;
    x: number;
    y: number;
  } | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement | null>(null);

  const isInitialLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);

  // Telegram-style view tracking: a post only counts as "viewed" once it
  // has actually sat on screen for a beat, not the instant it flashes by
  // during a fast scroll. viewedIds is a client-side cache purely to skip
  // redundant transaction calls in this session — Firestore's own
  // per-user "viewers" doc is what guarantees no double-counting.
  const viewObserverRef = useRef<IntersectionObserver | null>(null);
  const viewTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const channelIdRef = useRef(channelId);
  const myUidRef = useRef(myUid);
  channelIdRef.current = channelId;
  myUidRef.current = myUid;

  const isOwner = channel?.ownerId === myUid;

  function scrollToBottomInstant() {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
  }

  // Reset + force scroll to the very bottom every time we enter a channel.
  // Multiple attempts because post images load asynchronously and change
  // the scroll height after the first paint.
  useEffect(() => {
    isInitialLoadRef.current = true;
    isNearBottomRef.current = true;
    scrollToBottomInstant();
    const timers = [30, 100, 250, 450, 800].map((ms) =>
      setTimeout(scrollToBottomInstant, ms)
    );
    const doneTimer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 900);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [channelId]);

  // fresh view-tracking state per channel — a post viewed in one channel
  // has no bearing on whether it should be re-counted in another
  useEffect(() => {
    viewedIdsRef.current = new Set();
    viewTimersRef.current.forEach(clearTimeout);
    viewTimersRef.current.clear();
  }, [channelId]);

  useEffect(() => {
    const DWELL_MS = 1000;
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
              const cid = channelIdRef.current;
              const uid = myUidRef.current;
              if (!uid) return;
              markPostViewed(cid, postId, uid).catch((err) =>
                console.error("View tracking failed:", err)
              );
            }, DWELL_MS);
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
    return () => {
      observer.disconnect();
      viewTimersRef.current.forEach(clearTimeout);
      viewTimersRef.current.clear();
    };
  }, [channelId]);

  function observePost(el: HTMLElement | null, postId: string) {
    if (!el) return;
    el.setAttribute("data-post-id", postId);
    viewObserverRef.current?.observe(el);
  }

  useEffect(() => {
    const unsub = subscribeToChannelDoc(channelId, setChannel);
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = subscribeToChannelPosts(channelId, (p) => {
      setPosts(p.slice().reverse());
      requestAnimationFrame(() => {
        if (isInitialLoadRef.current || isNearBottomRef.current) {
          scrollToBottomInstant();
        }
      });
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

  useEffect(() => {
    if (!postMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        postMenuRef.current &&
        !postMenuRef.current.contains(e.target as Node)
      )
        setPostMenu(null);
    };
    const handleScrollClose = () => setPostMenu(null);
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScrollClose, true);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScrollClose, true);
    };
  }, [postMenu]);

  useEffect(() => {
    if (editingPostId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length
      );
    }
  }, [editingPostId]);

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

  function openPostMenu(e: React.MouseEvent, postId: string) {
    if (!isOwner) return;
    e.preventDefault();
    setPostMenu({ postId, x: e.clientX, y: e.clientY });
  }

  function startEdit(post: ChannelPost) {
    setEditingPostId(post.id);
    setEditText(post.text || "");
    setPostMenu(null);
  }

  function cancelEdit() {
    setEditingPostId(null);
    setEditText("");
  }

  async function saveEdit(postId: string) {
    const trimmed = editText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    try {
      await updateChannelPostText(channelId, postId, trimmed);
    } catch (err) {
      console.error("Edit failed:", err);
    } finally {
      setEditingPostId(null);
      setEditText("");
    }
  }

  function handleEditKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    postId: string
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit(postId);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  async function togglePin(post: ChannelPost) {
    setPostMenu(null);
    try {
      if (channel?.pinnedPostId === post.id) {
        await unpinChannelPost(channelId);
      } else {
        await pinChannelPost(channelId, post.id);
      }
    } catch (err) {
      console.error("Pin failed:", err);
    }
  }

  function scrollToPost(postId: string) {
    const el = document.getElementById(`channel-post-${postId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
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
          className="flex items-center gap-1 h-6 px-2 rounded-full text-xs cursor-pointer border bg-black/20 border-white/15 text-zinc-400 hover:text-[#a893ff] hover:border-[#7c5cff]/40 transition-colors"
        >
          <MessageCircle size={12} />
          <span className="font-medium leading-none">
            {post.commentCount || 0}
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setPickerOpenId(isPickerOpen ? null : post.id)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#a893ff] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Plus size={13} />
          </button>
          {isPickerOpen && (
            <div className="absolute z-30 bottom-full mb-2 left-0 flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50">
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
          className="w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
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

  const pinnedPost = channel.pinnedPostId
    ? posts.find((p) => p.id === channel.pinnedPostId)
    : undefined;

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{ background: "var(--color-chat-bg)", color: "var(--color-text)" }}
    >
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }
      `}</style>

      {/* Ambient violet glow field — same signature as ChatWindow / settings */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
      </div>

      <div className="relative z-10 flex-none flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#0d0b17]/90 backdrop-blur-xl">
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
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                isSub
                  ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-red-400/30 hover:text-red-400"
                  : "bg-[#7c5cff]/15 text-[#a893ff] border border-[#7c5cff]/30 hover:bg-[#7c5cff]/25"
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
            >
              <PinOff size={13} />
            </button>
          )}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-scroll relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-4"
      >
        {posts.map((p) => {
          const isSticker =
            !p.text && p.imageUrl && isCustomEmojiUrl(p.imageUrl);
          const isEditing = editingPostId === p.id;
          const isPinned = channel.pinnedPostId === p.id;
          const views = (p as any).views as number | undefined;

          if (isSticker) {
            return (
              <div
                key={p.id}
                id={`channel-post-${p.id}`}
                ref={(el) => observePost(el, p.id)}
                onContextMenu={(e) => openPostMenu(e, p.id)}
                className="relative group max-w-[420px] flex flex-col items-start gap-1.5"
              >
                <img
                  src={p.imageUrl!}
                  alt="sticker"
                  onLoad={() => {
                    if (isInitialLoadRef.current) scrollToBottomInstant();
                  }}
                  className="w-32 h-32 object-contain"
                />
                <div className="flex items-center gap-2 px-1">
                  <PostMeta
                    time={formatTime(p.createdAt)}
                    views={views}
                    isPinned={isPinned}
                  />
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
              id={`channel-post-${p.id}`}
              ref={(el) => observePost(el, p.id)}
              onContextMenu={(e) => openPostMenu(e, p.id)}
              className={`relative group max-w-[420px] rounded-2xl border overflow-hidden ${
                isPinned ? "border-[#7c5cff]/40" : "border-white/[0.08]"
              }`}
              style={{ background: "var(--color-msg-bg)" }}
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt="post"
                  onLoad={() => {
                    if (isInitialLoadRef.current) scrollToBottomInstant();
                  }}
                  onClick={() => setLightboxUrl(p.imageUrl!)}
                  className="w-full max-h-[360px] object-cover cursor-zoom-in"
                />
              )}
              <div className="px-4 py-3">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, p.id)}
                      rows={2}
                      className="w-full resize-none rounded-lg bg-black/20 border border-[#7c5cff]/30 px-2.5 py-2 text-sm text-white outline-none focus:border-[#7c5cff]/60 transition-colors"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(p.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[#a893ff] bg-[#7c5cff]/10 hover:bg-[#7c5cff]/20 transition-colors cursor-pointer"
                      >
                        <Check size={11} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                      <PostMeta
                        time={formatTime(p.createdAt)}
                        views={views}
                        isPinned={isPinned}
                      />
                      {isOwner && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(p)}
                            className="text-zinc-600 hover:text-[#a893ff] cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="text-zinc-600 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <PostActionsBar post={p} />
                    </div>
                  </>
                )}
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

      {postMenu && (
        <div
          ref={postMenuRef}
          style={{
            position: "fixed",
            top: postMenu.y,
            left: postMenu.x,
            zIndex: 250,
          }}
          className="w-44 rounded-xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 overflow-hidden py-1"
        >
          {(() => {
            const post = posts.find((p) => p.id === postMenu.postId);
            if (!post) return null;
            const isStickerPost =
              !post.text && post.imageUrl && isCustomEmojiUrl(post.imageUrl);
            const pinned = channel.pinnedPostId === post.id;
            return (
              <>
                {!isStickerPost && (
                  <button
                    onClick={() => startEdit(post)}
                    className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
                  >
                    <Pencil size={14} className="text-zinc-400" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => togglePin(post)}
                  className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors"
                >
                  {pinned ? (
                    <PinOff size={14} className="text-zinc-400" />
                  ) : (
                    <Pin size={14} className="text-zinc-400" />
                  )}
                  {pinned ? "Unpin" : "Pin"}
                </button>
                <div className="h-px bg-white/[0.06] my-1" />
                <button
                  onClick={() => {
                    setDeleteConfirmId(post.id);
                    setPostMenu(null);
                  }}
                  className="w-full flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 hover:bg-red-500/[0.08] transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            );
          })()}
        </div>
      )}

      {isOwner && (
        <div className="relative z-10 flex-none border-t border-white/[0.06] bg-[#0d0b17]/95 backdrop-blur-xl">
          {imagePreview && (
            <div className="mx-3 mt-3 relative inline-block">
              <img
                src={imagePreview}
                alt="preview"
                className="h-24 rounded-2xl object-cover border border-white/[0.08]"
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

          <div className="px-4 py-3 flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {/* Input wrapper — matches ChatWindow composer exactly */}
            <div
              className="
                flex-1
                h-[54px]
                flex
                items-center
                gap-3
                px-4
                rounded-full
                bg-[#12111f]/80
                backdrop-blur-xl
                border border-white/[0.07]
                shadow-[inset_0_0_20px_rgba(124,92,255,0.03)]
                transition-all
                focus-within:border-[#7c5cff]/40
              "
            >
              {/* Attach */}
              <button
                onClick={() => fileRef.current?.click()}
                title="Attach photo"
                className="
                  shrink-0
                  w-7
                  h-7
                  flex
                  items-center
                  justify-center
                  rounded-xl
                  text-zinc-500
                  hover:text-[#a893ff]
                  hover:bg-[#7c5cff]/10
                  transition-all
                  hover:scale-105
                  active:scale-95
                "
              >
                <Paperclip size={18} />
              </button>

              {/* Emoji / sticker */}
              <div className="relative shrink-0" ref={emojiPanelRef}>
                <button
                  onClick={() => setEmojiPanelOpen((v) => !v)}
                  title="Send a sticker"
                  className="
                    w-7
                    h-7
                    flex
                    items-center
                    justify-center
                    rounded-xl
                    text-zinc-500
                    hover:text-[#a893ff]
                    hover:bg-[#7c5cff]/10
                    transition-all
                    hover:scale-105
                    active:scale-95
                  "
                >
                  <Smile size={18} />
                </button>
                {emojiPanelOpen && (
                  <div
                    className="
                      chat-scroll
                      absolute
                      z-50
                      bottom-full
                      mb-3
                      left-0
                      grid
                      grid-cols-4
                      gap-2
                      p-3
                      w-[230px]
                      max-h-[230px]
                      overflow-y-auto
                      rounded-2xl
                      bg-[#12111f]
                      border border-white/[0.08]
                      shadow-xl
                      shadow-black/50
                    "
                  >
                    {CUSTOM_EMOJIS.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => sendSticker(e.url)}
                        className="
                          w-12
                          h-12
                          flex
                          items-center
                          justify-center
                          rounded-xl
                          hover:bg-white/[0.08]
                          cursor-pointer
                          transition
                          hover:scale-110
                        "
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

              {/* Text */}
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Write a post…"
                className="
                  flex-1
                  min-w-0
                  bg-transparent
                  outline-none
                  text-[15px]
                  text-white
                  placeholder:text-zinc-600
                "
                style={{ caretColor: "#7c5cff" }}
              />
            </div>

            {/* Send */}
            <button
              onClick={handlePost}
              disabled={(!text.trim() && !imageFile) || uploading}
              className="
                shrink-0
                w-[42px]
                h-[42px]
                flex
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-[#7c5cff]
                to-[#5b3df0]
                shadow-[0_0_35px_rgba(124,92,255,.45)]
                transition-all
                hover:scale-105
                active:scale-95
                disabled:opacity-20
                disabled:cursor-not-allowed
              "
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send
                  size={19}
                  className="text-white"
                  style={{ transform: "translateX(-1px)" }}
                />
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

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
