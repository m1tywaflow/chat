"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGroupStore } from "@/store/group-store";
import {
  subscribeToGroupMessages,
  loadOlderGroupMessages,
  markGroupMessageRead,
  markGroupAsRead,
  toggleGroupReaction,
  editGroupMessage,
  deleteGroupMessage,
  pinGroupMessage,
  leaveGroup,
  deleteGroup,
  forwardMessageToGroup,
} from "@/lib/firestore/groups";
import { forwardMessageToChat } from "@/lib/firestore/chats";
import { forwardMessageToChannel } from "@/lib/firestore/channels";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import {
  X,
  CornerUpLeft,
  Forward,
  MoreVertical,
  Trash2,
  ImageIcon,
  ImagePlus,
  ImageOff,
  Download,
  Pencil,
  Pin,
  PinOff,
  Copy,
  ChevronDown,
  Users,
  LogOut,
} from "lucide-react";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";
import GroupModal from "./groupModal";
import ForwardPicker from "@/components/molecules/forward-picker/ForwardPicker";
import SmoothImage from "@/components/UI/SmoothImage";
import GroupComposer, { GroupComposerHandle } from "./GroupComposer";
import GroupMessageRow from "./GroupMessageRow";
import {
  ConfirmDialog,
  dayKey,
  formatDayLabel,
  isVideo,
  toDate,
  uploadImage,
} from "./GroupShared";
import { disintegrate } from "@/lib/disintegrate";
import "./GroupWindow.css";

const NEAR_BOTTOM_THRESHOLD = 120;
const GROUP_GAP_MS = 5 * 60 * 1000;
const EMPTY_MESSAGES: any[] = [];

interface MsgMenuState {
  id: string;
  x: number;
  y: number;
  openUpward: boolean;
  isMine: boolean;
}

