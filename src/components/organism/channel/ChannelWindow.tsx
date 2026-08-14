"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";
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
  ChevronDown,
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import {
  CUSTOM_EMOJIS,
  getCustomEmoji,
  isCustomEmojiUrl,
} from "@/lib/customEmoji";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChannelInfoModal from "./ChannelInfoModal";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "👍", "🔥"];

const NEAR_BOTTOM_THRESHOLD = 150;

// matches the ::sticker_id:: markers embedded inline in post text —
// identical scheme to GroupWindow/ChatWindow, so stickers behave the same
// everywhere in the app
const STICKER_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
const STICKER_TOKEN_MATCH_RE = /^::([\w-]+)::$/;
// non-global, used only for a yes/no check so it's safe to reuse .test()
// without worrying about lastIndex state from repeated calls
const STICKER_TOKEN_ONLY_RE = /^(?:\s*::[\w-]+::\s*)+$/;

// true when the post text is made up of nothing but one or more
// ::sticker_id:: tokens (no real words) — rendered big, same treatment
// Telegram gives a "sticker-only" message
function isStickerOnlyText(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && STICKER_TOKEN_ONLY_RE.test(trimmed);
}

// plain unicode emoji available for inline insertion into the composer text
const TEXT_EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😉",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤔",
  "🤨",
  "😐",
  "🙄",
  "😏",
  "😴",
  "😢",
  "😭",
  "😡",
  "🤯",
  "🥳",
  "🤗",
  "😅",
  "🙃",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🤝",
  "👀",
  "🔥",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💔",
  "✨",
  "🎉",
  "💯",
  "☕",
  "🍕",
  "🎮",
  "🚀",
];

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function ReactionGlyph({ token, size = 24 }: { token: string; size?: number }) {
  const custom = getCustomEmoji(token);

  if (custom) {
    return (
      <img
        src={custom.url}
        alt={custom.id}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
        className="inline-block align-middle"
      />
    );
  }

  return (
    <span style={{ fontSize: size }} className="leading-none">
      {token}
    </span>
  );
}

/**
 * Renders post text with inline custom-sticker tokens (::sticker_id::)
 * swapped for small inline images, so a sticker can sit before/after/mid
 * plain text — mirrors GroupWindow's RichText 1:1 so channel posts behave
 * identically to group/1:1 chats.
 */
function RichText({
  text,
  variant = "inline",
}: {
  text: string;
  /** "inline" = small icon sitting in a line of text.
   *  "large"  = big standalone sticker, used when the post has no
   *  other text at all. */
  variant?: "inline" | "large";
}) {
  const parts = text.split(STICKER_TOKEN_SPLIT_RE);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(STICKER_TOKEN_MATCH_RE);
        if (match) {
          const custom = getCustomEmoji(match[1]);
          if (custom) {
            return variant === "large" ? (
              <img
                key={i}
                src={custom.url}
                alt={custom.id}
                className="inline-block w-28 h-28 object-contain"
              />
            ) : (
              <img
                key={i}
                src={custom.url}
                alt={custom.id}
                className="inline-block align-text-bottom w-6 h-6 object-contain mx-0.5"
              />
            );
          }
        }
        // skip pure-whitespace fragments in "large" mode so several
        // stickers in a row sit snugly without odd extra gaps
        if (variant === "large" && !part.trim()) return null;
        return part ? <span key={i}>{part}</span> : null;
      })}
    </>
  );
}

async function uploadPostImage(file: File): Promise<string> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "channel_posts");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Upload failed");
  }

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
      <ReactionGlyph token={token} size={15} />

      <span className="font-medium leading-none">{count}</span>
    </button>
  );
}

