"use client";

import { Channel } from "@/types/channel";
import { Megaphone, Pin } from "lucide-react";
import { formatTime } from "@/lib/format-time";
import { auth } from "@/lib/firebase";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";
import { getCustomEmoji } from "@/lib/customEmoji";

const ACTIVE_ROW_BG =
  "linear-gradient(135deg, #3f247f 0%, #0a0b16 55%, #070912 100%)";

const ACTIVE_ROW_HOVER_BG =
  "linear-gradient(135deg, #4a2a94 0%, #0c0d1a 55%, #070912 100%)";

// same ::sticker_id:: token format used in the channel composer/post body
// and in GroupItem's sidebar preview
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
 * Renders a channel's last-post preview the way Telegram's sidebar does:
 * plain text as-is, ::sticker_id:: tokens swapped for a tiny inline
 * thumbnail, and a sticker-only post collapsed to "thumbnail + Sticker"
 * instead of dumping the raw token text into the row. Mirrors GroupItem's
 * LastMessageBody 1:1 so channels, groups and 1:1 chats look identical.
 */
function LastMessageBody({ text }: { text?: string }) {
  if (!text) return null;

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

export default function ChannelItem({
  channel,
  active,
  pinned,
  onClick,
}: {
  channel: Channel;
  active: boolean;
  pinned?: boolean;
  onClick: () => void;
}) {
  const { mode, customTheme } = useThemeStore();

  const theme =
    mode === "dark"
      ? DEFAULT_DARK
      : mode === "light"
      ? DEFAULT_LIGHT
      : customTheme;

  const accent = "#A78BFA";
  const lastPostTime = (channel as any).lastPostTime;
  const hoverBg = mode === "light" ? "#efeafd" : "rgba(255,255,255,0.04)";

  const nameColor = "#F3F1FA";
  const lastMsgColor = active ? "#D7D1EF" : "#8B85A0";
  const timeColor = active ? "#D7D1EF" : "#7C7690";
  const pinColor = active ? "#ffffff" : accent;

  const avatarFallbackBg = active
    ? "rgba(255,255,255,0.18)"
    : mode === "light"
    ? "#ddd6fe"
    : "#1e2a3a";
  const avatarFallbackColor = active ? "#ffffff" : accent;

  const myUid = auth.currentUser?.uid;
  const unreadCount = myUid ? channel.unreadCounts?.[myUid] || 0 : 0;

  return (
    <button
      onClick={onClick}
      className="w-full min-h-[64px] flex-none flex items-center gap-3 px-3 py-2 mx-2 my-[1px]  transition-colors duration-150 cursor-pointer overflow-hidden relative group"
      style={{
        background: active ? ACTIVE_ROW_BG : "transparent",
        width: "calc(100% - 9px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = active
          ? ACTIVE_ROW_HOVER_BG
          : hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active
          ? ACTIVE_ROW_BG
          : "transparent";
      }}
    >
      <div className="shrink-0 relative">
        {channel.avatarUrl ? (
          <img
            src={channel.avatarUrl}
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
            {channel.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className="absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full flex items-center justify-center border-[2px]"
          style={{
            background: mode === "light" ? "#d1d5db" : "#3f3f46",
            borderColor: active ? ACTIVE_ROW_BG : theme.sideBarBg,
          }}
        >
          <Megaphone size={6} className="text-[#A78BFA]" />
        </div>
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
              {channel.name}
            </h3>
          </div>
          <span
            className="text-[11px] shrink-0 tabular-nums"
            style={{ color: timeColor }}
          >
            {lastPostTime ? formatTime(lastPostTime) : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[13px] font-bold truncate leading-tight"
            style={{ color: lastMsgColor }}
          >
            {channel.lastPostPreview ? (
              <LastMessageBody text={channel.lastPostPreview} />
            ) : (
              "No posts"
            )}
          </p>
          {unreadCount > 0 && (
            <span
              className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                background: active ? "rgba(255,255,255,0.25)" : "#7c3aed",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
