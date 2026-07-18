"use client";

import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import { useChannelStore } from "@/store/channel-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  subscribeToUserChats,
  searchUsers,
  createOrGetChat,
  togglePinChat,
} from "@/lib/firestore/chats";
import {
  subscribeToMyChannels,
  togglePinChannel,
  unsubscribeFromChannel,
  deleteChannel,
} from "@/lib/firestore/channels";
import { setConversationOrder } from "@/lib/firestore/order";
import {
  buildConversationItems,
  sortConversationItems,
  ConversationItem,
} from "@/lib/mergeConversations";
import { Channel } from "@/types/channel";
import ChatItem from "./ChatItem";
import ChannelItem from "../channel/ChannelItem";
import CreateChannelModal from "../channel/CreateChannelModal";
import ChannelSearchModal from "../channel/ChannelSearchModal";
import ProfileModal from "../profile-modal/ProfileModal";
import {
  Settings,
  Search,
  UserCircle,
  Pin,
  Trash2,
  CheckCheck,
  Megaphone,
  Plus,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";
import { useWindowVisibilityStore } from "@/store/window-visibility-store";

interface CtxMenu {
  type: "chat" | "channel";
  id: string;
  x: number;
  y: number;
  pinned: boolean;
  isOwner?: boolean;
}

interface DeleteConfirm {
  type: "chat" | "channel";
  id: string;
  isOwner?: boolean;
}

// exact tones lifted from the reference screenshot
const SEARCH_BG = "#1E1830";
const SEARCH_BTN_BG = "#13101f";

export default function SideBar() {
  const chats = useChatStore((s) => s.chats);
  const setChats = useChatStore((s) => s.setChats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
  const { firebaseUser } = useCurrentUser();
  const { mode, customTheme } = useThemeStore();

  const theme =
    mode === "dark"
      ? DEFAULT_DARK
      : mode === "light"
      ? DEFAULT_LIGHT
      : customTheme;

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
  const [pinnedChannels, setPinnedChannels] = useState<Record<string, boolean>>(
    {}
  );
  const [order, setOrder] = useState<Record<string, number>>({});
  const [myUsername, setMyUsername] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(
    null
  );
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [searchChannelOpen, setSearchChannelOpen] = useState(false);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const ctxRef = useRef<HTMLDivElement | null>(null);
  const channelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window.electronAPI?.onWindowVisibilityChange === "function") {
      window.electronAPI.onWindowVisibilityChange((visible) => {
        useWindowVisibilityStore.getState().setVisible(visible);
      });
    } else {
      console.warn("electronAPI.onWindowVisibilityChange missing", {
        hasElectronAPI: !!window.electronAPI,
        keys: window.electronAPI ? Object.keys(window.electronAPI) : null,
      });
    }
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToUserChats(
      firebaseUser.uid,
      setChats,
      (payload) => {
        const { activeChatId } = useChatStore.getState();

        const isThisChatOpen = activeChatId === payload.chatId;

        const isWindowVisible = useWindowVisibilityStore.getState().isVisible;

        if (isThisChatOpen && isWindowVisible) {
          return;
        }

        window.electronAPI?.notifyNewMessage({
          title: payload.senderName,
          body: payload.text,
          chatId: payload.chatId,
        });
      }
    );
    return unsub;
  }, [firebaseUser, setChats]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToMyChannels(firebaseUser.uid, setMyChannels);
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      const data = snap.data();
      setPinnedChats(data?.pinnedChats || {});
      setPinnedChannels(data?.pinnedChannels || {});
      setOrder(data?.order || {});
      setMyUsername(data?.username || "");
    });
    return () => unsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(query.trim());
        setUsers(res.filter((u) => u.id !== firebaseUser?.uid));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, firebaseUser]);

  useEffect(() => {
    if (!ctxMenu) return;
    function handleClick() {
      setCtxMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [ctxMenu]);

  useEffect(() => {
    if (!deleteConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirm(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteConfirm]);

  useEffect(() => {
    if (!channelMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        channelMenuRef.current &&
        !channelMenuRef.current.contains(e.target as Node)
      )
        setChannelMenuOpen(false);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [channelMenuOpen]);

  useEffect(() => {
    window.electronAPI?.onOpenChat((chatId: string) => {
      setActiveChat(chatId);
    });
  }, [setActiveChat]);

  async function openChat(otherUid: string) {
    if (!firebaseUser) return;
    const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
    setActiveChat(chatId);
    setQuery("");
    setUsers([]);
  }

  function handleCtxMenu(
    e: React.MouseEvent,
    type: "chat" | "channel",
    id: string,
    pinned: boolean,
    isOwner?: boolean
  ) {
    e.preventDefault();
    setCtxMenu({ type, id, x: e.clientX, y: e.clientY, pinned, isOwner });
  }

  async function handlePin() {
    if (!ctxMenu || !firebaseUser) return;
    if (ctxMenu.type === "chat") {
      await togglePinChat(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
    } else {
      await togglePinChannel(firebaseUser.uid, ctxMenu.id, !ctxMenu.pinned);
    }
    setCtxMenu(null);
  }

  async function handleMarkRead(chatId: string) {
    if (!firebaseUser) return;
    await updateDoc(doc(db, "chats", chatId), {
      [`unreadCount.${firebaseUser.uid}`]: 0,
    });
    setCtxMenu(null);
  }

  async function confirmDelete() {
    if (!deleteConfirm || !firebaseUser) return;

    if (deleteConfirm.type === "chat") {
      await updateDoc(doc(db, "chats", deleteConfirm.id), {
        [`deleted.${firebaseUser.uid}`]: true,
      });
      useChatStore.getState().setActiveChat(null);
    } else {
      if (deleteConfirm.isOwner) {
        await deleteChannel(deleteConfirm.id);
      } else {
        await unsubscribeFromChannel(deleteConfirm.id, firebaseUser.uid);
      }
      if (activeChannelId === deleteConfirm.id) setActiveChannel(null);
    }

    setDeleteConfirm(null);
  }

  function openChannel(channelId: string) {
    setActiveChannel(channelId);
  }

  async function handleDrop(bucketIds: string[]) {
    if (
      !draggedId ||
      !dragOverId ||
      !firebaseUser ||
      draggedId === dragOverId
    ) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = [...bucketIds];
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(dragOverId);
    setDraggedId(null);
    setDragOverId(null);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    await setConversationOrder(firebaseUser.uid, ids);
  }

  const visibleChats = chats.filter((c) => !c.deleted);
  const allItems = buildConversationItems(visibleChats, myChannels);

  const pinnedItemsRaw = allItems.filter((it) =>
    it.type === "chat" ? pinnedChats[it.id] : pinnedChannels[it.id]
  );
  const unpinnedItemsRaw = allItems.filter((it) =>
    it.type === "chat" ? !pinnedChats[it.id] : !pinnedChannels[it.id]
  );

  const pinnedList = sortConversationItems(pinnedItemsRaw, order);
  const mergedList = sortConversationItems(unpinnedItemsRaw, order);

  const accent = "#522fb7";
  const border = mode === "light" ? "#d1d5db" : "#1F2A37";
  const hoverBg = mode === "light" ? "#e5e7eb" : "rgba(255,255,255,0.04)";
  const subText = mode === "light" ? "#6b7280" : "#a1a1aa";
  const menuText = mode === "light" ? "#374151" : "#d4d4d8";
  const menuDivider = mode === "light" ? "#e5e7eb" : "rgba(255,255,255,0.06)";

  function renderItem(
    item: ConversationItem,
    pinned: boolean,
    bucket: ConversationItem[]
  ) {
    const isChannelOwner =
      item.type === "channel" &&
      (item.data as Channel).ownerId === firebaseUser?.uid;

    return (
      <div
        key={item.id}
        draggable
        onDragStart={() => setDraggedId(item.id)}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragOverId !== item.id) setDragOverId(item.id);
        }}
        onDrop={() => handleDrop(bucket.map((i) => i.id))}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverId(null);
        }}
        onContextMenu={(e) =>
          item.type === "chat"
            ? handleCtxMenu(e, "chat", item.id, pinned)
            : handleCtxMenu(e, "channel", item.id, pinned, isChannelOwner)
        }
        className="relative"
        style={{
          opacity: draggedId === item.id ? 0.4 : 1,
          boxShadow:
            dragOverId === item.id && draggedId !== item.id
              ? "inset 0 2px 0 0 #A78BFA"
              : undefined,
        }}
      >
        {item.type === "chat" ? (
          <ChatItem chat={item.data} pinned={pinned} />
        ) : (
          <ChannelItem
            channel={item.data as Channel}
            active={activeChannelId === item.id}
            pinned={pinned}
            onClick={() => openChannel(item.id)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.25); border-radius: 999px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.5); }
      `}</style>

      <section
        className="h-full w-80 flex flex-col border-r transition-colors duration-200 relative"
        style={{
          background: theme.sideBarBg,
          borderColor: border,
          color: theme.text,
        }}
      >
        {/* search */}
        <div className="p-4 pb-3 border-b border-[#241D57]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#8B85A0" }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl outline-none border border-transparent focus:border-[#241D57] transition-all text-sm"
                style={{ background: SEARCH_BG, color: "#F3F1FA" }}
              />
            </div>
            <div className="relative shrink-0" ref={channelMenuRef}>
              <button
                onClick={() => setChannelMenuOpen((v) => !v)}
                title="Channels"
                className="w-10 h-10 flex items-center justify-center rounded-2xl transition-colors cursor-pointer"
                style={{ background: SEARCH_BTN_BG, color: accent }}
              >
                <Megaphone size={16} />
              </button>
              {channelMenuOpen && (
                <div
                  className="absolute right-0 top-12 w-48 rounded-xl border shadow-xl shadow-black/40 overflow-hidden z-50"
                  style={{
                    background: mode === "light" ? "#ffffff" : "#0d0b14",
                    borderColor: border,
                  }}
                >
                  <button
                    onClick={() => {
                      setCreateChannelOpen(true);
                      setChannelMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: menuText }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Plus size={14} />
                    Create a channel
                  </button>
                  <button
                    onClick={() => {
                      setSearchChannelOpen(true);
                      setChannelMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: menuText }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Search size={14} />
                    Find a channel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {query && (
          <div
            className="border-b transition-colors duration-200"
            style={{ borderColor: border }}
          >
            {loading && (
              <p className="text-xs px-4 py-2" style={{ color: subText }}>
                Searching...
              </p>
            )}
            {!loading &&
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openChat(u.id)}
                  className="w-full flex items-center gap-3 p-3 transition-colors text-left"
                  style={{ color: theme.text }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = hoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.username}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black font-semibold"
                      style={{ background: accent }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm">{u.username}</span>
                </button>
              ))}
            {!loading && users.length === 0 && (
              <p className="text-xs px-4 py-2" style={{ color: subText }}>
                No users found
              </p>
            )}
          </div>
        )}

        <div className="sidebar-scroll flex-1 overflow-y-auto mt-4">
          {pinnedList.length === 0 && mergedList.length === 0 && (
            <p className="text-sm p-4" style={{ color: subText }}>
              No chats yet. Search users above.
            </p>
          )}
          <div>
            {pinnedList.map((item) => renderItem(item, true, pinnedList))}
            {mergedList.map((item) => renderItem(item, false, mergedList))}
          </div>
        </div>

        {/* footer */}
        <div className="pt-2 pb-2 space-y-2">
          <Link
            href="/settings"
            className="group flex h-12 items-center gap-3 rounded-2xl border border-white/[0.05]
               bg-white/[0.015] px-4 transition-all duration-200"
            style={{ color: theme.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverBg;
              e.currentTarget.style.borderColor = accent + "40";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.015)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: `${accent}18`,
              }}
            >
              <Settings size={17} style={{ color: accent }} />
            </div>

            <span className="text-[14px] font-medium">Settings</span>
          </Link>

          <button
            onClick={() => setShowProfile(true)}
            className="group flex h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 text-left transition-all duration-200"
            style={{ color: theme.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverBg;
              e.currentTarget.style.borderColor = accent + "40";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.015)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: `${accent}18`,
              }}
            >
              <UserCircle size={17} style={{ color: accent }} />
            </div>

            <span className="text-[14px] font-medium">Your profile</span>
          </button>
        </div>
      </section>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {createChannelOpen && firebaseUser && (
        <CreateChannelModal
          uid={firebaseUser.uid}
          username={myUsername}
          onClose={() => setCreateChannelOpen(false)}
          onCreated={(channelId) => setActiveChannel(channelId)}
        />
      )}

      {searchChannelOpen && firebaseUser && (
        <ChannelSearchModal
          uid={firebaseUser.uid}
          myChannelIds={new Set(myChannels.map((c) => c.id))}
          onClose={() => setSearchChannelOpen(false)}
          onOpenChannel={(channelId) => {
            setActiveChannel(channelId);
            setSearchChannelOpen(false);
          }}
        />
      )}

      {/* context menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 999,
            background: mode === "light" ? "#ffffff" : "#151D28",
          }}
          className="min-w-[168px] rounded-xl border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handlePin}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
            style={{ color: menuText }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Pin
              size={13}
              style={{ color: ctxMenu.pinned ? accent : "inherit" }}
            />
            {ctxMenu.pinned
              ? ctxMenu.type === "chat"
                ? "Unpin chat"
                : "Unpin channel"
              : ctxMenu.type === "chat"
              ? "Pin chat"
              : "Pin channel"}
          </button>

          {ctxMenu.type === "chat" && (
            <button
              onClick={() => handleMarkRead(ctxMenu.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer"
              style={{ color: menuText }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <CheckCheck size={13} />
              Mark as read
            </button>
          )}

          <div
            style={{ height: 1, background: menuDivider, margin: "2px 0" }}
          />

          <button
            onClick={() => {
              setDeleteConfirm({
                type: ctxMenu.type,
                id: ctxMenu.id,
                isOwner: ctxMenu.isOwner,
              });
              setCtxMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer text-red-400"
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {ctxMenu.type === "chat" ? (
              <>
                <Trash2 size={13} className="text-red-400/70" />
                Delete chat
              </>
            ) : ctxMenu.isOwner ? (
              <>
                <Trash2 size={13} className="text-red-400/70" />
                Delete channel
              </>
            ) : (
              <>
                <LogOut size={13} className="text-red-400/70" />
                Leave channel
              </>
            )}
          </button>
        </div>
      )}

      {/* delete/leave confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-80 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                {deleteConfirm.type === "channel" && !deleteConfirm.isOwner ? (
                  <LogOut size={18} className="text-red-400" />
                ) : (
                  <Trash2 size={18} className="text-red-400" />
                )}
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-1">
                {deleteConfirm.type === "chat"
                  ? "Delete chat?"
                  : deleteConfirm.isOwner
                  ? "Delete channel?"
                  : "Leave channel?"}
              </h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                {deleteConfirm.type === "chat"
                  ? "This will permanently delete the entire conversation. This action cannot be undone."
                  : deleteConfirm.isOwner
                  ? "This will permanently delete the channel for all subscribers. This action cannot be undone."
                  : "You will stop receiving posts from this channel. You can subscribe again anytime."}
              </p>
            </div>
            <div className="flex border-t border-white/[0.06]">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
              >
                {deleteConfirm.type === "channel" && !deleteConfirm.isOwner
                  ? "Leave"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
