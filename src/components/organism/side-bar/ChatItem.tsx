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
import { openConversation } from "@/lib/mergeConversations";
import { getCustomEmoji } from "@/lib/customEmoji";

interface Props {
  chat: Chat;
  pinned?: boolean;
}

const ACTIVE_ROW_BG =
  "linear-gradient(135deg, #3f247f 0%, #0a0b16 55%, #070912 100%)";

const ACTIVE_ROW_HOVER_BG =
  "linear-gradient(135deg, #4a2a94 0%, #0c0d1a 55%, #070912 100%)";

// same ::sticker_id:: token format used in the chat window composer/bubbles
const STICKER_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
const STICKER_TOKEN_MATCH_RE = /^::([\w-]+)::$/;
const STICKER_TOKEN_ONLY_RE = /^(?:\s*::[\w-]+::\s*)+$/;
const STICKER_TOKEN_FIND_RE = /::([\w-]+)::/;

function isStickerOnlyText(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && STICKER_TOKEN_ONLY_RE.test(trimmed);
}

/**
 * Renders a chat's last-message preview the way Telegram's sidebar does:
 * plain text as-is, ::sticker_id:: tokens swapped for a tiny inline
 * thumbnail, and a sticker-only message collapsed to "thumbnail + Sticker"
 * instead of dumping the raw token text into the row.
 */
function LastMessagePreview({ text }: { text?: string }) {
  if (!text) return <>No messages yet</>;

  if (isStickerOnlyText(text)) {
    const firstToken = text.match(STICKER_TOKEN_FIND_RE);
    const custom = firstToken ? getCustomEmoji(firstToken[1]) : null;
    return (
      <span className="inline-flex items-center gap-1 align-middle">
        {custom && (
          <img
            src={custom.url}
            alt={custom.id}
            className="w-4 h-4 object-contain shrink-0"
          />
        )}
        <span>Sticker</span>
      </span>
    );
  }

  const parts = text.split(STICKER_TOKEN_SPLIT_RE);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(STICKER_TOKEN_MATCH_RE);
        if (match) {
          const custom = getCustomEmoji(match[1]);
          if (custom) {
            return (
              <img
                key={i}
                src={custom.url}
                alt={custom.id}
                className="inline-block w-4 h-4 object-contain align-text-bottom mx-0.5"
              />
            );
          }
        }
        return part ? <span key={i}>{part}</span> : null;
      })}
    </>
  );
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
      onClick={() => openConversation("chat", chat.id)}
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
            <LastMessagePreview text={chat.lastMessage} />
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
