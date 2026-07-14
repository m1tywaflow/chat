"use client";

import { Channel } from "@/types/channel";
import { Megaphone, Pin } from "lucide-react";
import { formatTime } from "@/lib/format-time";
import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
} from "@/store/theme-store";

const ACTIVE_ROW_BG = "#4C3B85";
const ACTIVE_ROW_HOVER_BG = "#54428F";

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

  return (
    <button
      onClick={onClick}
      className="w-full min-h-[64px] flex-none flex items-center gap-3 px-3 py-2 mx-2 my-[1px]  transition-colors duration-150 cursor-pointer overflow-hidden relative group"
      style={{
        background: active ? ACTIVE_ROW_BG : "transparent",
        width: "calc(100% - 10px)",
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
            background: "#151D28",
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
              className="text-[13.5px] font-semibold truncate leading-none"
              style={{ color: nameColor }}
            >
              {channel.name}
            </h3>
          </div>
          {lastPostTime && (
            <span
              className="text-[11px] shrink-0 tabular-nums"
              style={{ color: timeColor }}
            >
              {formatTime(lastPostTime)}
            </span>
          )}
        </div>

        <p
          className="text-[12px] truncate leading-tight"
          style={{ color: lastMsgColor }}
        >
          {channel.lastPostPreview || "No posts"}
        </p>
      </div>
    </button>
  );
}
