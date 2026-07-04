"use client";

import { Channel } from "@/types/channel";
import { Megaphone } from "lucide-react";
import { formatTime } from "@/lib/format-time";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";

export default function ChannelItem({
  channel,
  active,
  onClick,
}: {
  channel: Channel;
  active: boolean;
  onClick: () => void;
}) {
  const { mode, customTheme } = useThemeStore();

  const theme =
    mode === "dark"
      ? DEFAULT_DARK
      : mode === "light"
      ? DEFAULT_LIGHT
      : customTheme;
  const unreadCount = (channel as any).unreadCount || 0;
  const lastPostTime = (channel as any).lastPostTime;
  const hasUnread = unreadCount > 0;

  const activeBg = mode === "light" ? "#e0d9ff" : "rgba(167,139,250,0.12)";
  const hoverBg = mode === "light" ? "#f0ecff" : "rgba(255,255,255,0.04)";
  const unreadBg = mode === "light" ? "#f3f0ff" : "rgba(167,139,250,0.07)";

  let bg = "transparent";
  if (active) bg = activeBg;
  else if (hasUnread) bg = unreadBg;

  const nameColor =
    hasUnread || active ? theme.text : mode === "light" ? "#374151" : "#a1a1aa";
  const lastMsgColor = hasUnread
    ? mode === "light"
      ? "#4b5563"
      : "#d4d4d8"
    : mode === "light"
    ? "#9ca3af"
    : "#52525b";
  const timeColor = mode === "light" ? "#9ca3af" : "#52525b";

  return (
    <button
      onClick={onClick}
      className="w-full h-[72px] flex-none flex items-center gap-3 px-3 transition-all duration-150 cursor-pointer overflow-hidden relative group"
      style={{ background: bg }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!active)
          e.currentTarget.style.background = hasUnread
            ? unreadBg
            : "transparent";
      }}
    >
      {active && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[#A78BFA]" />
      )}

      <div className="shrink-0 relative ml-1">
        {channel.avatarUrl ? (
          <img
            src={channel.avatarUrl}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#A78BFA]/20 transition-all"
            style={
              active
                ? { boxShadow: "0 0 0 2px rgba(167,139,250,0.35)" }
                : undefined
            }
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
            style={{
              background: active
                ? "rgba(167,139,250,0.25)"
                : mode === "light"
                ? "#ddd6fe"
                : "#1e2a3a",
              color: active ? "#c4b5fd" : "#A78BFA",
              boxShadow: active ? "0 0 0 2px rgba(167,139,250,0.35)" : "none",
            }}
          >
            {channel.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-[2px]"
          style={{ background: "#151D28", borderColor: theme.sideBarBg }}
        >
          <Megaphone size={9} className="text-[#A78BFA]" />
        </div>
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-[3px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3
              className="text-[13.5px] font-semibold truncate leading-none transition-colors"
              style={{ color: active ? "#A78BFA" : nameColor }}
            >
              {channel.name}
            </h3>
          </div>
          {lastPostTime && (
            <span
              className="text-[11px] shrink-0 tabular-nums"
              style={{ color: hasUnread ? "#A78BFA" : timeColor }}
            >
              {formatTime(lastPostTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[12px] truncate leading-tight"
            style={{ color: lastMsgColor }}
          >
            {channel.lastPostPreview || "No posts"}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#A78BFA] text-black text-[10px] font-bold flex items-center justify-center shadow-sm shadow-purple-500/30 tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
