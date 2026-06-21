"use client";

import { useEffect, useState, useRef } from "react";
import { formatLastSeen, isOnline } from "@/lib/formatLastSeen";
import { useChatStore } from "@/store/chat-store";
import {
  subscribeToMessages,
  sendMessage,
  setTyping,
} from "@/lib/firestore/chats";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import {
  X,
  CornerUpLeft,
  Send,
  MoreVertical,
  Trash2,
  Paperclip,
  ImageIcon,
  Download,
} from "lucide-react";

async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "chat_images");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function ChatWindow() {
  const chatId = useChatStore((s) => s.activeChatId);
  const markOpened = useChatStore((s) => s.markOpened);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      const data = snap.data();
      if (!data?.typing) return;
      const typingList = Object.entries(data.typing)
        .filter(([uid, val]) => val && uid !== myUid)
        .map(([uid]) => uid);
      setTypingUsers(typingList);
    });
    return () => unsub();
  }, [chatId, myUid]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    markOpened(chatId);
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 });
  }, [chatId, myUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const isModalOpen = profileOpen || !!lightboxUrl;
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [profileOpen, lightboxUrl]);

  useEffect(() => {
    if (!lightboxUrl) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxUrl(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    if (!chatId || !myUid) return;
    setTyping(chatId, myUid, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(chatId, myUid!, false);
    }, 1200);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImagePreview() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function send() {
    const hasText = text.trim();
    const hasImage = !!imageFile;
    if (!hasText && !hasImage) return;
    if (!chatId || !myUid) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadImageToCloudinary(imageFile);
      await sendMessage(chatId, myUid, text, replyMessage, imageUrl);
      setText("");
      setReplyMessage(null);
      setImageFile(null);
      setImagePreview(null);
      setTyping(chatId, myUid, false);
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  function handleReply(m: any) {
    setReplyMessage(m);
    inputRef.current?.focus();
  }

  function scrollToMessage(id: string) {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-flash");
    setTimeout(() => el.classList.remove("highlight-flash"), 1500);
  }

  if (!chatId) {
    return (
      <div className="flex w-full justify-center items-center h-full gap-3 bg-[#151D28] text-zinc-500">
        <span className="text-sm font-bold">Select a conversation</span>
      </div>
    );
  }

  const canSend = (text.trim() || imageFile) && !uploading;

  return (
    <>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(167, 139, 250, 0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167, 139, 250, 0.5); }
        .highlight-flash { animation: flash 1.5s ease-out; }
        @keyframes flash { 0%, 30% { background-color: rgba(167, 139, 250, 0.15); border-radius: 12px; } 100% { background-color: transparent; } }
        .reply-btn { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .reply-btn { opacity: 1; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #71717a; animation: dotbounce 1.2s infinite; }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dotbounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        .profile-modal { animation: fadeIn 0.15s ease-out; }
        .lightbox-img { animation: fadeIn 0.15s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .chat-img { cursor: zoom-in; transition: opacity 0.15s; }
        .chat-img:hover { opacity: 0.85; }
      `}</style>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={lightboxUrl}
              download
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => setLightboxUrl(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <img
            src={lightboxUrl}
            alt="photo"
            className="lightbox-img max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {profileOpen && otherUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="profile-modal w-full max-w-sm mx-4 bg-[#0F1620] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-24 bg-gradient-to-br from-[#A78BFA]/30 to-[#60A5FA]/20 relative">
              <button
                onClick={() => setProfileOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-6 text-center">
              <div className="-mt-10 mb-4 flex justify-center">
                {otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#0F1620]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-[#0F1620] flex items-center justify-center text-white text-2xl font-bold">
                    {otherUser.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-lg font-semibold text-white mb-1">
                {otherUser.username}
              </div>
              {otherUser.bio ? (
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {otherUser.bio}
                </p>
              ) : (
                <p className="text-sm text-zinc-600 italic">No bio yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full h-full bg-[#0B0F14] text-[#E5E7EB] overflow-hidden">
        <div className="flex-none h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0F1620]">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex flex-col items-start cursor-pointer group"
          >
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">
              {otherUser?.username ?? "..."}
            </span>
            {otherUser && (
              <span className="text-[11px] leading-tight">
                {isOnline(otherUser) ? (
                  <span className="text-[#34D399]">Online</span>
                ) : (
                  <span className="text-zinc-500">
                    {formatLastSeen(otherUser.lastSeen)}
                  </span>
                )}
              </span>
            )}
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#151D28] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                <button
                  onClick={async () => {
                    if (!chatId) return;
                    await updateDoc(doc(db, "chats", chatId), {
                      [`deleted.${myUid}`]: true,
                    });
                    useChatStore.getState().setActiveChat(null);
                    setMenuOpen(false);
                  }}
                  className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
                >
                  <Trash2 size={14} />
                  Delete chat
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 min-h-0">
          {messages.map((m) => {
            const isMine = m.senderId === myUid;
            return (
              <div
                key={m.id}
                id={`msg-${m.id}`}
                className={`msg-row flex ${
                  isMine ? "justify-end" : "justify-start"
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleReply(m);
                }}
              >
                <div className="relative group max-w-[72%] min-w-0">
                  <button
                    onClick={() => handleReply(m)}
                    title="Reply"
                    className={`reply-btn absolute top-1/2 -translate-y-1/2 ${
                      isMine ? "-left-8" : "-right-8"
                    } w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/5 transition-colors`}
                  >
                    <CornerUpLeft size={13} />
                  </button>
                  {m.replyTo && (
                    <div
                      onClick={() => scrollToMessage(m.replyTo.id)}
                      className="mb-1 cursor-pointer px-3 py-1.5 rounded-xl rounded-b-sm border-l-2 border-[#A78BFA] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">
                        Reply
                      </div>
                      {m.replyTo.imageUrl && !m.replyTo.text && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <ImageIcon size={11} />
                          <span>Photo</span>
                        </div>
                      )}
                      {m.replyTo.text && (
                        <div className="text-xs text-zinc-400 truncate">
                          {m.replyTo.text}
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`text-sm break-words leading-relaxed overflow-hidden ${
                      isMine
                        ? "bg-[#A78BFA] text-white rounded-2xl rounded-br-md shadow-md shadow-purple-900/20"
                        : "bg-white/[0.07] text-white/90 border border-white/[0.08] rounded-2xl rounded-bl-md"
                    } ${!m.text && m.imageUrl ? "p-1" : "px-4 py-2"}`}
                  >
                    {m.imageUrl && (
                      <img
                        src={m.imageUrl}
                        alt="image"
                        className="chat-img rounded-xl max-w-[260px] w-full object-cover block"
                        onClick={() => setLightboxUrl(m.imageUrl)}
                      />
                    )}
                    {m.text && (
                      <span
                        className={m.imageUrl ? "block px-3 pb-1 pt-2" : ""}
                      >
                        {m.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex-none border-t border-white/[0.06] bg-[#0F1620]">
          {typingUsers.length > 0 && (
            <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>typing</span>
              <span className="flex gap-0.5 items-center">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          )}
          {replyMessage && (
            <div className="mx-3 mt-2 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="w-0.5 h-7 rounded-full bg-[#A78BFA] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">
                  Replying
                </div>
                {replyMessage.imageUrl && !replyMessage.text ? (
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <ImageIcon size={11} />
                    <span>Photo</span>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 truncate">
                    {replyMessage.text}
                  </div>
                )}
              </div>
              <button
                onClick={() => setReplyMessage(null)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-zinc-600 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {imagePreview && (
            <div className="mx-3 mt-2 relative inline-block">
              <img
                src={imagePreview}
                alt="preview"
                className="h-24 rounded-xl object-cover border border-white/10"
              />
              <button
                onClick={removeImagePreview}
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/20 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={11} />
              </button>
              {uploading && (
                <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
          <div className="px-3 py-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              className="shrink-0 cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#A78BFA] hover:bg-white/[0.06] transition-colors"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              className="flex-1 h-10 px-4 rounded-xl bg-white/[0.06] border border-white/[0.07] text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#A78BFA]/40 focus:bg-white/[0.09] transition-colors"
            />
            <button
              onClick={send}
              disabled={!canSend}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#A78BFA] hover:bg-[#34D399] disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-[#A78BFA] transition-colors"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={15} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
