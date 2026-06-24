"use client";

import { Chat } from "@/types/chat";
import { useChatStore } from "@/store/chat-store";
import { formatTime } from "@/lib/format-time";
import { isOnline } from "@/lib/formatLastSeen";
import { Pin } from "lucide-react";

interface Props {
  chat: Chat;
  pinned?: boolean;
}

export default function ChatItem({ chat, pinned }: Props) {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  const isActive = activeChatId === chat.id;
  const hasUnread = chat.unreadCount > 0;

  return (
    <button
      onClick={() => setActiveChat(chat.id)}
      className={`w-full h-[68px] flex-none flex items-center gap-3 px-3 transition-colors cursor-pointer overflow-hidden ${
        isActive
          ? "bg-zinc-800"
          : hasUnread
          ? "bg-[#A78BFA]/10"
          : "hover:bg-zinc-900"
      }`}
    >
      <div className="shrink-0 relative">
        {chat.participant?.avatar ? (
          <img
            src={chat.participant.avatar}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
            {chat.participant.username?.[0]?.toUpperCase()}
          </div>
        )}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0F1620] ${
            isOnline(chat.participant) ? "bg-[#34D399]" : "bg-zinc-600"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {pinned && <Pin size={10} className="text-[#A78BFA] shrink-0" />}
            <h3
              className={`text-sm font-medium truncate ${
                hasUnread ? "text-white" : "text-zinc-300"
              }`}
            >
              {chat.participant.username}
            </h3>
          </div>
          <span className="text-xs text-zinc-500 shrink-0">
            {formatTime(chat.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-xs truncate ${
              hasUnread ? "text-zinc-300" : "text-zinc-500"
            }`}
          >
            {chat.lastMessage || "No messages yet"}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A78BFA] text-black text-[10px] font-bold flex items-center justify-center">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
