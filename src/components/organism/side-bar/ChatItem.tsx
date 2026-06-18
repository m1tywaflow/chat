"use client";

import { Chat } from "@/types/chat";
import { useChatStore } from "@/store/chat-store";

interface Props {
  chat: Chat;
}

export default function ChatItem({ chat }: Props) {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const isActive = activeChatId === chat.id;

  return (
    <button
      onClick={() => setActiveChat(chat.id)}
      className={`w-full flex items-center gap-3 p-3 transition cursor-pointer
      ${isActive ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
    >
      <div className="relative">
        <img
          src={chat.participant.avatar}
          alt={chat.participant.username}
          className="w-12 h-12 rounded-full"
        />

        {chat.participant.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-zinc-900" />
        )}
      </div>

      <div className="flex-1 text-left overflow-hidden">
        <h3 className="font-medium truncate">{chat.participant.username}</h3>

        <p className="text-sm text-zinc-400 truncate">{chat.lastMessage}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-zinc-500">{chat.lastMessageTime}</span>

        {chat.unreadCount > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
            {chat.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
