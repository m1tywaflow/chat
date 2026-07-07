"use client";

import { useEffect, useRef, useState } from "react";
import {
  subscribeToChannelDoc,
  subscribeToChannelPost,
  subscribeToPostComments,
  createComment,
  deleteComment,
  checkIsSubscribed,
  getUsersByIds,
} from "@/lib/firestore/channels";
import { Channel, ChannelPost, ChannelComment } from "@/types/channel";
import { useChannelStore } from "@/store/channel-store";
import { ArrowLeft, Send, Trash2, Lock } from "lucide-react";

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await createComment(channelId, postId, myUid, text.trim());
      setText("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    await deleteComment(channelId, postId, deleteConfirmId);
    setDeleteConfirmId(null);
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
          return (
            <div key={c.id} className="relative group flex items-start gap-2.5">
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
                <div className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                  {c.text}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {formatTime(c.createdAt)}
                </div>
              </div>
              {canDelete && (
                <button
                  onClick={() => setDeleteConfirmId(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              )}
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
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment…"
              className="flex-1 h-11 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
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
    </div>
  );
}
