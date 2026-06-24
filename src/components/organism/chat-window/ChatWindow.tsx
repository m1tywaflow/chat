"use client";

import { useEffect, useState, useRef } from "react";
import { formatLastSeen, isOnline } from "@/lib/formatLastSeen";
import { useChatStore } from "@/store/chat-store";
import {
  subscribeToMessages,
  sendMessage,
  setTyping,
  markMessageRead,
  toggleReaction,
  editMessage,
  deleteMessage,
  pinMessage,
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
  Check,
  CheckCheck,
  Pencil,
  Pin,
  PinOff,
} from "lucide-react";
import ProfileModal from "../profile-modal/ProfileModal";
import MediaGallery from "../media-gallery/MediaGallery";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

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

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [msgMenuId, setMsgMenuId] = useState<string | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

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
      if (data?.typing) {
        const typingList = Object.entries(data.typing)
          .filter(([uid, val]) => val && uid !== myUid)
          .map(([uid]) => uid);
        setTypingUsers(typingList);
      }
      setPinnedMessage(data?.pinnedMessage || null);
    });
    return () => unsub();
  }, [chatId, myUid]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    markOpened(chatId);
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 });
  }, [chatId, myUid]);

  useEffect(() => {
    if (!chatId || !myUid || messages.length === 0) return;
    messages.forEach((m) => {
      if (m.senderId !== myUid && !(m.readBy || []).includes(myUid)) {
        markMessageRead(chatId, m.id, myUid);
      }
    });
  }, [messages, chatId, myUid]);

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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  useEffect(() => {
    if (!pickerOpenId && !msgMenuId) return;
    const handleClick = () => {
      setPickerOpenId(null);
      setMsgMenuId(null);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [pickerOpenId, msgMenuId]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

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

  async function handleReact(messageId: string, emoji: string) {
    if (!chatId || !myUid) return;
    setPickerOpenId(null);
    await toggleReaction(chatId, messageId, emoji, myUid);
  }

  function openPicker(e: React.MouseEvent, msgId: string) {
    e.stopPropagation();
    setPickerOpenId((prev) => (prev === msgId ? null : msgId));
    setMsgMenuId(null);
  }

  function openMsgMenu(e: React.MouseEvent, msgId: string) {
    e.stopPropagation();
    setMsgMenuId((prev) => (prev === msgId ? null : msgId));
    setPickerOpenId(null);
  }

  function startEdit(m: any) {
    setEditingId(m.id);
    setEditText(m.text || "");
    setMsgMenuId(null);
  }

  async function submitEdit() {
    if (!chatId || !editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    await editMessage(chatId, editingId, trimmed);
    setEditingId(null);
    setEditText("");
  }

  async function handleDelete(msgId: string) {
    if (!chatId) return;
    setMsgMenuId(null);
    await deleteMessage(chatId, msgId);
  }

  async function handlePin(m: any) {
    if (!chatId) return;
    setMsgMenuId(null);
    const isAlreadyPinned = pinnedMessage?.id === m.id;
    await pinMessage(
      chatId,
      isAlreadyPinned ? null : m.id,
      isAlreadyPinned ? null : m.text || "📷 Photo"
    );
  }

  function getReactionSummary(reactions: Record<string, string[]> | undefined) {
    if (!reactions) return [];
    return Object.entries(reactions)
      .filter(([, uids]) => uids.length > 0)
      .map(([emoji, uids]) => ({
        emoji,
        count: uids.length,
        mine: myUid ? uids.includes(myUid) : false,
      }));
  }

  if (!chatId) {
    return (
      <div className="flex w-full justify-center items-center h-full gap-3 bg-[#151D28] text-zinc-500">
        <span className="text-sm font-bold">
          Select a conversation in the pislk
        </span>
      </div>
    );
  }

  const canSend = (text.trim() || imageFile) && !uploading;

  return (
    <>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.5); }
        .highlight-flash { animation: flash 1.5s ease-out; }
        @keyframes flash { 0%,30% { background-color: rgba(167,139,250,0.15); border-radius: 12px; } 100% { background-color: transparent; } }
        .reply-btn,.react-btn,.msg-menu-btn { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .reply-btn,.msg-row:hover .react-btn,.msg-row:hover .msg-menu-btn { opacity: 1; }
        .dot { width:6px; height:6px; border-radius:50%; background:#71717a; animation: dotbounce 1.2s infinite; }
        .dot:nth-child(2) { animation-delay:.15s; }
        .dot:nth-child(3) { animation-delay:.3s; }
        @keyframes dotbounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }
        .lightbox-img { animation: fadeIn 0.15s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .chat-img { cursor:zoom-in; transition:opacity 0.15s; }
        .chat-img:hover { opacity:0.85; }
        .reaction-picker,.msg-ctx-menu { animation: pickerIn 0.12s ease-out; transform-origin: bottom center; }
        @keyframes pickerIn { from { opacity:0; transform:scale(0.85) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .reaction-pill { transition: transform 0.1s, background 0.1s; }
        .reaction-pill:hover { transform:scale(1.06); }
        .reaction-emoji-btn { transition: transform 0.1s; }
        .reaction-emoji-btn:hover { transform:scale(1.25); }
        .deleted-msg { opacity: 0.45; font-style: italic; }
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

      {profileOpen && otherUser?.id && (
        <ProfileModal
          userId={otherUser.id}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <div className="flex flex-col w-full h-full bg-[#0B0F14] text-[#E5E7EB] overflow-hidden">
        <div className="flex-none flex flex-col border-b border-white/[0.06] bg-[#0F1620]">
          <div className="h-14 flex items-center justify-between px-5">
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
              <div className="flex">
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <ImageIcon size={15} />
                </button>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              {galleryOpen && chatId && (
                <MediaGallery
                  chatId={chatId}
                  onClose={() => setGalleryOpen(false)}
                />
              )}
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
          {pinnedMessage && (
            <div
              onClick={() => scrollToMessage(pinnedMessage.id)}
              className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.05] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
            >
              <Pin size={12} className="text-[#A78BFA] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide leading-none mb-0.5">
                  Pinned message
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {pinnedMessage.text}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinMessage(chatId!, null, null);
                }}
                className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        <div className="chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 min-h-0">
          {messages.map((m) => {
            const isMine = m.senderId === myUid;
            const isRead = isMine && (m.readBy || []).includes(otherUser?.id);
            const isLastMine =
              isMine &&
              messages.filter((msg) => msg.senderId === myUid).at(-1)?.id ===
                m.id;
            const reactionSummary = getReactionSummary(m.reactions);
            const hasReactions = reactionSummary.length > 0;
            const isPickerOpen = pickerOpenId === m.id;
            const isMsgMenuOpen = msgMenuId === m.id;
            const isPinned = pinnedMessage?.id === m.id;
            const isEditing = editingId === m.id;

            return (
              <div
                key={m.id}
                id={`msg-${m.id}`}
                className={`msg-row flex ${
                  isMine ? "justify-end" : "justify-start"
                } ${hasReactions ? "mb-2" : ""}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isMine && !m.deleted) openMsgMenu(e, m.id);
                  else handleReply(m);
                }}
              >
                <div className="relative group max-w-[72%] min-w-0">
                  {isPickerOpen && (
                    <div
                      className={`reaction-picker absolute z-30 bottom-full mb-2 ${
                        isMine ? "right-0" : "left-0"
                      } flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(m.id, emoji)}
                          className="reaction-emoji-btn w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.08] text-lg leading-none cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  {isMsgMenuOpen && isMine && !m.deleted && (
                    <div
                      className={`msg-ctx-menu absolute z-30 bottom-full mb-2 right-0 min-w-[140px] rounded-xl bg-[#151D28] border border-white/[0.10] shadow-xl shadow-black/50 overflow-hidden`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {m.text && !m.imageUrl && (
                        <button
                          onClick={() => startEdit(m)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => handlePin(m)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                        <span>{isPinned ? "Unpin" : "Pin"}</span>
                      </button>
                      <button
                        onClick={() => handleReply(m)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <CornerUpLeft size={13} />
                        <span>Reply</span>
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                  {!m.deleted && (
                    <>
                      <button
                        onClick={() => handleReply(m)}
                        title="Reply"
                        className={`reply-btn absolute top-1/2 -translate-y-1/2 ${
                          isMine ? "-left-16" : "-right-16"
                        } w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/5 transition-colors`}
                      >
                        <CornerUpLeft size={13} />
                      </button>
                      <button
                        onClick={(e) => openPicker(e, m.id)}
                        title="React"
                        className={`react-btn absolute top-1/2 -translate-y-1/2 ${
                          isMine ? "-left-8" : "-right-8"
                        } w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/5 transition-colors text-base leading-none`}
                      >
                        <span>😊</span>
                      </button>
                      {isMine && (
                        <button
                          onClick={(e) => openMsgMenu(e, m.id)}
                          title="More"
                          className={`msg-menu-btn absolute -top-2 right-0 w-5 h-5 flex items-center justify-center rounded-full bg-[#151D28] border border-white/10 text-zinc-500 hover:text-white transition-colors`}
                        >
                          <MoreVertical size={11} />
                        </button>
                      )}
                    </>
                  )}

                  {m.replyTo && (
                    <div
                      onClick={() => scrollToMessage(m.replyTo.id)}
                      className="mb-1 cursor-pointer px-3 py-1.5 rounded-xl rounded-b-sm border-l-2 border-[#A78BFA] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">
                        Reply
                      </div>
                      {m.replyTo.imageUrl && !m.replyTo.text ? (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <ImageIcon size={11} />
                          <span>Photo</span>
                        </div>
                      ) : (
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
                    } ${
                      !m.text && m.imageUrl && !m.deleted ? "p-1" : "px-4 py-2"
                    } ${isPinned ? "ring-1 ring-[#A78BFA]/40" : ""}`}
                  >
                    {m.deleted ? (
                      <span className="deleted-msg text-zinc-500 text-xs">
                        Message deleted
                      </span>
                    ) : (
                      <>
                        {m.imageUrl && (
                          <img
                            src={m.imageUrl}
                            alt="image"
                            className="chat-img rounded-xl max-w-[260px] w-full object-cover block"
                            onClick={() => setLightboxUrl(m.imageUrl)}
                          />
                        )}
                        {isEditing ? (
                          <div className="flex items-center gap-2 py-0.5">
                            <input
                              ref={editInputRef}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitEdit();
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditText("");
                                }
                              }}
                              className="flex-1 bg-transparent outline-none text-white text-sm min-w-0"
                            />
                            <button
                              onClick={submitEdit}
                              className="shrink-0 text-white/60 hover:text-white transition-colors"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditText("");
                              }}
                              className="shrink-0 text-white/40 hover:text-white transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          m.text && (
                            <span
                              className={
                                m.imageUrl ? "block px-3 pb-1 pt-2" : ""
                              }
                            >
                              {m.text}
                              {m.edited && (
                                <span className="text-[10px] ml-1 opacity-50">
                                  (edited)
                                </span>
                              )}
                              {isMine && isLastMine && (
                                <span
                                  className={`inline-flex items-center ml-2 relative top-[2px] transition-colors ${
                                    isRead ? "text-white/70" : "text-white/40"
                                  }`}
                                >
                                  {isRead ? (
                                    <CheckCheck size={16} />
                                  ) : (
                                    <Check size={16} />
                                  )}
                                </span>
                              )}
                            </span>
                          )
                        )}
                        {!m.text && m.imageUrl && isMine && isLastMine && (
                          <div
                            className={`flex justify-end px-2 pb-1 transition-colors ${
                              isRead ? "text-white/70" : "text-white/40"
                            }`}
                          >
                            {isRead ? (
                              <CheckCheck size={16} />
                            ) : (
                              <Check size={16} />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {!m.deleted && (
                    <div
                      className={`text-[10px] text-zinc-600 mt-0.5 ${
                        isMine ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(m.createdAt)}
                    </div>
                  )}
                  {hasReactions && !m.deleted && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {reactionSummary.map(({ emoji, count, mine }) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(m.id, emoji)}
                          className={`reaction-pill flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border ${
                            mine
                              ? "bg-[#A78BFA]/20 border-[#A78BFA]/50 text-[#A78BFA]"
                              : "bg-white/[0.06] border-white/[0.10] text-zinc-400 hover:border-white/20"
                          }`}
                        >
                          <span className="text-sm leading-none">{emoji}</span>
                          <span className="font-medium">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