type Row =
  | { type: "date"; key: string; label: string }
  | {
    type: "msg";
    m: any;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    priority: boolean;
  };

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function GroupWindow() {
  const groupId = useGroupStore((s) => s.activeGroupId);
  const setActiveGroup = useGroupStore((s) => s.setActiveGroup);
  const groups = useGroupStore((s) => s.groups);
  const group = groups.find((g) => g.id === groupId) || null;
  const isWindowVisible = useWindowVisibilityStore((s) => s.isVisible);

  const [messages, setMessages] = useState<any[]>([]);
  const [messagesGroupId, setMessagesGroupId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingNames, setTypingNames] = useState<Record<string, string>>({});
  const [replyMessage, setReplyMessage] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msgMenu, setMsgMenu] = useState<MsgMenuState | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [wallpaper, setWallpaper] = useState<any>(null);
  const [forwardData, setForwardData] = useState<any | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());

  const composerRef = useRef<GroupComposerHandle | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const isNearBottom = useRef(true);
  const activeGroupIdRef = useRef<string | null>(groupId);
  const myUidRef = useRef<string | null>(null);
  const confirmedMessageIdsRef = useRef<Set<string>>(new Set());
  const receivedSnapshotRef = useRef(false);
  const scrollIntentRef = useRef<"initial" | "follow" | "force" | null>(null);
  const dragCounter = useRef(0);
  const isLoadingOlderRef = useRef(false);
  const olderMessageIdsRef = useRef<Set<string>>(new Set());
  const readReceiptIdsRef = useRef<Set<string>>(new Set());
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  const visibleRef = useRef(isWindowVisible);
  const unreadRef = useRef(0);
  const loadOlderRef = useRef<() => void>(() => { });

  useLayoutEffect(() => {
    activeGroupIdRef.current = groupId;
  }, [groupId]);

  useLayoutEffect(() => {
    myUidRef.current = myUid;
  }, [myUid]);

  useLayoutEffect(() => {
    visibleRef.current = isWindowVisible;
  }, [isWindowVisible]);

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

  useLayoutEffect(() => {
    setPendingMessages((previous) => {
      previous.forEach((message) => {
        if (
          typeof message.imageUrl === "string" &&
          message.imageUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(message.imageUrl);
        }
      });
      return [];
    });
    setShowScrollButton(false);
    setTypingUsers([]);
    setReplyMessage(null);
    setEditingId(null);
    setPickerOpenId(null);
    setMsgMenu(null);
    setFreshIds(new Set());
    isNearBottom.current = true;
    confirmedMessageIdsRef.current = new Set();
    receivedSnapshotRef.current = false;
    scrollIntentRef.current = null;
    olderMessageIdsRef.current = new Set();
    readReceiptIdsRef.current = new Set();
    preserveScrollRef.current = null;
    isLoadingOlderRef.current = false;
    unreadRef.current = 0;
    setHasMoreMessages(false);
    setIsLoadingOlder(false);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeToGroupMessages(groupId, (msgs, hasMore) => {
      if (activeGroupIdRef.current !== groupId) return;

      const prevIds = confirmedMessageIdsRef.current;
      const nextIds = new Set<string>(msgs.map((m) => m.id));
      const hasNewConfirmedMessage = [...nextIds].some((id) => !prevIds.has(id));
      const isInitialSnapshot = !receivedSnapshotRef.current;
      confirmedMessageIdsRef.current = nextIds;
      receivedSnapshotRef.current = true;

      if (isInitialSnapshot) {
        scrollIntentRef.current = "initial";
      } else {
        if (hasNewConfirmedMessage && isNearBottom.current) {
          scrollIntentRef.current = "follow";
        }
        const added = msgs
          .filter((m) => !prevIds.has(m.id) && m.senderId !== myUidRef.current)
          .map((m) => m.id);
        if (added.length) {
          setFreshIds((prev) => new Set([...prev, ...added]));
        }
      }

      setHasMoreMessages(hasMore);
      setMessages((previous) => [
        ...previous.filter(
          (message) =>
            olderMessageIdsRef.current.has(message.id) && !nextIds.has(message.id)
        ),
        ...msgs,
      ]);
      setMessagesGroupId(groupId);

      setPendingMessages((previous) => {
        if (!previous.length) return previous;
        const consumed = new Set<number>();
        const next = previous.filter((pending) => {
          const isBlob =
            typeof pending.imageUrl === "string" &&
            pending.imageUrl.startsWith("blob:");
          const matchIndex = msgs.findIndex(
            (message, index) =>
              !consumed.has(index) &&
              message.senderId === pending.senderId &&
              (message.text || "") === (pending.text || "") &&
              (isBlob
                ? Boolean(message.imageUrl)
                : (message.imageUrl || null) === (pending.imageUrl || null))
          );
          if (matchIndex === -1) return true;
          consumed.add(matchIndex);
          if (isBlob) URL.revokeObjectURL(pending.imageUrl);
          return false;
        });
        return next.length === previous.length ? previous : next;
      });
    });
    return () => unsub();
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !myUid || !isWindowVisible || messagesGroupId !== groupId)
      return;
    messages.forEach((m) => {
      if (
        m.senderId !== myUid &&
        !(m.readBy || []).includes(myUid) &&
        !readReceiptIdsRef.current.has(m.id)
      ) {
        readReceiptIdsRef.current.add(m.id);
        markGroupMessageRead(groupId, m.id, myUid).catch(() => {
          readReceiptIdsRef.current.delete(m.id);
        });
      }
    });
  }, [messages, messagesGroupId, groupId, myUid, isWindowVisible]);

  useEffect(() => {
    if (!groupId || !myUid) return;
    const unsub = onSnapshot(doc(db, "groups", groupId), (snap) => {
      if (activeGroupIdRef.current !== groupId) return;
      const data = snap.data();

      const pin = data?.pinnedMessage || null;
      setPinnedMessage((prev) =>
        prev?.id === pin?.id && prev?.text === pin?.text ? prev : pin
      );

      const wp = data?.wallpaper || null;
      setWallpaper((prev: any) =>
        (prev?.url ?? null) === (wp?.url ?? null) ? prev : wp
      );

      const typingList = data?.typing
        ? Object.entries(data.typing)
          .filter(([uid, val]) => val && uid !== myUid)
          .map(([uid]) => uid)
        : [];
      setTypingUsers((prev) => (sameList(prev, typingList) ? prev : typingList));

      const unread = data?.unreadCounts?.[myUid] || 0;
      unreadRef.current = unread;
      if (unread > 0 && visibleRef.current) {
        unreadRef.current = 0;
        markGroupAsRead(groupId, myUid).catch(() => { });
      }
    });
    return () => unsub();
  }, [groupId, myUid]);

  useEffect(() => {
    if (!isWindowVisible || !groupId || !myUid || unreadRef.current <= 0) return;
    unreadRef.current = 0;
    markGroupAsRead(groupId, myUid).catch(() => { });
  }, [isWindowVisible, groupId, myUid]);

  useEffect(() => {
    if (!groupId || !myUid) return;
    markGroupAsRead(groupId, myUid).catch(() => { });
  }, [groupId, myUid]);

  useEffect(() => {
    if (typingUsers.length === 0) return;
    const missing = typingUsers.filter((uid) => !typingNames[uid]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          return [
            uid,
            snap.exists() ? snap.data()?.username || "User" : "User",
          ] as const;
        } catch {
          return [uid, "User"] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setTypingNames((prev) => {
        const next = { ...prev };
        entries.forEach(([uid, name]) => {
          next[uid] = name;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [typingUsers, typingNames]);

  function handleScroll() {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isNearBottom.current = nearBottom;
    setShowScrollButton((prev) => (prev === !nearBottom ? prev : !nearBottom));
  }

  async function loadOlder() {
    if (!groupId || isLoadingOlderRef.current || !hasMoreMessages) return;
    const oldest = messages[0];
    if (!oldest) return;

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);
    const el = chatScrollRef.current;
    preserveScrollRef.current = el
      ? { height: el.scrollHeight, top: el.scrollTop }
      : null;

    try {
      const { messages: older, hasMore } = await loadOlderGroupMessages(
        groupId,
        oldest
      );
      if (activeGroupIdRef.current !== groupId) return;
      setHasMoreMessages(hasMore);
      if (older.length) {
        setMessages((previous) => {
          const existingIds = new Set(previous.map((message) => message.id));
          const deduped = older.filter((message) => !existingIds.has(message.id));
          deduped.forEach((message) => olderMessageIdsRef.current.add(message.id));
          return [...deduped, ...previous];
        });
      } else {
        preserveScrollRef.current = null;
      }
    } finally {
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }

  useLayoutEffect(() => {
    loadOlderRef.current = loadOlder;
  });

  useEffect(() => {
    const root = chatScrollRef.current;
    const target = topSentinelRef.current;
    if (!root || !target || !hasMoreMessages) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlderRef.current();
      },
      { root, rootMargin: "200px 0px 0px 0px" }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [groupId, hasMoreMessages, messages.length]);

  useLayoutEffect(() => {
    const el = chatScrollRef.current;
    const preserved = preserveScrollRef.current;
    if (!el || !preserved) return;
    el.scrollTop = el.scrollHeight - preserved.height + preserved.top;
    preserveScrollRef.current = null;
  }, [messages]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
  }, []);

  const handleMediaLoad = useCallback(() => {
    if (isNearBottom.current) scrollToBottom();
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    if (!groupId) return;
    const intent = scrollIntentRef.current;
    if (!intent) return;
    if (intent === "initial" || intent === "force" || isNearBottom.current) {
      scrollToBottom();
      isNearBottom.current = true;
      setShowScrollButton(false);
    }
    scrollIntentRef.current = null;
  }, [groupId, messages, pendingMessages, scrollToBottom]);

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
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

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
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      composerRef.current?.acceptFile(file);
    }
  }

  const handleReply = useCallback((m: any) => {
    setReplyMessage(m);
    composerRef.current?.focus();
  }, []);

  const handleReact = useCallback(
    async (messageId: string, token: string) => {
      if (!groupId || !myUid) return;
      setPickerOpenId(null);
      try {
        await toggleGroupReaction(groupId, messageId, token, myUid);
      } catch (err) {
        console.error("Reaction failed:", err);
      }
    },
    [groupId, myUid]
  );

  const openPicker = useCallback((e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    setPickerOpenId((prev) => (prev === msgId ? null : msgId));
    setPickerExpanded(false);
    setMsgMenu(null);
  }, []);

  const expandPicker = useCallback(() => setPickerExpanded(true), []);

  const openMsgMenu = useCallback(
    (e: React.MouseEvent, msgId: string, isMine: boolean) => {
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
    },
    []
  );

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`gmsg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-flash");
    setTimeout(() => el.classList.remove("highlight-flash"), 1500);
  }, []);

  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const cancelEdit = useCallback(() => setEditingId(null), []);

  const submitEdit = useCallback(
    async (id: string, text: string) => {
      if (!groupId) return;
      try {
        await editGroupMessage(groupId, id, text);
        setEditingId(null);
      } catch (err) {
        console.error("Edit failed:", err);
      }
    },
    [groupId]
  );

  function startEdit(m: any) {
    setEditingId(m.id);
    setMsgMenu(null);
  }

  function handleDelete(msgId: string) {
    setMsgMenu(null);
    setDeleteConfirmId(msgId);
  }

  async function confirmDelete() {
    if (!groupId || !deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    const el = document.querySelector<HTMLElement>(`[data-msg-anim="${id}"]`);
    try {
      if (el) await disintegrate(el);
      await deleteGroupMessage(groupId, id);
    } catch (err) {
      console.error("Delete failed:", err);
      if (el) el.style.visibility = "";
    }
  }

  async function handlePin(m: any) {
    if (!groupId) return;
    setMsgMenu(null);
    const isAlreadyPinned = pinnedMessage?.id === m.id;
    try {
      await pinGroupMessage(
        groupId,
        isAlreadyPinned ? null : m.id,
        isAlreadyPinned
          ? null
          : m.text || (m.voiceUrl ? "🎤 Voice message" : "📷 Photo")
      );
    } catch (err) {
      console.error("Pin failed:", err);
    }
  }

  async function handleCopy(m: any) {
    if (!m.text) return;
    try {
      await navigator.clipboard.writeText(m.text);
    } catch (err) {
      console.error("Copy failed:", err);
      return;
    }
    setCopiedId(m.id);
    setMsgMenu(null);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function confirmLeaveOrDelete() {
    if (!groupId || !myUid || !group) return;
    try {
      if (group.ownerId === myUid) await deleteGroup(groupId);
      else await leaveGroup(groupId, myUid);
      setActiveGroup(null);
    } catch (err) {
      console.error("Leave or delete group failed:", err);
    }
    setLeaveConfirm(false);
  }

  async function handleWallpaperChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !groupId) return;
    try {
      const url = await uploadImage(file, "chat_wallpapers");
      await updateDoc(doc(db, "groups", groupId), {
        wallpaper: { url, type: "image" },
      });
    } catch (err) {
      console.error("Wallpaper change failed:", err);
    }
  }

  async function removeWallpaper() {
    if (!groupId) return;
    try {
      await updateDoc(doc(db, "groups", groupId), { wallpaper: null });
    } catch (err) {
      console.error("Wallpaper remove failed:", err);
    }
  }

  function forwardPayload(message: any) {
    return {
      text: message.text || "",
      imageUrl: message.imageUrl || null,
      imageWidth: message.imageWidth ?? null,
      imageHeight: message.imageHeight ?? null,
      voiceUrl: message.voiceUrl || null,
      duration: message.duration,
      waveform: message.waveform,
      senderId: message.senderId,
      senderName:
        message.senderName || (message.senderId === myUid ? "You" : "user"),
      groupId: groupId!,
      sourceName: group?.name || "Group",
      messageId: message.id,
      forwardedFrom: message.forwardedFrom || null,
    };
  }

  const rows = useMemo<Row[]>(() => {
    const confirmed = messagesGroupId === groupId ? messages : EMPTY_MESSAGES;
    const consumed = new Set<number>();
    const visiblePending = pendingMessages.filter((p) => {
      const idx = confirmed.findIndex(
        (m, i) =>
          !consumed.has(i) &&
          m.senderId === p.senderId &&
          (m.text || "") === (p.text || "") &&
          (m.imageUrl || null) === (p.imageUrl || null)
      );
      if (idx === -1) return true;
      consumed.add(idx);
      return false;
    });
    const all = [...confirmed, ...visiblePending].filter((m) => !m.deleted);

    const joins = (a: any, b: any) => {
      if (!a || !b) return false;
      if (a.senderId !== b.senderId) return false;
      const da = toDate(a.createdAt);
      const db_ = toDate(b.createdAt);
      return (
        dayKey(da) === dayKey(db_) &&
        Math.abs(db_.getTime() - da.getTime()) < GROUP_GAP_MS
      );
    };

    const out: Row[] = [];
    let prevDay = "";
    all.forEach((m, i) => {
      const d = toDate(m.createdAt);
      const dk = dayKey(d);
      if (dk !== prevDay) {
        out.push({ type: "date", key: `date-${dk}`, label: formatDayLabel(d) });
        prevDay = dk;
      }
      out.push({
        type: "msg",
        m,
        isFirstInGroup: !joins(all[i - 1], m),
        isLastInGroup: !joins(m, all[i + 1]),
        priority: i >= all.length - 8,
      });
    });
    return out;
  }, [messages, messagesGroupId, groupId, pendingMessages]);

  if (!groupId || !group) {
    return (
      <div
        className="flex w-full justify-center items-center h-full gap-3 text-zinc-500"
        style={{ background: "var(--color-chat-bg)" }}
      >
        <span className="text-sm font-bold">Select a group in the Nexo</span>
      </div>
    );
  }

  const currentMsgMenu = msgMenu
    ? messages.find((m) => m.id === msgMenu.id)
    : null;
  const isOwner = group.ownerId === myUid;

  const typingLabel =
    typingUsers.length === 1
      ? `${typingNames[typingUsers[0]] || "Someone"} is typing`
      : typingUsers.length === 2
        ? `${typingUsers.map((uid) => typingNames[uid] || "Someone").join(", ")} are typing`
        : `${typingUsers.length} people are typing`;

  return (
    <>
      {msgMenu && currentMsgMenu && !currentMsgMenu.deleted && (
        <div
          className="msg-ctx-menu fixed z-[100] min-w-[168px] rounded-2xl bg-[#0d0b17]/95 border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
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
          {msgMenu.isMine && currentMsgMenu.text && !currentMsgMenu.imageUrl && (
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
          <button
            className="ctx-item text-zinc-300"
            onClick={() => {
              setForwardData(currentMsgMenu);
              setMsgMenu(null);
            }}
          >
            <Forward size={14} className="text-zinc-500" />
            Forward
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={lightboxUrl}
              download
              target="_blank"
              rel="noreferrer"
              aria-label="Download"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => setLightboxUrl(null)}
              aria-label="Close"
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
          background: wallpaper?.url
            ? `url(${wallpaper.url}) center/cover no-repeat`
            : "var(--color-chat-bg)",
          color: "var(--color-text)",
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {wallpaper?.url ? (
          <div className="absolute inset-0 z-0 pointer-events-none bg-black/40" />
        ) : (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-[#5b3df0]/10 blur-[120px]" />
            <div className="absolute -bottom-40 -right-16 w-[380px] h-[380px] rounded-full bg-[#2b1f78]/12 blur-[120px]" />
          </div>
        )}

        {isDraggingFile && (
          <div className="absolute inset-2 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#7c5cff] bg-[#0d0b17]/85 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-[#a893ff]">
              <ImageIcon size={32} />
              <span className="text-sm font-semibold">
                Drop image or video to send
              </span>
            </div>
          </div>
        )}

        <div className="flex-none flex flex-col border-b border-white/[0.06] bg-[#0d0b17]/90 relative z-20">
          <div className="h-14 flex items-center justify-between px-5">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setShowGroupInfo(true)}
            >
              <div className="w-8 h-8 rounded-full bg-[#1e2a3a] flex items-center justify-center shrink-0 overflow-hidden">
                {group.avatarUrl ? (
                  <SmoothImage
                    src={group.avatarUrl}
                    alt={group.name || "group"}
                    width={32}
                    height={32}
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
                <span className="text-[11px] leading-tight">
                  {typingUsers.length > 0 ? (
                    <span className="flex items-center gap-1 text-[#a893ff]">
                      {typingLabel}
                      <span className="typing-dots">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">
                      {group.memberCount} member
                      {group.memberCount === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Group menu"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="msg-ctx-menu absolute right-0 top-10 w-48 rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                  <button
                    className="ctx-item text-zinc-300"
                    onClick={() => {
                      wallpaperInputRef.current?.click();
                      setMenuOpen(false);
                    }}
                  >
                    <ImagePlus size={14} className="text-zinc-500" />
                    Change wallpaper
                  </button>
                  {wallpaper?.url && (
                    <button
                      className="ctx-item text-zinc-300"
                      onClick={() => {
                        removeWallpaper();
                        setMenuOpen(false);
                      }}
                    >
                      <ImageOff size={14} className="text-zinc-500" />
                      Remove wallpaper
                    </button>
                  )}
                  <div className="ctx-divider" />
                  <button
                    className="ctx-item text-red-400"
                    onClick={() => {
                      setLeaveConfirm(true);
                      setMenuOpen(false);
                    }}
                  >
                    {isOwner ? (
                      <Trash2 size={14} className="text-red-400/60" />
                    ) : (
                      <LogOut size={14} className="text-red-400/60" />
                    )}
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
                <div className="text-[11px] font-medium text-[#a893ff] leading-none mb-0.5">
                  Pinned message
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {pinnedMessage.text}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinGroupMessage(groupId, null, null);
                }}
                aria-label="Unpin message"
                className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={chatScrollRef}
          onScroll={handleScroll}
          className="chat-scroll relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 min-h-0"
        >
          <div ref={topSentinelRef} className="h-px" aria-hidden />
          {isLoadingOlder && (
            <div className="py-2 text-center text-xs text-zinc-500">
              Loading older messages…
            </div>
          )}

          {rows.map((row) => {
            if (row.type === "date") {
              return (
                <div key={row.key} className="flex justify-center pt-3 pb-1">
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#b9a8ff] bg-[#12111f]/80 border border-[#7c5cff]/20 shadow-sm shadow-black/30">
                    {row.label}
                  </span>
                </div>
              );
            }
            const { m } = row;
            const isMine = m.senderId === myUid;
            const isPickerOpen = pickerOpenId === m.id;
            return (
              <GroupMessageRow
                key={m.id}
                m={m}
                myUid={myUid}
                isMine={isMine}
                isRead={(m.readBy || []).some((uid: string) => uid !== m.senderId)}
                isFirstInGroup={row.isFirstInGroup}
                isLastInGroup={row.isLastInGroup}
                isPickerOpen={isPickerOpen}
                pickerExpanded={isPickerOpen && pickerExpanded}
                isPinned={pinnedMessage?.id === m.id}
                isEditing={editingId === m.id}
                animate={!!m.pending || freshIds.has(m.id)}
                priority={row.priority}
                onReply={handleReply}
                onOpenPicker={openPicker}
                onExpandPicker={expandPicker}
                onOpenMenu={openMsgMenu}
                onReact={handleReact}
                onScrollToMessage={scrollToMessage}
                onOpenLightbox={openLightbox}
                onMediaLoad={handleMediaLoad}
                onSubmitEdit={submitEdit}
                onCancelEdit={cancelEdit}
              />
            );
          })}

          {showScrollButton && (
            <button
              onClick={() => {
                scrollToBottom(true);
                isNearBottom.current = true;
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

        {showGroupInfo && (
          <GroupModal
            groupId={groupId}
            myUid={myUid}
            onClose={() => setShowGroupInfo(false)}
          />
        )}

        <input
          ref={wallpaperInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleWallpaperChange}
        />

        <GroupComposer
          key={groupId}
          ref={composerRef}
          groupId={groupId}
          myUid={myUid}
          myUsername={myUsername}
          groupMembers={group.members}
          replyMessage={replyMessage}
          onClearReply={() => setReplyMessage(null)}
          setPendingMessages={setPendingMessages}
          isNearBottomRef={isNearBottom}
          scrollIntentRef={scrollIntentRef}
        />
      </div>

      {forwardData && myUid && (
        <ForwardPicker
          myUid={myUid}
          onClose={() => setForwardData(null)}
          onSelectChat={async (targetChatId) => {
            await forwardMessageToChat(
              targetChatId,
              myUid,
              forwardPayload(forwardData)
            );
            setForwardData(null);
          }}
          onSelectGroup={async (targetGroupId) => {
            await forwardMessageToGroup(
              targetGroupId,
              myUid,
              forwardPayload(forwardData)
            );
            setForwardData(null);
          }}
          onSelectChannel={async (channelId) => {
            await forwardMessageToChannel(
              channelId,
              myUid,
              forwardPayload(forwardData)
            );
            setForwardData(null);
          }}
        />
      )}
    </>
  );
}