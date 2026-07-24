"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useGroupStore } from "@/store/group-store";
import {
  subscribeToGroupMessages,
  sendGroupMessage,
  markGroupMessageRead,
  toggleGroupReaction,
  editGroupMessage,
  deleteGroupMessage,
  pinGroupMessage,
  leaveGroup,
  deleteGroup,
} from "@/lib/firestore/groups";
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
  Clock,
  Pencil,
  Pin,
  PinOff,
  Play,
  Copy,
  ChevronDown,
  Smile,
  Users,
  LogOut,
} from "lucide-react";
import {
  CUSTOM_EMOJIS,
  getCustomEmoji,
  isCustomEmojiUrl,
} from "@/lib/customEmoji";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const REACTION_OPTIONS = [
  ...REACTION_EMOJIS,
  ...CUSTOM_EMOJIS.map((e) => e.id),
];
const NEAR_BOTTOM_THRESHOLD = 120;

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
  formData.append("folder", isVid ? "group_videos" : "group_images");
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

function ReactionGlyph({ token, size = 24 }: { token: string; size?: number }) {
  const custom = getCustomEmoji(token);
  if (custom) {
    return (
      <img
        src={custom.url}
        alt={custom.id}
        style={{ width: size, height: size, objectFit: "contain" }}
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

function StatusTick({
  pending,
  isRead,
  size = 14,
}: {
  pending?: boolean;
  isRead: boolean;
  size?: number;
}) {
  if (pending)
    return (
      <Clock
        size={size - 2}
        className="opacity-70 shrink-0"
        strokeWidth={2.25}
      />
    );
  return isRead ? (
    <CheckCheck size={size} className="shrink-0" strokeWidth={2.25} />
  ) : (
    <Check size={size} className="shrink-0" strokeWidth={2.25} />
  );
}

function MessageMeta({
  time,
  pending,
  isMine,
  isRead,
  variant = "inline",
}: {
  time: string;
  pending?: boolean;
  isMine: boolean;
  isRead: boolean;
  variant?: "inline" | "pill";
}) {
  const content = (
    <span
      className={`inline-flex items-center gap-1 leading-none tabular-nums select-none whitespace-nowrap ${
        variant === "pill" ? "text-[11px] text-white/90" : "text-[11px]"
      } ${variant === "inline" && isMine ? "text-white/65" : ""}`}
      style={
        variant === "inline" && !isMine
          ? { color: "var(--color-text)", opacity: 0.55 }
          : undefined
      }
    >
      <span>{pending ? "" : time}</span>
      {isMine && (
        <span
          className={
            variant === "pill"
              ? "text-white/90"
              : isRead
              ? "text-[#d7c3ff]"
              : "text-white/60"
          }
        >
          <StatusTick pending={pending} isRead={isRead} />
        </span>
      )}
    </span>
  );

  if (variant === "pill") {
    return (
      <span className="inline-flex items-center rounded-full bg-black/45 backdrop-blur-sm px-1.5 py-[3px]">
        {content}
      </span>
    );
  }
  return content;
}

interface MsgMenuState {
  id: string;
  x: number;
  y: number;
  openUpward: boolean;
  isMine: boolean;
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

export default function GroupWindow() {
  const groupId = useGroupStore((s) => s.activeGroupId);
  const setActiveGroup = useGroupStore((s) => s.setActiveGroup);
  const groups = useGroupStore((s) => s.groups);
  const group = groups.find((g) => g.id === groupId) || null;

  const [messages, setMessages] = useState<any[]>([]);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [isFileVideo, setIsFileVideo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const msgMenuRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const isNearBottom = useRef(true);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const initializedGroupRef = useRef<string | null>(null);
  const dragCounter = useRef(0);

  const isWindowVisible = useWindowVisibilityStore((s) => s.isVisible);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
  }, []);

  useEffect(() => {
    if (!myUid) return;
    const unsub = onSnapshot(doc(db, "users", myUid), (snap) => {
      setMyUsername(snap.data()?.username || "");
    });
    return () => unsub();
  }, [myUid]);

  // reset per-group state when switching groups
  useEffect(() => {
    setMessages([]);
    setPendingMessages([]);
    setShowScrollButton(false);
    initializedGroupRef.current = null;
    isNearBottom.current = true;
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeToGroupMessages(groupId, (msgs) => {
      setMessages(msgs);
      // подтверждаем свои optimistic-сообщения, когда они реально прилетели
      setPendingMessages((prev) =>
        prev.filter(
          (p) =>
            !msgs.some((m) => m.text === p.text && m.senderId === p.senderId)
        )
      );

      if (myUid && isWindowVisible) {
        msgs.forEach((m) => {
          if (m.senderId !== myUid && !(m.readBy || []).includes(myUid)) {
            markGroupMessageRead(groupId, m.id, myUid).catch(() => {});
          }
        });
      }
    });
    return () => unsub();
  }, [groupId, myUid, isWindowVisible]);

  useEffect(() => {
    if (!groupId) return;
    const unsub = onSnapshot(doc(db, "groups", groupId), (snap) => {
      const data = snap.data();
      setPinnedMessage(data?.pinnedMessage || null);
    });
    return () => unsub();
  }, [groupId]);

  function handleScroll() {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isNearBottom.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }

  useLayoutEffect(() => {
    if (!groupId || messages.length === 0) return;
    if (initializedGroupRef.current === groupId) {
      if (isNearBottom.current) {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
      return;
    }
    initializedGroupRef.current = groupId;
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    isNearBottom.current = true;
    setShowScrollButton(false);
  }, [groupId, messages]);

  useLayoutEffect(() => {
    if (!groupId || initializedGroupRef.current !== groupId) return;
    if (pendingMessages.length === 0) return;
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [pendingMessages, groupId]);

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
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

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

  function setFileForPreview(file: File) {
    setIsFileVideo(file.type.startsWith("video/"));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setFileForPreview(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          setFileForPreview(file);
        }
        break;
      }
    }
  }

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
    if (
      file &&
      (file.type.startsWith("image/") || file.type.startsWith("video/"))
    ) {
      setFileForPreview(file);
    }
  }

  function removeImagePreview() {
    setImageFile(null);
    setImagePreview(null);
    setIsFileVideo(false);
  }

  async function send() {
    const hasText = !!text.trim();
    const hasImage = !!imageFile;
    if (!hasText && !hasImage) return;
    if (!groupId || !myUid) return;

    const messageText = text;
    const currentReply = replyMessage;
    const fileToUpload = imageFile;
    const localPreviewUrl = imagePreview;
    const wasVideo = isFileVideo;
    const senderName = myUsername || "Unknown";

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg = {
      id: tempId,
      senderId: myUid,
      senderName,
      text: messageText,
      imageUrl: localPreviewUrl || undefined,
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
    setText("");
    setReplyMessage(null);
    setImageFile(null);
    setImagePreview(null);
    setIsFileVideo(false);
    isNearBottom.current = true;
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });

    try {
      let imageUrl: string | undefined;
      if (fileToUpload) {
        setUploading(true);
        imageUrl = await uploadToCloudinary(fileToUpload);
      }
      await sendGroupMessage(
        groupId,
        myUid,
        senderName,
        messageText,
        currentReply,
        imageUrl
      );
    } catch (err) {
      console.error("Send failed:", err);
      setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
      setText((t) => t || messageText);
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
    const el = document.getElementById(`gmsg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-flash");
    setTimeout(() => el.classList.remove("highlight-flash"), 1500);
  }

  async function handleReact(messageId: string, token: string) {
    if (!groupId || !myUid) return;
    setPickerOpenId(null);
    await toggleGroupReaction(groupId, messageId, token, myUid);
  }

  function openPicker(e: React.MouseEvent, msgId: string) {
    e.stopPropagation();
    setPickerOpenId((prev) => (prev === msgId ? null : msgId));
    setPickerExpanded(false);
    setMsgMenu(null);
  }

  async function sendSticker(url: string) {
    if (!groupId || !myUid) return;
    await sendGroupMessage(
      groupId,
      myUid,
      myUsername || "Unknown",
      "",
      replyMessage,
      url
    );
    setReplyMessage(null);
    setEmojiPanelOpen(false);
  }

  function openMsgMenu(e: React.MouseEvent, msgId: string, isMine: boolean) {
    e.preventDefault();
    e.stopPropagation();
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
            isMine,
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
    if (!groupId || !editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    await editGroupMessage(groupId, editingId, trimmed);
    setEditingId(null);
    setEditText("");
  }

  function handleDelete(msgId: string) {
    setMsgMenu(null);
    setDeleteConfirmId(msgId);
  }

  async function confirmDelete() {
    if (!groupId || !deleteConfirmId) return;
    await deleteGroupMessage(groupId, deleteConfirmId);
    setDeleteConfirmId(null);
  }

  async function handlePin(m: any) {
    if (!groupId) return;
    setMsgMenu(null);
    const isAlreadyPinned = pinnedMessage?.id === m.id;
    await pinGroupMessage(
      groupId,
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

  async function confirmLeaveOrDelete() {
    if (!groupId || !myUid || !group) return;
    if (group.ownerId === myUid) {
      await deleteGroup(groupId);
    } else {
      await leaveGroup(groupId, myUid);
    }
    setActiveGroup(null);
    setLeaveConfirm(false);
  }

  function getReactionSummary(reactions: Record<string, string[]> | undefined) {
    if (!reactions) return [];
    return Object.entries(reactions)
      .filter(([, uids]) => uids.length > 0)
      .map(([token, uids]) => ({
        token,
        count: uids.length,
        mine: myUid ? uids.includes(myUid) : false,
      }));
  }

  if (!groupId || !group) {
    return (
      <div
        className="flex w-full justify-center items-center h-full gap-3 text-zinc-500"
        style={{ background: "var(--color-chat-bg)" }}
      >
        <span className="text-sm font-bold">Select a group in the pislk</span>
      </div>
    );
  }

  const canSend = (text.trim() || imageFile) && !uploading;
  const displayMessages = [...messages, ...pendingMessages];
  const currentMsgMenu = msgMenu
    ? displayMessages.find((m) => m.id === msgMenu.id)
    : null;
  const isOwner = group.ownerId === myUid;

  return (
    <>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }
        .highlight-flash { animation: flash 1.5s ease-out; }
        @keyframes flash { 0%,30% { background-color: rgba(124,92,255,0.15); border-radius: 12px; } 100% { background-color: transparent; } }
        .reply-btn,.react-btn { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .reply-btn,.msg-row:hover .react-btn { opacity: 1; }
        .msg-dots { opacity: 0; transition: opacity 0.15s, transform 0.15s; transform: scale(0.85); }
        .msg-row:hover .msg-dots { opacity: 1; transform: scale(1); }
        .lightbox-img { animation: fadeIn 0.15s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .chat-img { cursor:zoom-in; transition:opacity 0.15s; }
        .chat-img:hover { opacity:0.85; }
        .reaction-picker { animation: pickerIn 0.12s ease-out; transform-origin: bottom center; }
        @keyframes pickerIn { from { opacity:0; transform:scale(0.85) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .msg-ctx-menu { animation: menuIn 0.15s cubic-bezier(0.34,1.56,0.64,1); transform-origin: top right; }
        @keyframes menuIn { from { opacity:0; transform:scale(0.88) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }
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
        .msg-bubble-pending { opacity: 0.75; transition: opacity 0.2s ease-out; }
      `}</style>

      {msgMenu && currentMsgMenu && !currentMsgMenu.deleted && (
        <div
          ref={msgMenuRef}
          className="msg-ctx-menu fixed z-[100] min-w-[168px] rounded-2xl bg-[#0d0b17]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
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
          {msgMenu.isMine &&
            currentMsgMenu.text &&
            !currentMsgMenu.imageUrl && (
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
        </div>
      )}

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

      {leaveConfirm && (
        <ConfirmDialog
          icon={
            isOwner ? (
              <Trash2 size={18} className="text-red-400" />
            ) : (
              <LogOut size={18} className="text-red-400" />
            )
          }
          title={isOwner ? "Delete group?" : "Leave group?"}
          description={
            isOwner
              ? "This will permanently delete the group for all members. This action cannot be undone."
              : "You will stop receiving messages from this group. You'll need a new invite to rejoin."
          }
          onCancel={() => setLeaveConfirm(false)}
          onConfirm={confirmLeaveOrDelete}
          confirmLabel={isOwner ? "Delete" : "Leave"}
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
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
        </div>

        {isDraggingFile && (
          <div className="absolute inset-2 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#7c5cff] bg-[#0d0b17]/85 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-[#a893ff]">
              <ImageIcon size={32} />
              <span className="text-sm font-semibold">
                Drop image or video to send
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90 backdrop-blur-xl relative z-20">
          <div className="h-14 flex items-center justify-between px-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1e2a3a] flex items-center justify-center shrink-0 overflow-hidden">
                {group.avatarUrl ? (
                  <img
                    src={group.avatarUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={14} className="text-[#a893ff]" />
                )}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-white/80">
                  {group.name}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="relative items-center" ref={menuRef}>
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
                      setLeaveConfirm(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
                  >
                    {isOwner ? <Trash2 size={14} /> : <LogOut size={14} />}
                    {isOwner ? "Delete group" : "Leave group"}
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
              <Pin size={12} className="text-[#a893ff] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#a893ff] uppercase tracking-wide leading-none mb-0.5">
                  Pinned message
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {pinnedMessage.text}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinGroupMessage(groupId!, null, null);
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
          onScroll={handleScroll}
          className="chat-scroll relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 min-h-0"
        >
          {displayMessages.map((m) => {
            const isMine = m.senderId === myUid;
            const reactionSummary = getReactionSummary(m.reactions);
            const hasReactions = reactionSummary.length > 0;
            const isPickerOpen = pickerOpenId === m.id;
            const isPinned = pinnedMessage?.id === m.id;
            const isEditing = editingId === m.id;
            const msgIsVideo =
              m.imageUrl && (m.isLocalVideo || isVideo(m.imageUrl));
            const isStickerMsg =
              !m.text && m.imageUrl && isCustomEmojiUrl(m.imageUrl);
            const time = formatTime(m.createdAt);
            const readCount = (m.readBy || []).length;

            return (
              <div key={m.id}>
                <div
                  id={`gmsg-${m.id}`}
                  className={`msg-row flex ${
                    isMine ? "justify-end" : "justify-start"
                  } ${hasReactions ? "mb-2" : ""}`}
                  onContextMenu={(e) => {
                    if (!m.deleted && !m.pending) openMsgMenu(e, m.id, isMine);
                  }}
                >
                  <div className="relative group max-w-[72%] min-w-0">
                    {isPickerOpen && (
                      <div
                        className={`reaction-picker absolute z-30 bottom-full mb-2 ${
                          isMine ? "right-0" : "left-0"
                        } rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 ${
                          pickerExpanded ? "p-2.5 w-[252px]" : "px-2.5 py-2"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!pickerExpanded ? (
                          <div className="flex items-center gap-1">
                            {REACTION_EMOJIS.map((token) => (
                              <button
                                key={token}
                                onClick={() => handleReact(m.id, token)}
                                className="reaction-emoji-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                              >
                                <ReactionGlyph token={token} size={26} />
                              </button>
                            ))}
                            <button
                              onClick={() => setPickerExpanded(true)}
                              title="More reactions"
                              className="w-7 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] text-zinc-500 hover:text-white cursor-pointer"
                            >
                              <ChevronDown size={22} />
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-6 gap-1">
                            {REACTION_OPTIONS.map((token) => (
                              <button
                                key={token}
                                onClick={() => handleReact(m.id, token)}
                                className="reaction-emoji-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                              >
                                <ReactionGlyph token={token} size={26} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!m.deleted && !m.pending && (
                      <>
                        <button
                          onClick={() => handleReply(m)}
                          title="Reply"
                          className={`reply-btn absolute top-1/2 -translate-y-1/2 ${
                            isMine ? "-left-16" : "-right-16"
                          } w-6 h-6 flex items-center justify-center rounded-full text-zinc-300 hover:text-[#a893ff] bg-[#0d0b17]/80 hover:bg-[#7c5cff]/20 backdrop-blur-sm transition-colors border border-white/[0.08]`}
                        >
                          <CornerUpLeft size={13} />
                        </button>
                        <button
                          onClick={(e) => openPicker(e, m.id)}
                          title="React"
                          className={`react-btn absolute top-1/2 -translate-y-1/2 ${
                            isMine ? "-left-8" : "-right-8"
                          } w-6 h-6 flex items-center justify-center rounded-full text-zinc-300 hover:text-[#a893ff] bg-[#0d0b17]/80 hover:bg-[#7c5cff]/20 backdrop-blur-sm transition-colors text-base leading-none border border-white/[0.08]`}
                        >
                          <span>😊</span>
                        </button>
                        <button
                          title="More options"
                          onClick={(e) => openMsgMenu(e, m.id, isMine)}
                          className="msg-dots absolute -top-2.5 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#0d0b17] border border-white/[0.12] text-zinc-400 hover:text-white hover:border-[#7c5cff]/40 hover:bg-[#1b1633] transition-all shadow-sm"
                        >
                          <MoreVertical size={12} />
                        </button>
                      </>
                    )}

                    {/* имя отправителя — только у чужих сообщений, как в Telegram-группах */}
                    {!isMine && (
                      <div className="mb-0.5 px-1 text-[12px] font-semibold text-[#a893ff]">
                        {m.senderName}
                      </div>
                    )}

                    {m.replyTo && (
                      <div
                        onClick={() => scrollToMessage(m.replyTo.id)}
                        className="mb-1 cursor-pointer px-3 py-1.5 rounded-xl rounded-b-sm border-l-2 border-[#7c5cff] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                      >
                        <div className="text-[10px] font-semibold text-[#a893ff] uppercase tracking-wide mb-0.5">
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
                      className={
                        isStickerMsg
                          ? `leading-none ${
                              m.pending ? "msg-bubble-pending" : ""
                            }`
                          : `text-sm leading-relaxed overflow-hidden ${
                              isMine
                                ? "bg-gradient-to-r from-[#6b46f0] via-[#5b3df0] to-[#4028b0] text-white rounded-[18px] rounded-br-[8px] shadow-md shadow-[#5b3df0]/20"
                                : "border border-white/[0.08] rounded-2xl rounded-bl-md"
                            } ${
                              !m.text && m.imageUrl && !m.deleted
                                ? "p-1"
                                : "px-4 py-2"
                            } ${isPinned ? "ring-1 ring-[#7c5cff]/40" : ""} ${
                              m.pending ? "msg-bubble-pending" : ""
                            }`
                      }
                      style={
                        !isMine && !isStickerMsg
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
                      ) : isStickerMsg ? (
                        <div className="relative inline-block">
                          <img
                            src={m.imageUrl}
                            alt="sticker"
                            className="w-32 h-32 object-contain"
                          />
                          {isMine && (
                            <span className="absolute bottom-1.5 right-1.5">
                              <MessageMeta
                                time={time}
                                pending={m.pending}
                                isMine={isMine}
                                isRead={readCount > 1}
                                variant="pill"
                              />
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          {m.imageUrl &&
                            (msgIsVideo ? (
                              <div
                                className="video-thumb"
                                onClick={() =>
                                  !m.pending && setLightboxUrl(m.imageUrl)
                                }
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
                                onClick={() =>
                                  !m.pending && setLightboxUrl(m.imageUrl)
                                }
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
                              <div
                                className={`flex items-end gap-2.5 flex-wrap justify-between ${
                                  m.imageUrl ? "px-3 pb-1 pt-2" : ""
                                }`}
                              >
                                <span className="whitespace-pre-wrap break-words">
                                  {m.text}
                                  {m.edited && (
                                    <span className="text-[10px] ml-1 opacity-50">
                                      (edited)
                                    </span>
                                  )}
                                </span>
                                <MessageMeta
                                  time={time}
                                  pending={m.pending}
                                  isMine={isMine}
                                  isRead={readCount > 1}
                                  variant="inline"
                                />
                              </div>
                            )
                          )}
                          {!m.text && m.imageUrl && isMine && (
                            <div className="flex justify-end px-1.5 pb-1 pt-1">
                              <MessageMeta
                                time={time}
                                pending={m.pending}
                                isMine={isMine}
                                isRead={readCount > 1}
                                variant="pill"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {hasReactions && !m.deleted && (
                      <div
                        className={`flex flex-wrap gap-1 mt-1 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {reactionSummary.map(({ token, count, mine }) => (
                          <button
                            key={token}
                            onClick={() => handleReact(m.id, token)}
                            className={`reaction-pill flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border ${
                              mine
                                ? "bg-[#7c5cff]/25 border-[#7c5cff]/50 text-[#a893ff] backdrop-blur-sm"
                                : "bg-black/40 border-white/20 text-zinc-300 hover:border-white/30 backdrop-blur-sm"
                            }`}
                          >
                            <ReactionGlyph token={token} size={15} />
                            <span className="font-medium">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />

          {showScrollButton && (
            <button
              onClick={() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                isNearBottom.current = true;
                setShowScrollButton(false);
              }}
              title="Scroll to bottom"
              className="absolute z-20 bottom-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#12111f] border border-white/[0.10] shadow-lg shadow-black/40 text-[#a893ff] hover:bg-[#1b1633] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>

        {/* Input area — идентичен ChatWindow */}
        <div className="flex-none border-t border-white/[0.06] bg-[#0d0b17]/95 backdrop-blur-xl relative z-10">
          {replyMessage && (
            <div className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#7c5cff]/[0.06] border border-[#7c5cff]/20">
              <div className="w-0.5 h-7 rounded-full bg-[#7c5cff] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#a893ff] uppercase tracking-wide mb-0.5">
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
            </div>
          )}

          <div className="px-4 py-3 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex-1 h-[54px] flex items-center gap-3 px-4 rounded-full bg-[#12111f]/80 backdrop-blur-xl border border-white/[0.07] shadow-[inset_0_0_20px_rgba(124,92,255,0.03)] transition-all focus-within:border-[#7c5cff]/40">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
              >
                <Paperclip size={18} />
              </button>
              <div className="relative shrink-0" ref={emojiPanelRef}>
                <button
                  onClick={() => setEmojiPanelOpen((v) => !v)}
                  title="Send emoji"
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
                >
                  <Smile size={18} />
                </button>
                {emojiPanelOpen && (
                  <div className="reaction-picker chat-scroll absolute z-50 bottom-full mb-3 left-0 grid grid-cols-4 gap-2 p-3 w-[230px] max-h-[230px] overflow-y-auto rounded-2xl bg-[#12111f] border border-white/[0.08] shadow-xl shadow-black/50">
                    {CUSTOM_EMOJIS.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => sendSticker(e.url)}
                        className="reaction-emoji-btn w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
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
                placeholder="Message…"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-white placeholder:text-zinc-600"
                style={{ caretColor: "#7c5cff" }}
              />
            </div>
            <button
              onClick={send}
              disabled={!canSend}
              className="shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Send
                size={19}
                className="text-white"
                style={{ transform: "translateX(-1px)" }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
