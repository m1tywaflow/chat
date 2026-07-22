"use client";

import { useEffect, useRef, useState } from "react";
import {
  subscribeToChannelDoc,
  subscribeToChannelPost,
  subscribeToPostComments,
  createComment,
  deleteComment,
  toggleCommentReaction,
  checkIsSubscribed,
  getUsersByIds,
} from "@/lib/firestore/channels";
import { Channel, ChannelPost, ChannelComment } from "@/types/channel";
import { useChannelStore } from "@/store/channel-store";
import {
  ArrowLeft,
  Send,
  Trash2,
  Lock,
  CornerUpLeft,
  X,
  SmilePlus,
  Paperclip,
  Smile,
} from "lucide-react";
import { CUSTOM_EMOJIS, isCustomEmojiUrl } from "@/lib/customEmoji";

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "😮", "😢", "🙏", "🎉"];

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function uploadCommentImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "channel_comments");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
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
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm"
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

export default function PostCommentsView({
  channelId,
  postId,
  myUid,
}: {
  channelId: string;
  postId: string;
  myUid: string;
}) {
  const closePostComments = useChannelStore((s) => s.closePostComments);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [post, setPost] = useState<ChannelPost | null>(null);
  const [comments, setComments] = useState<ChannelComment[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, { username: string; avatarUrl: string | null }>
  >({});
  const [isSub, setIsSub] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorUsername: string;
    text: string;
  } | null>(null);
  const [openReactionPickerId, setOpenReactionPickerId] = useState<
    string | null
  >(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isOwner = channel?.ownerId === myUid;

  useEffect(() => {
    const unsub = subscribeToChannelDoc(channelId, setChannel);
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = subscribeToChannelPost(channelId, postId, setPost);
    return () => unsub();
  }, [channelId, postId]);

  useEffect(() => {
    const unsub = subscribeToPostComments(channelId, postId, (c) => {
      setComments(c);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "instant" })
      );
    });
    return () => unsub();
  }, [channelId, postId]);

  useEffect(() => {
    checkIsSubscribed(channelId, myUid).then(setIsSub);
  }, [channelId, myUid]);

  useEffect(() => {
    const missing = Array.from(new Set(comments.map((c) => c.authorId))).filter(
      (id) => !profiles[id]
    );
    if (missing.length === 0) return;
    getUsersByIds(missing).then((map) =>
      setProfiles((prev) => ({ ...prev, ...map }))
    );
  }, [comments, profiles]);

  useEffect(() => {
    if (!openReactionPickerId) return;
    const handler = () => setOpenReactionPickerId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [openReactionPickerId]);

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

  function buildReplyPayload() {
    if (!replyingTo) return null;
    return {
      commentId: replyingTo.commentId,
      authorId:
        comments.find((c) => c.id === replyingTo.commentId)?.authorId || "",
      authorUsername: replyingTo.authorUsername,
      text: replyingTo.text,
    };
  }

  async function handleSend() {
    if (!text.trim() && !imageFile) return;
    if (sending) return;
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) imageUrl = await uploadCommentImage(imageFile);

      await createComment(
        channelId,
        postId,
        myUid,
        text.trim(),
        buildReplyPayload(),
        imageUrl
      );
      setText("");
      setImageFile(null);
      setImagePreview(null);
      setReplyingTo(null);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSending(false);
    }
  }

  async function sendSticker(url: string) {
    setEmojiPanelOpen(false);
    if (sending) return;
    setSending(true);
    try {
      await createComment(
        channelId,
        postId,
        myUid,
        "",
        buildReplyPayload(),
        url
      );
      setReplyingTo(null);
    } catch (err) {
      console.error("Sticker comment failed:", err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape" && replyingTo) setReplyingTo(null);
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    await deleteComment(channelId, postId, deleteConfirmId);
    setDeleteConfirmId(null);
  }

  function startReply(c: ChannelComment) {
    setReplyingTo({
      commentId: c.id,
      authorUsername: profiles[c.authorId]?.username || "...",
      text: c.text || (c.imageUrl ? "📷 Photo" : ""),
    });
    inputRef.current?.focus();
  }

  function scrollToComment(commentId: string) {
    const el = commentRefs.current[commentId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("comment-flash");
    setTimeout(() => el.classList.remove("comment-flash"), 900);
  }

  async function handleReact(commentId: string, token: string) {
    setOpenReactionPickerId(null);
    try {
      await toggleCommentReaction(channelId, postId, commentId, token, myUid);
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  }

  if (!channel || !post) return null;

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
        .comment-flash { animation: commentFlash 0.9s ease; }
        @keyframes commentFlash {
          0% { background-color: rgba(167,139,250,0.18); }
          100% { background-color: transparent; }
        }
      `}</style>

      <div className="flex-none flex items-center gap-3 h-14 px-4 border-b border-white/[0.06] bg-[#0c121a]">
        <button
          onClick={closePostComments}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            Comments
          </div>
          <div className="text-[11px] text-zinc-500 truncate">
            to the post in {channel.name}
          </div>
        </div>
      </div>

      <div className="flex-none px-4 pt-3 pb-3 border-b border-white/[0.06]">
        <div className="rounded-xl border border-white/[0.06] bg-[#141220] px-3.5 py-2.5">
          {post.imageUrl && !post.text && (
            <img
              src={post.imageUrl}
              alt="post"
              className="w-full max-h-[160px] object-cover rounded-lg mb-2"
            />
          )}
          {post.text && (
            <div className="text-[12px] text-zinc-300 leading-relaxed line-clamp-3 whitespace-pre-wrap">
              {post.text}
            </div>
          )}
          <div className="text-[10px] text-zinc-500 mt-1.5">
            {formatTime(post.createdAt)}
          </div>
        </div>
      </div>

      <div className="chat-scroll flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {comments.map((c) => {
          const profile = profiles[c.authorId];
          const canDelete = isOwner || c.authorId === myUid;
          const reactions = c.reactions || {};
          const reactionEntries = Object.entries(reactions).filter(
            ([, uids]) => uids && uids.length > 0
          );
          const isSticker =
            !c.text && c.imageUrl && isCustomEmojiUrl(c.imageUrl);

          return (
            <div
              key={c.id}
              ref={(el) => {
                commentRefs.current[c.id] = el;
              }}
              className="relative group flex items-start gap-2.5 rounded-lg transition-colors"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-[11px] font-semibold">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profile?.username || "?").charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#A78BFA]">
                  {profile?.username || "..."}
                </div>

                {c.replyTo && (
                  <button
                    onClick={() => scrollToComment(c.replyTo!.commentId)}
                    className="flex items-start gap-1.5 mb-1 pl-2 border-l-2 border-[#A78BFA]/40 text-left cursor-pointer max-w-full"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-[#A78BFA]/80 truncate">
                        {c.replyTo.authorUsername}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {c.replyTo.text}
                      </div>
                    </div>
                  </button>
                )}

                {isSticker ? (
                  <img
                    src={c.imageUrl!}
                    alt="sticker"
                    className="w-20 h-20 object-contain -ml-1"
                  />
                ) : (
                  <>
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt="comment attachment"
                        onClick={() => setLightboxUrl(c.imageUrl!)}
                        className="max-w-[220px] max-h-[220px] rounded-lg object-cover mb-1 cursor-zoom-in border border-white/[0.06]"
                      />
                    )}
                    {c.text && (
                      <div className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                        {c.text}
                      </div>
                    )}
                  </>
                )}

                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {formatTime(c.createdAt)}
                </div>

                {reactionEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {reactionEntries.map(([token, uids]) => {
                      const mine = uids.includes(myUid);
                      return (
                        <button
                          key={token}
                          onClick={() => handleReact(c.id, token)}
                          className={`flex items-center gap-1 px-1.5 py-[3px] rounded-full text-[11px] border transition-colors cursor-pointer ${
                            mine
                              ? "bg-[#A78BFA]/15 border-[#A78BFA]/40 text-[#A78BFA]"
                              : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/20"
                          }`}
                        >
                          <span className="leading-none">{token}</span>
                          <span>{uids.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-0.5 relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenReactionPickerId((id) =>
                      id === c.id ? null : c.id
                    );
                  }}
                  className="text-zinc-600 hover:text-[#A78BFA] cursor-pointer p-0.5"
                  title="React"
                >
                  <SmilePlus size={13} />
                </button>
                <button
                  onClick={() => startReply(c)}
                  className="text-zinc-600 hover:text-white cursor-pointer p-0.5"
                  title="Reply"
                >
                  <CornerUpLeft size={13} />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setDeleteConfirmId(c.id)}
                    className="text-zinc-600 hover:text-red-400 cursor-pointer p-0.5"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                {openReactionPickerId === c.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-6 z-30 flex flex-wrap gap-1 p-2 rounded-2xl border border-white/[0.08] bg-[#141220] shadow-xl shadow-black/50 w-[168px]"
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(c.id, emoji)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer text-[17px]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div className="text-center text-zinc-600 text-sm py-10">
            No comments yet.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isSub ? (
        <div className="flex-none border-t border-white/[0.06] bg-[#0d0b14] px-3 py-3">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <CornerUpLeft size={13} className="text-[#A78BFA] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#A78BFA] truncate">
                  {replyingTo.authorUsername}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {replyingTo.text}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="shrink-0 text-zinc-500 hover:text-white cursor-pointer p-1"
              >
                <X size={13} />
              </button>
            </div>
          )}

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
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0d0b14] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors cursor-pointer"
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

            <div
              className="
                flex-1
                h-[46px]
                flex
                items-center
                gap-2
                px-3
                rounded-full
                bg-white/[0.05]
                border border-white/[0.08]
                focus-within:border-[#A78BFA]/30
                transition-all
              "
            >
              <button
                onClick={() => fileRef.current?.click()}
                title="Attach photo"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#A78BFA] hover:bg-[#A78BFA]/10 transition-all cursor-pointer"
              >
                <Paperclip size={16} />
              </button>

              <div className="relative shrink-0" ref={emojiPanelRef}>
                <button
                  onClick={() => setEmojiPanelOpen((v) => !v)}
                  title="Send a sticker"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-[#A78BFA] hover:bg-[#A78BFA]/10 transition-all cursor-pointer"
                >
                  <Smile size={16} />
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
                      bg-[#141220]
                      border border-white/[0.08]
                      shadow-xl
                      shadow-black/50
                    "
                  >
                    {CUSTOM_EMOJIS.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => sendSticker(e.url)}
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
                )}
              </div>

              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.authorUsername}…`
                    : "Write a comment…"
                }
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={(!text.trim() && !imageFile) || sending}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #A78BFA, #7c3aed)",
              }}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} className="text-white" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-none border-t border-white/[0.06] bg-[#0d0b14] px-4 py-3.5 flex items-center gap-2 text-zinc-500 text-[12px]">
          <Lock size={13} />
          Subscribe to the channel to leave comments.
        </div>
      )}

      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="w-80 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-1">
                Delete comment?
              </h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                This action cannot be undone. The comment will be permanently
                deleted.
              </p>
            </div>
            <div className="flex border-t border-white/[0.06]">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
