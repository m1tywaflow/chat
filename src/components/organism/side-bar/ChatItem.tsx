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
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";

interface Props {
  chat: Chat;
  pinned?: boolean;
}

const ACTIVE_ROW_BG =
  "linear-gradient(135deg, #3f247f 0%, #0a0b16 55%, #070912 100%)";

const ACTIVE_ROW_HOVER_BG =
  "linear-gradient(135deg, #4a2a94 0%, #0c0d1a 55%, #070912 100%)";

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
  const online = isOnline(chat.participant);

  const accent = "#A78BFA";
  const hoverBg = mode === "light" ? "#efeafd" : "rgba(255,255,255,0.04)";

  const nameColor = "#F3F1FA";
  const lastMsgColor = isActive ? "#D7D1EF" : "#8B85A0";
  const timeColor = isActive ? "#D7D1EF" : "#7C7690";
  const pinColor = isActive ? "#ffffff" : accent;

  const avatarFallbackBg = isActive
    ? "rgba(255,255,255,0.18)"
    : mode === "light"
    ? "#ddd6fe"
    : "#1e2a3a";
  const avatarFallbackColor = isActive ? "#ffffff" : accent;

  return (
    <button
      onClick={() => setActiveChat(chat.id)}
      className="w-full min-h-[64px] flex-none flex items-center gap-3 px-3 py-2 mx-2 my-[1px]  transition-colors duration-150 cursor-pointer overflow-hidden relative group"
      style={{
        background: isActive ? ACTIVE_ROW_BG : "transparent",
        width: "calc(100% - 9px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isActive
          ? ACTIVE_ROW_HOVER_BG
          : hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isActive
          ? ACTIVE_ROW_BG
          : "transparent";
      }}
    >
      <div className="shrink-0 relative">
        {chat.participant?.avatar ? (
          <img
            src={chat.participant.avatar}
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
            style={{
              background: avatarFallbackBg,
              color: avatarFallbackColor,
            }}
          >
            {chat.participant.username?.[0]?.toUpperCase()}
          </div>
        )}
        <span
          className="absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full border-[2px] transition-colors"
          style={{
            background: online
              ? "#34D399"
              : mode === "light"
              ? "#d1d5db"
              : "#3f3f46",
            borderColor: isActive ? ACTIVE_ROW_BG : theme.sideBarBg,
          }}
        />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-[3px]">
          <div className="flex items-center gap-1.5 min-w-0">
            {pinned && (
              <Pin size={9} className="shrink-0" style={{ color: pinColor }} />
            )}

            <h3
              className="text-[14.5px] font-semibold truncate leading-none"
              style={{ color: nameColor }}
            >
              {chat.participant.username}
            </h3>
            {chat.participant.featuredGift &&
              (() => {
                const gift = GIFTS[chat.participant.featuredGift!];
                if (!gift) return null;
                return (
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    title={gift.name}
                    className="shrink-0 w-4 h-4 object-contain"
                    style={{
                      filter: isActive
                        ? "drop-shadow(0 0 3px rgba(255,255,255,0.6))"
                        : `drop-shadow(0 0 3px ${
                            RARITY_COLORS[gift.rarity]
                          }90)`,
                    }}
                  />
                );
              })()}
          </div>
          <span
            className="text-[11px] shrink-0 tabular-nums"
            style={{ color: timeColor }}
          >
            {formatTime(chat.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[13px] font-bold truncate leading-tight"
            style={{ color: lastMsgColor }}
          >
            {chat.lastMessage || "No messages yet"}
          </p>
          {!!chat.unreadCount && (
            <span
              className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                background: isActive ? "rgba(255,255,255,0.25)" : "#7c3aed",
              }}
            >
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
