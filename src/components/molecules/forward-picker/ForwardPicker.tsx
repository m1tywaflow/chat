"use client";

import { useEffect, useState } from "react";
import { subscribeToUserChats } from "@/lib/firestore/chats";
import { subscribeToMyChannels } from "@/lib/firestore/channels";
import { X, Send, Megaphone } from "lucide-react";

interface Props {
  myUid: string;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onSelectChannel: (channelId: string) => void;
}

export default function ForwardPicker({
  myUid,
  onClose,
  onSelectChat,
  onSelectChannel,
}: Props) {
  const [chats, setChats] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToUserChats(myUid, setChats);
    return unsub;
  }, [myUid]);

  useEffect(() => {
    const unsub = subscribeToMyChannels(myUid, setChannels);
    return unsub;
  }, [myUid]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleChatClick(chatId: string) {
    if (sendingId) return;
    setSendingId(chatId);
    try {
      await onSelectChat(chatId);
    } finally {
      setSendingId(null);
    }
  }

  async function handleChannelClick(channelId: string) {
    if (sendingId) return;
    setSendingId(channelId);
    try {
      await onSelectChannel(channelId);
    } finally {
      setSendingId(null);
    }
  }

  const visibleChats = chats.filter((c) => !c.deleted);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-80 max-h-[70vh] rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden flex flex-col bg-[#0d0d1d]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-sm font-semibold text-white">Forward to…</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto chat-scroll flex-1">
          {channels.length === 0 && visibleChats.length === 0 && (
            <p className="text-xs text-zinc-500 px-4 py-3">
              Nothing to forward to yet.
            </p>
          )}

          {channels.map((c) => (
            <button
              key={c.id}
              disabled={!!sendingId}
              onClick={() => handleChannelClick(c.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.05] transition-colors text-left disabled:opacity-50 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#A78BFA]/15 text-[#A78BFA] shrink-0">
                <Megaphone size={14} />
              </div>
              <span className="truncate">{c.name}</span>
              {sendingId === c.id && (
                <span className="ml-auto text-[10px] text-zinc-500">…</span>
              )}
            </button>
          ))}

          {visibleChats.map((c) => (
            <button
              key={c.id}
              disabled={!!sendingId}
              onClick={() => handleChatClick(c.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.05] transition-colors text-left disabled:opacity-50 cursor-pointer"
            >
              {c.participant?.avatar ? (
                <img
                  src={c.participant.avatar}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.08] text-zinc-300 text-xs font-semibold shrink-0">
                  {c.participant?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="truncate">{c.participant?.username}</span>
              {sendingId === c.id && (
                <span className="ml-auto text-[10px] text-zinc-500">…</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
