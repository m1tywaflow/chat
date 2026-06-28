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
  Play,
  Copy,
} from "lucide-react";
import ProfileModal from "../profile-modal/ProfileModal";
import MediaGallery from "../media-gallery/MediaGallery";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function isVideo(url: string) {
  return (
    /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url) ||
    url.includes("/video/upload/")
  );
}

async function uploadToCloudinary(file: File): Promise<string> {
  const isVid = file.type.startsWith("video/");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", isVid ? "chat_videos" : "chat_images");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dgylh67ms/${
      isVid ? "video" : "image"
    }/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MsgMenuState {
  id: string;
  x: number;
  y: number;
  openUpward: boolean;
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
        className="w-[320px] rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
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
  const [msgMenu, setMsgMenu] = useState<MsgMenuState | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isFileVideo, setIsFileVideo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteChatConfirm, setDeleteChatConfirm] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const msgMenuRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const isNearBottom = useRef(true);

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
      if (m.senderId !== myUid && !(m.readBy || []).includes(myUid))
        markMessageRead(chatId, m.id, myUid);
    });
  }, [messages, chatId, myUid]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    function onScroll() {
      isNearBottom.current =
        el!.scrollHeight - el!.scrollTop - el!.clientHeight < 80;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isNearBottom.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
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
    if (!pickerOpenId && !msgMenu) return;
    const handleClick = () => {
      setPickerOpenId(null);
      setMsgMenu(null);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [pickerOpenId, msgMenu]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  // close header menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

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
    setIsFileVideo(file.type.startsWith("video/"));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImagePreview() {
    setImageFile(null);
    setImagePreview(null);
    setIsFileVideo(false);
  }

  async function send() {
    const hasText = text.trim();
    const hasImage = !!imageFile;
    if (!hasText && !hasImage) return;
    if (!chatId || !myUid) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);
      await sendMessage(chatId, myUid, text, replyMessage, imageUrl);
      setText("");
      setReplyMessage(null);
      setImageFile(null);
      setImagePreview(null);
      setIsFileVideo(false);
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
    setMsgMenu(null);
  }

  function openMsgMenu(e: React.MouseEvent, msgId: string, isMine: boolean) {
    e.preventDefault();
    e.stopPropagation();
    if (!isMine) return;
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
          }
    );
    setPickerOpenId(null);
  }

  function startEdit(m: any) {
    setEditingId(m.id);
    setEditText(m.text || "");
    setMsgMenu(null);
  }

  async function submitEdit() {
    if (!chatId || !editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    await editMessage(chatId, editingId, trimmed);
    setEditingId(null);
    setEditText("");
  }

  function handleDelete(msgId: string) {
    setMsgMenu(null);
    setDeleteConfirmId(msgId);
  }

  async function confirmDelete() {
    if (!chatId || !deleteConfirmId) return;
    await deleteMessage(chatId, deleteConfirmId);
    setDeleteConfirmId(null);
  }

  async function confirmDeleteChat() {
    if (!chatId) return;
    await updateDoc(doc(db, "chats", chatId), { [`deleted.${myUid}`]: true });
    useChatStore.getState().setActiveChat(null);
    setDeleteChatConfirm(false);
  }

  async function handlePin(m: any) {
    if (!chatId) return;
    setMsgMenu(null);
    const isAlreadyPinned = pinnedMessage?.id === m.id;
    await pinMessage(
      chatId,
      isAlreadyPinned ? null : m.id,
      isAlreadyPinned ? null : m.text || "📷 Photo"
    );
  }

  async function handleCopy(m: any) {
    if (!m.text) return;
    await navigator.clipboard.writeText(m.text);
    setCopiedId(m.id);
    setMsgMenu(null);
    setTimeout(() => setCopiedId(null), 1800);
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
      <div
        className="flex w-full justify-center items-center h-full gap-3 text-zinc-500"
        style={{ background: "var(--color-chat-bg)" }}
      >
        <span className="text-sm font-bold">
          Select a conversation in the pislk
        </span>
      </div>
    );
  }

  const canSend = (text.trim() || imageFile) && !uploading;
  const currentMsgMenu = msgMenu
    ? messages.find((m) => m.id === msgMenu.id)
    : null;

  return (
    <>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.5); }
        .highlight-flash { animation: flash 1.5s ease-out; }
        @keyframes flash { 0%,30% { background-color: rgba(167,139,250,0.15); border-radius: 12px; } 100% { background-color: transparent; } }
        .reply-btn,.react-btn { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .reply-btn,.msg-row:hover .react-btn { opacity: 1; }
        .msg-dots { opacity: 0; transition: opacity 0.15s, transform 0.15s; transform: scale(0.85); }
        .msg-row:hover .msg-dots { opacity: 1; transform: scale(1); }
        .dot { width:6px; height:6px; border-radius:50%; background:#71717a; animation: dotbounce 1.2s infinite; }
        .dot:nth-child(2) { animation-delay:.15s; }
        .dot:nth-child(3) { animation-delay:.3s; }
        @keyframes dotbounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }
        .lightbox-img { animation: fadeIn 0.15s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .chat-img { cursor:zoom-in; transition:opacity 0.15s; }
        .chat-img:hover { opacity:0.85; }
        .reaction-picker { animation: pickerIn 0.12s ease-out; transform-origin: bottom center; }
        @keyframes pickerIn { from { opacity:0; transform:scale(0.85) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .msg-ctx-menu { animation: menuIn 0.15s cubic-bezier(0.34,1.56,0.64,1); transform-origin: top right; }
        @keyframes menuIn { from { opacity:0; transform:scale(0.88) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .confirm-dialog { animation: dialogIn 0.18s cubic-bezier(0.34,1.4,0.64,1); }
        @keyframes dialogIn { from { opacity:0; transform:scale(0.93) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .reaction-pill { transition: transform 0.1s, background 0.1s; }
        .reaction-pill:hover { transform:scale(1.06); }
        .reaction-emoji-btn { transition: transform 0.1s; }
        .reaction-emoji-btn:hover { transform:scale(1.25); }
        .deleted-msg { opacity: 0.45; font-style: italic; }
        .chat-video { border-radius: 12px; max-width: 260px; width: 100%; display: block; background: #000; }
        .video-thumb { position: relative; cursor: pointer; }
        .video-thumb:hover .play-overlay { opacity: 1; }
        .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); border-radius: 12px; opacity: 0; transition: opacity 0.15s; }
        .ctx-item { width:100%; display:flex; align-items:center; gap:10px; padding:9px 14px; font-size:13px; transition:background 0.1s; cursor:pointer; border:none; background:transparent; text-align:left; }
        .ctx-item:hover { background: rgba(255,255,255,0.05); }
        .ctx-divider { height:1px; background:rgba(255,255,255,0.06); margin:2px 0; }
      `}</style>

      {/* Message context menu */}
      {msgMenu && currentMsgMenu && !currentMsgMenu.deleted && (
        <div
          ref={msgMenuRef}
          className="msg-ctx-menu fixed z-[100] min-w-[168px] rounded-2xl bg-[#151D28] border border-white/[0.09] shadow-2xl shadow-black/60 overflow-hidden"
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
          {currentMsgMenu.text && !currentMsgMenu.imageUrl && (
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
          <div className="ctx-divider" />
          <button
            className="ctx-item text-red-400"
            onClick={() => handleDelete(currentMsgMenu.id)}
          >
            <Trash2 size={14} className="text-red-400/60" />
            Delete
          </button>
        </div>
      )}

      {/* Lightbox */}
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
        <ProfileModal
          userId={otherUser.id}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* Delete message confirm */}
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

      {/* Delete chat confirm */}
      {deleteChatConfirm && (
        <ConfirmDialog
          icon={<Trash2 size={18} className="text-red-400" />}
          title="Delete chat?"
          description="This will permanently delete the entire conversation. This action cannot be undone."
          onCancel={() => setDeleteChatConfirm(false)}
          onConfirm={confirmDeleteChat}
          confirmLabel="Delete"
        />
      )}

      <div
        className="flex flex-col w-full h-full overflow-hidden"
        style={{
          background: "var(--color-chat-bg)",
          color: "var(--color-text)",
        }}
      >
        {/* Header */}
        <div className="flex-none flex flex-col border-b border-white/[0.06] bg-[#0c121a]">
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
            <div className="relative  items-center " ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>
              {galleryOpen && chatId && (
                <MediaGallery
                  chatId={chatId}
                  onClose={() => setGalleryOpen(false)}
                />
              )}
              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#151D28] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setGalleryOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] transition-colors"
                  >
                    <ImageIcon size={14} />
                    Media gallery
                  </button>
                  <div className="h-px bg-white/[0.06]" />
                  <button
                    onClick={() => {
                      setDeleteChatConfirm(true);
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

        {/* Messages */}
        <div
          ref={chatScrollRef}
          className="chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 min-h-0"
        >
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
            const isPinned = pinnedMessage?.id === m.id;
            const isEditing = editingId === m.id;
            const msgIsVideo = m.imageUrl && isVideo(m.imageUrl);

            return (
              <div
                key={m.id}
                id={`msg-${m.id}`}
                className={`msg-row flex ${
                  isMine ? "justify-end" : "justify-start"
                } ${hasReactions ? "mb-2" : ""}`}
                onContextMenu={(e) => {
                  if (isMine && !m.deleted) openMsgMenu(e, m.id, true);
                  else {
                    e.preventDefault();
                    handleReply(m);
                  }
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
                          title="More options"
                          onClick={(e) => openMsgMenu(e, m.id, true)}
                          className="msg-dots absolute -top-2.5 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2a3a] border border-white/[0.12] text-zinc-400 hover:text-white hover:border-[#A78BFA]/40 hover:bg-[#252f42] transition-all shadow-sm"
                        >
                          <MoreVertical size={12} />
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
                    className={`text-sm leading-relaxed overflow-hidden ${
                      isMine
                        ? "bg-[#655c85] text-white rounded-2xl rounded-br-md shadow-md shadow-purple-900/20"
                        : "border border-white/[0.08] rounded-2xl rounded-bl-md"
                    } ${
                      !m.text && m.imageUrl && !m.deleted ? "p-1" : "px-4 py-2"
                    } ${isPinned ? "ring-1 ring-[#A78BFA]/40" : ""}`}
                    style={
                      !isMine
                        ? {
                            background: "var(--color-msg-bg)",
                            color: "var(--color-text)",
                          }
                        : undefined
                    }
                  >
                    {m.deleted ? (
                      <span className="deleted-msg text-white text-xs">
                        Message deleted
                      </span>
                    ) : (
                      <>
                        {m.imageUrl &&
                          (msgIsVideo ? (
                            <div
                              className="video-thumb"
                              onClick={() => setLightboxUrl(m.imageUrl)}
                            >
                              <video
                                src={m.imageUrl}
                                className="chat-video"
                                preload="metadata"
                              />
                              <div className="play-overlay">
                                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                                  <Play
                                    size={18}
                                    className="text-white ml-0.5"
                                    fill="white"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={m.imageUrl}
                              alt="image"
                              className="chat-img rounded-xl max-w-[260px] w-full object-cover block"
                              onClick={() => setLightboxUrl(m.imageUrl)}
                            />
                          ))}
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

        {/* Input area */}
        <div className="flex-none border-t border-white/[0.06] bg-[#0d0b14]">
          {typingUsers.length > 0 && (
            <div className="px-5 pt-2.5 flex items-center gap-1.5 text-xs text-zinc-600">
              <span>typing</span>
              <span className="flex gap-0.5 items-center">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          )}

          {replyMessage && (
            <div className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#A78BFA]/[0.06] border border-[#A78BFA]/20">
              <div className="w-0.5 h-7 rounded-full bg-[#A78BFA] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">
                  Replying
                </div>
                {replyMessage.imageUrl && !replyMessage.text ? (
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <ImageIcon size={11} />
                    <span>Photo</span>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 truncate">
                    {replyMessage.text}
                  </div>
                )}
              </div>
              <button
                onClick={() => setReplyMessage(null)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-600 hover:text-white hover:bg-white/[0.1] transition-all"
              >
                <X size={11} />
              </button>
            </div>
          )}

          {imagePreview && (
            <div className="mx-3 mt-3 relative inline-block">
              {isFileVideo ? (
                <video
                  src={imagePreview}
                  className="h-24 rounded-2xl border border-white/[0.08] bg-black"
                  muted
                />
              ) : (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-24 rounded-2xl object-cover border border-white/[0.08]"
                />
              )}
              <button
                onClick={removeImagePreview}
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors"
              >
                <X size={11} />
              </button>
              {uploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          <div className="px-3 py-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              className="shrink-0 cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 hover:text-[#A78BFA] hover:bg-[#A78BFA]/[0.08] transition-all hover:scale-105 active:scale-95"
            >
              <Paperclip size={16} />
            </button>

            <input
              ref={inputRef}
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              className="flex-1 h-11 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 focus:bg-white/[0.07] transition-all"
              style={{ caretColor: "#A78BFA" }}
            />

            <button
              onClick={send}
              disabled={!canSend}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 active:scale-90"
              style={{
                background: "linear-gradient(135deg, #A78BFA, #7c3aed)",
                boxShadow: canSend ? "0 4px 20px rgba(124,58,237,0.5)" : "none",
              }}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send
                  size={14}
                  className="text-white"
                  style={{ transform: "translateX(1px)" }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
