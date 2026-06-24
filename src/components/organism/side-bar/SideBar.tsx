"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useChatStore } from "@/store/chat-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  subscribeToUserChats,
  searchUsers,
  createOrGetChat,
  togglePinChat,
} from "@/lib/firestore/chats";
import ChatItem from "./ChatItem";
import ProfileModal from "../profile-modal/ProfileModal";
import { Settings, Search, UserCircle, Pin } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface CtxMenu {
  chatId: string;
  x: number;
  y: number;
  pinned: boolean;
}

export default function SideBar() {
  const chats = useChatStore((s) => s.chats);
  const setChats = useChatStore((s) => s.setChats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const { firebaseUser } = useCurrentUser();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const ctxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToUserChats(firebaseUser.uid, setChats);
    return unsub;
  }, [firebaseUser, setChats]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      setPinnedChats(snap.data()?.pinnedChats || {});
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

  async function openChat(otherUid: string) {
    if (!firebaseUser) return;
    const chatId = await createOrGetChat(firebaseUser.uid, otherUid);
    setActiveChat(chatId);
    setQuery("");
    setUsers([]);
  }

  function handleCtxMenu(e: React.MouseEvent, chatId: string) {
    e.preventDefault();
    setCtxMenu({
      chatId,
      x: e.clientX,
      y: e.clientY,
      pinned: !!pinnedChats[chatId],
    });
  }

  async function handlePin() {
    if (!ctxMenu || !firebaseUser) return;
    await togglePinChat(firebaseUser.uid, ctxMenu.chatId, !ctxMenu.pinned);
    setCtxMenu(null);
  }

  const visibleChats = chats.filter((c) => !c.deleted);
  const pinned = visibleChats.filter((c) => pinnedChats[c.id]);
  const unpinned = visibleChats.filter((c) => !pinnedChats[c.id]);
  const sortedChats = [...pinned, ...unpinned];

  return (
    <>
      <section className="h-full w-80 flex flex-col bg-[#0F1620] border-r border-[#1F2A37]">
        <div className="p-5 border-b border-[#1F2A37]">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          <p className="text-xs text-zinc-400 mt-1">Your chats</p>
        </div>

        <div className="p-4 border-b border-[#1F2A37]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#1B2633] text-white outline-none border border-transparent focus:border-[#A78BFA] transition-all"
            />
          </div>
        </div>

        {query && (
          <div className="border-b border-[#1F2A37]">
            {loading && (
              <p className="text-xs text-zinc-400 px-4 py-2">Searching...</p>
            )}
            {!loading &&
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openChat(u.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#1B2633] transition-colors text-left"
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.username}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#A78BFA] flex items-center justify-center text-black font-semibold">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white">{u.username}</span>
                </button>
              ))}
            {!loading && users.length === 0 && (
              <p className="text-xs text-zinc-400 px-4 py-2">No users found</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 && (
            <p className="text-zinc-400 text-sm p-4">
              No chats yet. Search users above.
            </p>
          )}
          <div className="divide-y divide-[#1F2A37]">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                onContextMenu={(e) => handleCtxMenu(e, chat.id)}
                className="relative"
              >
                <ChatItem chat={chat} pinned={!!pinnedChats[chat.id]} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Link
            href="/settings"
            className="flex items-center gap-3 p-4 border-t border-[#1F2A37] hover:bg-[#1B2633] transition-colors"
          >
            <Settings size={18} className="text-[#A78BFA]" />
            <span className="text-sm text-zinc-200">Settings</span>
          </Link>
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 p-4 border-t border-[#1F2A37] hover:bg-[#1B2633] transition-colors w-full text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#1B2633] border border-[#A78BFA]/30 flex items-center justify-center flex-shrink-0">
              <UserCircle size={18} className="text-[#A78BFA]" />
            </div>
            <span className="text-sm text-zinc-200">Your profile</span>
          </button>
        </div>
      </section>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {ctxMenu && (
        <div
          ref={ctxRef}
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 999,
          }}
          className="min-w-[140px] rounded-xl bg-[#151D28] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handlePin}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Pin size={13} className={ctxMenu.pinned ? "text-[#A78BFA]" : ""} />
            {ctxMenu.pinned ? "Unpin chat" : "Pin chat"}
          </button>
        </div>
      )}
    </>
  );
}
