"use client";

import { Chat } from "@/types/chat";
import { useChatStore } from "@/store/chat-store";
import { formatTime } from "@/lib/format-time";

interface Props {
  chat: Chat;
}


export default function ChatItem({ chat }: Props) {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  const isActive = activeChatId === chat.id;
  const hasUnread = chat.unreadCount > 0;

  return (
    <button
      onClick={() => setActiveChat(chat.id)}
      className={`relative w-full flex items-center gap-3 p-3 transition cursor-pointer
        ${
          isActive
            ? "bg-zinc-800"
            : hasUnread
            ? "bg-[#A78BFA]/10"
            : "hover:bg-zinc-900"
        }`}
    >
      <div className="relative flex-shrink-0">
        {chat.participant?.avatar ? (
          <img
            src={chat.participant.avatar}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white">
            {chat.participant.username?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 text-left overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`font-medium truncate ${
              hasUnread ? "text-white" : "text-zinc-300"
            }`}
          >
            {chat.participant.username}
          </h3>
          <span className="text-xs text-zinc-500 flex-shrink-0">
            {formatTime(chat.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-sm truncate ${
              hasUnread ? "text-zinc-300" : "text-zinc-500"
            }`}
          >
            {chat.lastMessage || "No messages yet"}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#A78BFA] text-black text-[11px] font-bold flex items-center justify-center">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
