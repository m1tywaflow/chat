// "use client";

// import { Chat } from "@/types/chat";
// import { useChatStore } from "@/store/chat-store";
// import { formatTime } from "@/lib/format-time";
// import { isOnline } from "@/lib/formatLastSeen";
// import { Pin } from "lucide-react";

// interface Props {
//   chat: Chat;
//   pinned?: boolean;
// }

// export default function ChatItem({ chat, pinned }: Props) {
//   const activeChatId = useChatStore((s) => s.activeChatId);
//   const setActiveChat = useChatStore((s) => s.setActiveChat);

//   const isActive = activeChatId === chat.id;
//   const hasUnread = chat.unreadCount > 0;

//   return (
//     <button
//       onClick={() => setActiveChat(chat.id)}
//       className={`w-full h-[68px] flex-none flex items-center gap-3 px-3 transition-colors cursor-pointer overflow-hidden ${
//         isActive
//           ? "bg-zinc-800"
//           : hasUnread
//           ? "bg-[#A78BFA]/10"
//           : "hover:bg-zinc-900"
//       }`}
//     >
//       <div className="shrink-0 relative">
//         {chat.participant?.avatar ? (
//           <img
//             src={chat.participant.avatar}
//             className="w-10 h-10 rounded-full object-cover"
//           />
//         ) : (
//           <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
//             {chat.participant.username?.[0]?.toUpperCase()}
//           </div>
//         )}
//         <span
//           className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0F1620] ${
//             isOnline(chat.participant) ? "bg-[#34D399]" : "bg-zinc-600"
//           }`}
//         />
//       </div>

//       <div className="flex-1 min-w-0 text-left">
//         <div className="flex items-center justify-between gap-2">
//           <div className="flex items-center gap-1.5 min-w-0">
//             {pinned && <Pin size={10} className="text-[#A78BFA] shrink-0" />}
//             <h3
//               className={`text-sm font-medium truncate ${
//                 hasUnread ? "text-white" : "text-zinc-300"
//               }`}
//             >
//               {chat.participant.username}
//             </h3>
//           </div>
//           <span className="text-xs text-zinc-500 shrink-0">
//             {formatTime(chat.lastMessageTime)}
//           </span>
//         </div>
//         <div className="flex items-center justify-between gap-2 mt-0.5">
//           <p
//             className={`text-xs truncate ${
//               hasUnread ? "text-zinc-300" : "text-zinc-500"
//             }`}
//           >
//             {chat.lastMessage || "No messages yet"}
//           </p>
//           {hasUnread && (
//             <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A78BFA] text-black text-[10px] font-bold flex items-center justify-center">
//               {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
//             </span>
//           )}
//         </div>
//       </div>
//     </button>
//   );
// }
"use client";

import { Chat } from "@/types/chat";
import { useChatStore } from "@/store/chat-store";
import { formatTime } from "@/lib/format-time";
import { isOnline } from "@/lib/formatLastSeen";
import { Pin } from "lucide-react";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";

interface Props {
  chat: Chat;
  pinned?: boolean;
}

export default function ChatItem({ chat, pinned }: Props) {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const { mode, customTheme } = useThemeStore();

  const theme =
    mode === "dark"
      ? DEFAULT_DARK
      : mode === "light"
      ? DEFAULT_LIGHT
      : customTheme;
  const isActive = activeChatId === chat.id;
  const hasUnread = chat.unreadCount > 0;
  const online = isOnline(chat.participant);

  const activeBg = mode === "light" ? "#e0d9ff" : "rgba(167,139,250,0.12)";
  const hoverBg = mode === "light" ? "#f0ecff" : "rgba(255,255,255,0.04)";
  const unreadBg = mode === "light" ? "#f3f0ff" : "rgba(167,139,250,0.07)";
  const borderIndicator =
    mode === "light" ? "#d1c4fe" : "rgba(255,255,255,0.06)";

  let bg = "transparent";
  if (isActive) bg = activeBg;
  else if (hasUnread) bg = unreadBg;

  const nameColor =
    hasUnread || isActive
      ? theme.text
      : mode === "light"
      ? "#374151"
      : "#a1a1aa";
  const lastMsgColor = hasUnread
    ? mode === "light"
      ? "#4b5563"
      : "#d4d4d8"
    : mode === "light"
    ? "#9ca3af"
    : "#52525b";
  const timeColor = mode === "light" ? "#9ca3af" : "#52525b";
  const borderColor = mode === "light" ? "#b8aef5" : "rgba(255,255,255,0.0)";

  return (
    <button
      onClick={() => setActiveChat(chat.id)}
      className="w-full h-[72px] flex-none flex items-center gap-3 px-3 transition-all duration-150 cursor-pointer overflow-hidden relative group"
      style={{ background: bg }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          e.currentTarget.style.background = hasUnread
            ? unreadBg
            : "transparent";
      }}
    >
      {isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[#A78BFA]" />
      )}

      <div className="shrink-0 relative ml-1">
        {chat.participant?.avatar ? (
          <img
            src={chat.participant.avatar}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#A78BFA]/20 transition-all"
            style={
              isActive
                ? { boxShadow: "0 0 0 2px rgba(167,139,250,0.35)" }
                : undefined
            }
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
            style={{
              background: isActive
                ? "rgba(167,139,250,0.25)"
                : mode === "light"
                ? "#ddd6fe"
                : "#1e2a3a",
              color: isActive ? "#c4b5fd" : "#A78BFA",
              boxShadow: isActive ? "0 0 0 2px rgba(167,139,250,0.35)" : "none",
            }}
          >
            {chat.participant.username?.[0]?.toUpperCase()}
          </div>
        )}
        <span
          className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full border-[2px] transition-colors"
          style={{
            background: online
              ? "#34D399"
              : mode === "light"
              ? "#d1d5db"
              : "#3f3f46",
            borderColor: theme.sideBarBg,
          }}
        />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-[3px]">
          <div className="flex items-center gap-1.5 min-w-0">
            {pinned && (
              <Pin size={9} className="shrink-0" style={{ color: "#A78BFA" }} />
            )}
            <h3
              className="text-[13.5px] font-semibold truncate leading-none transition-colors"
              style={{ color: isActive ? "#A78BFA" : nameColor }}
            >
              {chat.participant.username}
            </h3>
          </div>
          <span
            className="text-[11px] shrink-0 tabular-nums"
            style={{ color: hasUnread ? "#A78BFA" : timeColor }}
          >
            {formatTime(chat.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[12px] truncate leading-tight"
            style={{ color: lastMsgColor }}
          >
            {chat.lastMessage || "No messages yet"}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#A78BFA] text-black text-[10px] font-bold flex items-center justify-center shadow-sm shadow-purple-500/30 tabular-nums">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