/**
 * Telegram-style "time · views" meta row.
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
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
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
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
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

  const [postsChannelId, setPostsChannelId] = useState<string | null>(null);

  const [isSub, setIsSub] = useState(false);

  const [subscriptionChannelId, setSubscriptionChannelId] = useState<
    string | null
  >(null);

  const [text, setText] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);

  const [reactionPickerOpenId, setReactionPickerOpenId] = useState<
    string | null
  >(null);

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

  const inputRef = useRef<HTMLInputElement | null>(null);

  const emojiPanelRef = useRef<HTMLDivElement | null>(null);

  const postMenuRef = useRef<HTMLDivElement | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const editInputRef = useRef<HTMLTextAreaElement | null>(null);

  const isNearBottomRef = useRef(true);

  const knownPostIdsRef = useRef<Set<string>>(new Set());

  const hasReceivedPostsSnapshotRef = useRef(false);

  const scrollIntentRef = useRef<"initial" | "follow" | "force" | null>(
    null
  );

  const viewObserverRef = useRef<IntersectionObserver | null>(null);

  const viewTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const viewedIdsRef = useRef<Set<string>>(new Set());

  const channelIdRef = useRef(channelId);

  const myUidRef = useRef(myUid);

  // tracks where the caret was in the composer input, so emoji/sticker taps
  // insert at that position instead of always appending to the end
  const lastCaretPos = useRef<number>(0);

  useLayoutEffect(() => {
    channelIdRef.current = channelId;
    myUidRef.current = myUid;
  }, [channelId, myUid]);

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

  function handleMediaLoad() {
    if (isNearBottomRef.current) scrollToBottomInstant();
  }

  // Reset before paint so a newly selected channel cannot show the previous
  // feed or inherit its scroll position for a frame.
  useLayoutEffect(() => {
    isNearBottomRef.current = true;
    knownPostIdsRef.current = new Set();
    hasReceivedPostsSnapshotRef.current = false;
    scrollIntentRef.current = null;
  }, [channelId]);

  useEffect(() => {
    viewedIdsRef.current = new Set();

    viewTimersRef.current.forEach(clearTimeout);

    viewTimersRef.current.clear();
  }, [channelId]);

  useEffect(() => {
    const DWELL_MS = 1000;
    const observedChannelId = channelId;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const postId = entry.target.getAttribute("data-post-id");

          if (!postId) continue;

          if (entry.isIntersecting) {
            if (viewedIdsRef.current.has(postId)) {
              continue;
            }

            if (viewTimersRef.current.has(postId)) {
              continue;
            }

            const timer = setTimeout(() => {
              viewTimersRef.current.delete(postId);

              if (viewedIdsRef.current.has(postId)) {
                return;
              }

              viewedIdsRef.current.add(postId);

              const uid = myUidRef.current;

              if (!uid || channelIdRef.current !== observedChannelId) return;

              markPostViewed(observedChannelId, postId, uid).catch((err) =>
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
      {
        threshold: 0.6,
      }
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
    const unsub = subscribeToChannelDoc(channelId, (nextChannel) => {
      if (channelIdRef.current === channelId) setChannel(nextChannel);
    });

    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = subscribeToChannelPosts(channelId, (p) => {
      if (channelIdRef.current !== channelId) return;

      const nextIds = new Set(p.map((post) => post.id));
      const hasNewPost = [...nextIds].some(
        (id) => !knownPostIdsRef.current.has(id)
      );
      const isInitialSnapshot = !hasReceivedPostsSnapshotRef.current;
      knownPostIdsRef.current = nextIds;
      hasReceivedPostsSnapshotRef.current = true;

      if (isInitialSnapshot) {
        scrollIntentRef.current = "initial";
      } else if (hasNewPost && isNearBottomRef.current) {
        scrollIntentRef.current = "follow";
      }
      setPosts(p.slice().reverse());
      setPostsChannelId(channelId);
    });

    return () => unsub();
  }, [channelId]);

  // The only automatic scroll writer. A snapshot containing only edits,
  // reactions, views, or deletions preserves the reader's position.
  useLayoutEffect(() => {
    if (!scrollIntentRef.current || !scrollContainerRef.current) return;

    const intent = scrollIntentRef.current;
    if (
      intent === "initial" ||
      intent === "force" ||
      isNearBottomRef.current
    ) {
      scrollToBottomInstant();
      isNearBottomRef.current = true;
    }
    scrollIntentRef.current = null;
  }, [channelId, channel, posts]);

  useEffect(() => {
    checkIsSubscribed(channelId, myUid).then((subscribed) => {
      if (channelIdRef.current === channelId) {
        setIsSub(subscribed);
        setSubscriptionChannelId(channelId);
      }
    });
  }, [channelId, myUid]);

  // reset this subscriber's unread badge whenever they open the channel,
  // and again whenever a new post lands while they're already looking at
  // it — same idea as markGroupAsRead being gated on window visibility in
  // GroupWindow, just simpler since there's no separate app-visibility
  // concern here (the channel is either open in the UI or it isn't)
  useEffect(() => {
    if (!channelId || !myUid) return;
    markChannelAsRead(channelId, myUid).catch(() => {});
  }, [channelId, myUid, posts.length]);

  useEffect(() => {
    if (!emojiPanelOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(e.target as Node)
      ) {
        setEmojiPanelOpen(false);
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [emojiPanelOpen]);

  useEffect(() => {
    if (!reactionPickerOpenId) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest(".reaction-picker-wrapper")) {
        setReactionPickerOpenId(null);
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [reactionPickerOpenId]);

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

  useEffect(() => {
    if (editingPostId && editInputRef.current) {
      editInputRef.current.focus();

      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length
      );
    }
  }, [editingPostId]);

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

    const isCustomPickerOpen = reactionPickerOpenId === post.id;

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

        {/* comments */}
        <button
          onClick={() => openPostComments(post.id)}
          className="flex items-center gap-1 h-6 px-2 rounded-full text-xs cursor-pointer border bg-black/20 border-white/15 text-zinc-400 hover:text-[#a893ff] hover:border-[#7c5cff]/40 transition-colors"
        >
          <MessageCircle size={12} />

          <span className="font-medium leading-none">
            {post.commentCount || 0}
          </span>
        </button>

        {/* Reaction picker */}
        <div className="relative reaction-picker-wrapper">
          <button
            onClick={() => {
              setPickerOpenId(isPickerOpen ? null : post.id);

              setReactionPickerOpenId(null);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#a893ff] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Plus size={13} />
          </button>

          {isPickerOpen && (
            <div className="absolute z-30 bottom-full mb-2 left-0">
              <div className="flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50">
                {REACTION_EMOJIS.map((token) => (
                  <button
                    key={token}
                    onClick={() => {
                      togglePostReaction(channelId, post.id, token, myUid);

                      setPickerOpenId(null);

                      setReactionPickerOpenId(null);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
                  >
                    <ReactionGlyph token={token} size={22} />
                  </button>
                ))}

                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    setReactionPickerOpenId(
                      isCustomPickerOpen ? null : post.id
                    );
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] cursor-pointer transition ${
                    isCustomPickerOpen ? "text-[#a893ff] bg-white/[0.08]" : ""
                  }`}
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      isCustomPickerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
              {isCustomPickerOpen && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-[230px] max-h-[230px] overflow-y-auto grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 chat-scroll"
                  onClick={(e) => e.stopPropagation()}
                >
                  {CUSTOM_EMOJIS.map((emoji) => (
                    <button
                      key={emoji.id}
                      onClick={() => {
                        togglePostReaction(channelId, post.id, emoji.id, myUid);

                        setPickerOpenId(null);

                        setReactionPickerOpenId(null);
                      }}
                      className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
                    >
                      <img
                        src={emoji.url}
                        alt={emoji.id}
                        className="w-9 h-9 object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function scrollToPost(postId: string) {
    const el = document.getElementById(`channel-post-${postId}`);

    el?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function toggleSub() {
    if (subscriptionChannelId === channelId && isSub) {
      setIsSub(false);
      setSubscriptionChannelId(channelId);

      await unsubscribeFromChannel(channelId, myUid);
    } else {
      setIsSub(true);
      setSubscriptionChannelId(channelId);

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
    if (e.key === "Enter") {
      handlePost();
    }
  }

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    lastCaretPos.current = e.target.selectionStart ?? e.target.value.length;
  }

  // keeps lastCaretPos in sync whenever the user moves the caret without
  // changing the text (arrow keys, mouse click) so emoji/sticker taps land
  // exactly where the cursor is, not always at the end of the string
  function trackCaret(e: React.SyntheticEvent<HTMLInputElement>) {
    lastCaretPos.current =
      e.currentTarget.selectionStart ?? e.currentTarget.value.length;
  }

  // inserts a plain emoji or a ::sticker_id:: token at the last known caret
  // position, then restores focus + caret so the user can keep typing right
  // after the inserted content — same as the composer in GroupWindow
  function insertEmoji(token: string) {
    const pos = lastCaretPos.current ?? text.length;
    const newText = text.slice(0, pos) + token + text.slice(pos);
    setText(newText);
    const newPos = pos + token.length;
    lastCaretPos.current = newPos;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newPos, newPos);
    });
  }

  async function handlePost() {
    if (!text.trim() && !imageFile) {
      return;
    }

    setUploading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadPostImage(imageFile);
      }

      scrollIntentRef.current = "force";
      await createChannelPost(channelId, myUid, text.trim(), imageUrl);

      setText("");
      lastCaretPos.current = 0;

      setImageFile(null);

      setImagePreview(null);
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setUploading(false);
    }
  }

  function openPostMenu(e: React.MouseEvent, postId: string) {
    if (!isOwner) return;

    e.preventDefault();

    setPostMenu({
      postId,
      x: e.clientX,
      y: e.clientY,
    });
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

  async function confirmDelete() {
    if (!channelId || !deleteConfirmId) {
      return;
    }

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

  if (!channel || channel.id !== channelId) {
    return null;
  }

  const displayPosts = postsChannelId === channelId ? posts : [];

  const pinnedPost = channel.pinnedPostId
    ? displayPosts.find((p) => p.id === channel.pinnedPostId)
    : undefined;

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{
        background: "var(--color-chat-bg)",
        color: "var(--color-text)",
      }}
    >
      <style>{`
        .chat-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(124,92,255,0.25);
          border-radius: 999px;
        }

        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(124,92,255,0.5);
        }
      `}</style>

      {/* Ambient violet glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />

        <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
      </div>

      {/* Header */}
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
                subscriptionChannelId === channelId && isSub
                  ? "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-red-400/30 hover:text-red-400"
                  : "bg-[#7c5cff]/15 text-[#a893ff] border border-[#7c5cff]/30 hover:bg-[#7c5cff]/25"
              }`}
            >
              {subscriptionChannelId === channelId && isSub
                ? "Unsubscribe"
                : "Subscribe"}
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
            </div>
          )}
        </div>
      </div>

      {/* Pinned post */}
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

      {/* Posts */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-scroll relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-4"
      >
        {displayPosts.map((p) => {
          // two ways a post can be "just a sticker": the legacy
          // image-attachment style (p.imageUrl pointing at a custom emoji
          // asset), or the newer inline-token style where the whole text
          // is nothing but ::sticker_id:: tokens
          const isImageStickerPost =
            !p.text && p.imageUrl && isCustomEmojiUrl(p.imageUrl);

          const isTextStickerPost = !p.imageUrl && isStickerOnlyText(p.text);

          const isStickerPost = isImageStickerPost || isTextStickerPost;

          const isEditing = editingPostId === p.id;

          const isPinned = channel.pinnedPostId === p.id;

          const views = (p as any).views as number | undefined;

          if (isStickerPost) {
            return (
              <div
                key={p.id}
                id={`channel-post-${p.id}`}
                ref={(el) => observePost(el, p.id)}
                onContextMenu={(e) => openPostMenu(e, p.id)}
                className="relative group max-w-[420px] flex flex-col items-start gap-1.5"
              >
                {isImageStickerPost ? (
                  <img
                    src={p.imageUrl!}
                    alt="sticker"
                    onLoad={handleMediaLoad}
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="inline-flex flex-wrap items-end gap-1">
                    <RichText text={p.text} variant="large" />
                  </div>
                )}

                <div className="flex items-center gap-2 px-1">
                  <PostMeta
                    time={formatTime(p.createdAt)}
                    views={views}
                    isPinned={isPinned}
                  />

                  {isOwner && (
                    <>
                      {isTextStickerPost && (
                        <button
                          onClick={() => startEdit(p)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-[#a893ff] cursor-pointer"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
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
              className={`relative group max-w-[420px] rounded-2xl border overflow-visible ${
                isPinned ? "border-[#7c5cff]/40" : "border-white/[0.08]"
              }`}
              style={{
                background: "var(--color-msg-bg)",
              }}
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt="post"
                  onLoad={handleMediaLoad}
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
                        <RichText text={p.text} />

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

        {displayPosts.length === 0 && (
          <div className="text-center text-zinc-600 text-sm py-10">
            No posts yet
          </div>
        )}

      </div>

      {/* Post context menu */}
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
            const post = displayPosts.find((p) => p.id === postMenu.postId);

            if (!post) return null;

            const isStickerPost =
              (!post.text &&
                post.imageUrl &&
                isCustomEmojiUrl(post.imageUrl)) ||
              (!post.imageUrl && isStickerOnlyText(post.text));

            const isImageStickerPost =
              !post.text && post.imageUrl && isCustomEmojiUrl(post.imageUrl);

            const pinned = channel.pinnedPostId === post.id;

            return (
              <>
                {!isImageStickerPost && (
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

      {/* Composer */}
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
              <button
                onClick={() => fileRef.current?.click()}
                title="Attach photo"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
              >
                <Paperclip size={18} />
              </button>

              {/* Emoji + stickers — identical to GroupWindow/ChatWindow:
                  unicode emoji insert as plain chars, custom stickers
                  insert as ::sticker_id:: tokens, both land at the caret
                  position inside the post text */}
              <div className="relative shrink-0" ref={emojiPanelRef}>
                <button
                  onClick={() => setEmojiPanelOpen((v) => !v)}
                  title="Emoji & stickers"
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
                >
                  <Smile size={18} />
                </button>

                {emojiPanelOpen && (
                  <div
                    className="reaction-picker chat-scroll absolute z-50 bottom-full mb-3 left-0 p-3 w-[248px] max-h-[320px] overflow-y-auto rounded-2xl bg-[#12111f] border border-white/[0.08] shadow-xl shadow-black/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* plain unicode emoji — inserted into the post text at
                        the caret position, can sit anywhere before/after
                        words */}
                    <div className="grid grid-cols-6 gap-1 mb-2">
                      {TEXT_EMOJIS.map((em) => (
                        <button
                          key={em}
                          onClick={() => insertEmoji(em)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer text-lg leading-none transition hover:scale-110"
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    <div className="h-px bg-white/[0.06] mb-2" />

                    {/* custom stickers — inserted as ::id:: tokens,
                        rendered as small inline images inside the post
                        text (or big, if the post ends up sticker-only) */}
                    <div className="grid grid-cols-4 gap-2">
                      {CUSTOM_EMOJIS.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => insertEmoji(`::${e.id}::`)}
                          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
                        >
                          <img
                            src={e.url}
                            alt={e.id}
                            className="w-9 h-9 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                value={text}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                onKeyUp={trackCaret}
                onClick={trackCaret}
                onPaste={handlePaste}
                placeholder="Write a post…"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-white placeholder:text-zinc-600"
                style={{
                  caretColor: "#7c5cff",
                }}
              />
            </div>

            <button
              onClick={handlePost}
              disabled={(!text.trim() && !imageFile) || uploading}
              className="shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send
                  size={19}
                  className="text-white"
                  style={{
                    transform: "translateX(-1px)",
                  }}
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
  );
}
