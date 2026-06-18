// "use client";

// import { Chat } from "@/types/chat";
// import { useChatStore } from "@/store/chat-store";
// import { formatTime } from "@/lib/format-time";

// interface Props {
//   chat: Chat;
// }

// export default function ChatItem({ chat }: Props) {
//   const activeChatId = useChatStore((state) => state.activeChatId);
//   const setActiveChat = useChatStore((state) => state.setActiveChat);
//   const isActive = activeChatId === chat.id;

//   const avatar = chat.participant?.avatar?.trim()
//     ? chat.participant.avatar
//     : `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.participant.username}`;

//   return (
//     <button
//       onClick={() => setActiveChat(chat.id)}
//       className={`w-full flex items-center gap-3 p-3 transition cursor-pointer
//       ${isActive ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
//     >
//       <div className="relative">
//         {chat.participant?.avatar ? (
//           <img
//             src={chat.participant.avatar}
//             className="w-12 h-12 rounded-full object-cover"
//           />
//         ) : (
//           <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white">
//             {chat.participant.username?.[0]?.toUpperCase()}
//           </div>
//         )}

//         {chat.participant.online && (
//           <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-zinc-900" />
//         )}
//       </div>
//       <div className="flex-1 text-left overflow-hidden">
//         <h3 className="font-medium truncate">{chat.participant.username}</h3>

//         <p className="text-sm text-zinc-400 truncate">{chat.lastMessage}</p>
//       </div>
//       <div className="flex flex-col items-end gap-1">
//         <span className="text-xs text-zinc-500">
//           {formatTime(chat.lastMessageTime)}
//         </span>
//         {chat.unreadCount > 0 && (
//           <span className="min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
//             {chat.unreadCount}
//           </span>
//         )}
//       </div>
//     </button>
//   );
// }
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
  const openedAt = useChatStore((s) => s.openedAt);

  const isActive = activeChatId === chat.id;

  const avatar = chat.participant?.avatar?.trim()
    ? chat.participant.avatar
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.participant.username}`;

  const lastTime =
    typeof chat.lastMessageTime === "number"
      ? chat.lastMessageTime
      : chat.lastMessageTime
      ? new Date(chat.lastMessageTime).getTime()
      : 0;

  const isNew =
    !!chat.lastMessage && (!openedAt[chat.id] || lastTime > openedAt[chat.id]);

  return (
    <button
      onClick={() => setActiveChat(chat.id)}
      className={`relative w-full flex items-center gap-3 p-3 transition cursor-pointer
        ${
          isActive
            ? "bg-zinc-800"
            : isNew
            ? "bg-[#A78BFA]/10"
            : "hover:bg-zinc-900"
        }`}
    >
      {isNew && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" />
      )}
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
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{chat.participant.username}</h3>
          {isNew && (
            <span className="text-[10px] px-2 py-[1px] rounded-full bg-[#A78BFA] text-black font-bold">
              new
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400 truncate">
          {chat.lastMessage || "No messages yet"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-zinc-500">
          {formatTime(chat.lastMessageTime)}
        </span>
      </div>
    </button>
  );
}
